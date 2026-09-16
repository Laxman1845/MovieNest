import hashlib
import hmac
import os
import re
from typing import Annotated

from dotenv import load_dotenv

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials, firestore

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, Field, field_validator

import razorpay


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# CONFIGURATION
# ============================================================

PRICE_PER_SEAT = 200

VALID_TIME_SLOTS = {
    "10:00 AM",
    "02:30 PM",
    "07:00 PM",
}

# ============================================================
# VALID SEATS
# ============================================================
#
# A1  - A10
# B1  - B10
# C1  - C10
# D1  - D10
# E1  - E10
# F1  - F10
# G1  - G10
# H1  - H10
#
# Examples that MUST be valid:
# G8
# F8
# G9
# H10
#
# Examples that MUST be invalid:
# A0
# A11
# I1
# G0
# G11
# AA8
#

SEAT_PATTERN = re.compile(
    r"^[A-H](10|[1-9])$"
)

API_VERSION = "1.0.1-seat-validation-fix"


# ============================================================
# FIREBASE INITIALIZATION
# ============================================================

def init_firebase() -> None:

    if firebase_admin._apps:
        return

    cred_path = os.getenv(
        "GOOGLE_APPLICATION_CREDENTIALS",
        "serviceAccountKey.json",
    )

    # --------------------------------------------------------
    # LOCAL DEVELOPMENT
    # --------------------------------------------------------

    if os.path.exists(cred_path):

        cred = credentials.Certificate(
            cred_path
        )

    # --------------------------------------------------------
    # PRODUCTION
    # --------------------------------------------------------

    elif os.getenv("FIREBASE_PRIVATE_KEY"):

        raw_key = os.environ[
            "FIREBASE_PRIVATE_KEY"
        ].strip()

        # Remove accidental surrounding quotes
        if (
            raw_key.startswith('"')
            and raw_key.endswith('"')
        ) or (
            raw_key.startswith("'")
            and raw_key.endswith("'")
        ):
            raw_key = raw_key[1:-1]

        # Convert escaped \n into real newlines
        private_key = raw_key.replace(
            "\\n",
            "\n",
        )

        if "BEGIN PRIVATE KEY" not in private_key:

            raise RuntimeError(
                "FIREBASE_PRIVATE_KEY does not look like a valid PEM key. "
                "Check that it was pasted correctly."
            )

        project_id = os.getenv(
            "FIREBASE_PROJECT_ID"
        )

        client_email = os.getenv(
            "FIREBASE_CLIENT_EMAIL"
        )

        if not project_id:
            raise RuntimeError(
                "FIREBASE_PROJECT_ID is missing."
            )

        if not client_email:
            raise RuntimeError(
                "FIREBASE_CLIENT_EMAIL is missing."
            )

        cred = credentials.Certificate(
            {
                "type": "service_account",
                "project_id": project_id,
                "private_key": private_key,
                "client_email": client_email,
                "token_uri": (
                    "https://oauth2.googleapis.com/token"
                ),
            }
        )

    # --------------------------------------------------------
    # NO CREDENTIALS
    # --------------------------------------------------------

    else:

        raise RuntimeError(
            "No Firebase credentials found. "
            "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, "
            "and FIREBASE_PRIVATE_KEY environment variables, "
            "or provide serviceAccountKey.json locally."
        )

    firebase_admin.initialize_app(
        cred
    )


init_firebase()

db = firestore.client()


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="MovieNest API",
    version=API_VERSION,
)


# ============================================================
# CORS
# ============================================================

cors_origins_raw = os.getenv(
    "CORS_ORIGINS",
    "*",
)

allow_origins = [
    origin.strip()
    for origin in cors_origins_raw.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "OPTIONS",
    ],
    allow_headers=["*"],
)


# ============================================================
# HELPER - VALIDATE SEAT
# ============================================================

def is_valid_seat(seat: str) -> bool:

    if not isinstance(
        seat,
        str,
    ):
        return False

    seat = seat.strip().upper()

    return bool(
        re.fullmatch(
            r"[A-H](10|[1-9])",
            seat,
        )
    )


# ============================================================
# NORMALIZE SEAT LIST
# ============================================================

def normalize_seats(
    value,
) -> list[str]:

    if not isinstance(
        value,
        list,
    ):
        raise ValueError(
            "Seats must be provided as a list."
        )

    seats = []

    for raw_seat in value:

        if not isinstance(
            raw_seat,
            str,
        ):
            raise ValueError(
                f"Invalid seat value: {raw_seat!r}"
            )

        seat = (
            raw_seat
            .strip()
            .upper()
        )

        if not seat:
            raise ValueError(
                "Seat cannot be empty."
            )

        seats.append(
            seat
        )

    if not seats:

        raise ValueError(
            "At least one seat must be selected."
        )

    if len(seats) > 10:

        raise ValueError(
            "You can book a maximum of 10 seats."
        )

    if len(set(seats)) != len(seats):

        duplicates = [
            seat
            for seat in set(seats)
            if seats.count(seat) > 1
        ]

        raise ValueError(
            "Duplicate seats are not allowed: "
            + ", ".join(
                sorted(duplicates)
            )
        )

    for seat in seats:

        if not is_valid_seat(
            seat
        ):

            raise ValueError(
                f"Invalid seat '{seat}'. "
                "Valid seats are A1-A10, B1-B10, "
                "C1-C10, D1-D10, E1-E10, "
                "F1-F10, G1-G10, and H1-H10."
            )

    return seats


# ============================================================
# BOOKING INPUT MODEL
# ============================================================

class BookingInput(BaseModel):

    movie_id: str = Field(
        min_length=1,
        max_length=200,
    )

    time_slot: str

    seats: list[str] = Field(
        min_length=1,
        max_length=10,
    )

    # --------------------------------------------------------
    # TIME SLOT VALIDATION
    # --------------------------------------------------------

    @field_validator(
        "time_slot",
        mode="before",
    )
    @classmethod
    def valid_time_slot(
        cls,
        value,
    ) -> str:

        if not isinstance(
            value,
            str,
        ):
            raise ValueError(
                "Time slot must be a string."
            )

        value = value.strip()

        if value not in VALID_TIME_SLOTS:

            raise ValueError(
                f"That showtime is not available. "
                f"Available showtimes: "
                f"{', '.join(sorted(VALID_TIME_SLOTS))}"
            )

        return value

    # --------------------------------------------------------
    # SEAT VALIDATION
    # --------------------------------------------------------

    @field_validator(
        "seats",
        mode="before",
    )
    @classmethod
    def valid_seats(
        cls,
        value,
    ) -> list[str]:

        return normalize_seats(
            value
        )


# ============================================================
# PAYMENT CONFIRMATION MODEL
# ============================================================

class PaymentConfirmation(
    BookingInput
):

    order_id: str = Field(
        min_length=1,
    )

    payment_id: str = Field(
        min_length=1,
    )

    signature: str = Field(
        min_length=1,
    )


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    authorization: Annotated[
        str | None,
        Header(),
    ] = None,
) -> dict:

    # --------------------------------------------------------
    # CHECK AUTHORIZATION HEADER
    # --------------------------------------------------------

    if (
        not authorization
        or not authorization.startswith(
            "Bearer "
        )
    ):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign-in required.",
        )

    # --------------------------------------------------------
    # EXTRACT TOKEN
    # --------------------------------------------------------

    token = (
        authorization
        .removeprefix(
            "Bearer "
        )
        .strip()
    )

    if not token:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sign-in required.",
        )

    # --------------------------------------------------------
    # VERIFY FIREBASE TOKEN
    # --------------------------------------------------------

    try:

        return firebase_auth.verify_id_token(
            token
        )

    except (
        ValueError,
        firebase_auth.InvalidIdTokenError,
        firebase_auth.ExpiredIdTokenError,
    ):

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired sign-in token.",
        )


# ============================================================
# RAZORPAY CLIENT
# ============================================================

def razorpay_client() -> razorpay.Client:

    key_id = os.getenv(
        "RAZORPAY_KEY_ID"
    )

    key_secret = os.getenv(
        "RAZORPAY_KEY_SECRET"
    )

    if not key_id or not key_secret:

        raise HTTPException(
            status_code=500,
            detail="Payment service is not configured.",
        )

    return razorpay.Client(
        auth=(
            key_id,
            key_secret,
        )
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health() -> dict[str, str]:

    return {
        "status": "ok",
        "version": API_VERSION,
    }


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root() -> dict[str, str]:

    return {
        "message": "MovieNest API is running",
        "version": API_VERSION,
        "seatValidation": "A1-H10",
    }


# ============================================================
# DEBUG SEAT VALIDATION
# ============================================================
#
# This endpoint is ONLY to verify that the deployed backend
# is running the corrected validator.
#
# Example:
# POST /api/test-seats
#
# {
#     "seats": ["G8", "F8"]
# }
#
# Expected:
#
# {
#     "valid": true,
#     "seats": ["G8", "F8"]
# }
#

class SeatTestInput(BaseModel):

    seats: list[str]

    @field_validator(
        "seats",
        mode="before",
    )
    @classmethod
    def validate_test_seats(
        cls,
        value,
    ) -> list[str]:

        return normalize_seats(
            value
        )


@app.post("/api/test-seats")
def test_seats(
    payload: SeatTestInput,
) -> dict:

    return {
        "valid": True,
        "seats": payload.seats,
        "message": "Seat validation is working correctly.",
        "version": API_VERSION,
    }


# ============================================================
# CREATE RAZORPAY ORDER
# ============================================================

@app.post("/api/orders")
def create_order(
    payload: BookingInput,
    user: dict = Depends(
        get_current_user
    ),
) -> dict:

    # --------------------------------------------------------
    # CHECK MOVIE
    # --------------------------------------------------------

    movie = (
        db.collection(
            "movies"
        )
        .document(
            payload.movie_id
        )
        .get()
    )

    if not movie.exists:

        raise HTTPException(
            status_code=404,
            detail="Movie not found.",
        )

    # --------------------------------------------------------
    # GET RAZORPAY KEY
    # --------------------------------------------------------

    key_id = os.getenv(
        "RAZORPAY_KEY_ID"
    )

    if not key_id:

        raise HTTPException(
            status_code=500,
            detail="Razorpay key is not configured.",
        )

    # --------------------------------------------------------
    # CHECK CURRENTLY BOOKED SEATS
    # --------------------------------------------------------

    seat_ref = (
        db.collection(
            "showSeats"
        )
        .document(
            f"{payload.movie_id}_{payload.time_slot}"
        )
    )

    seat_snapshot = seat_ref.get()

    if seat_snapshot.exists:

        seat_data = (
            seat_snapshot.to_dict()
        )

        booked_seats = (
            seat_data.get(
                "bookedSeats",
                [],
            )
        )

    else:

        booked_seats = []

    # --------------------------------------------------------
    # CHECK WHETHER ANY SEAT IS ALREADY BOOKED
    # --------------------------------------------------------

    already_booked = [
        seat
        for seat in payload.seats
        if seat in booked_seats
    ]

    if already_booked:

        raise HTTPException(
            status_code=409,
            detail=(
                "The following seat(s) are already booked: "
                + ", ".join(
                    already_booked
                )
            ),
        )

    # --------------------------------------------------------
    # CALCULATE AMOUNT
    # --------------------------------------------------------

    amount = (
        len(payload.seats)
        * PRICE_PER_SEAT
        * 100
    )

    # --------------------------------------------------------
    # CREATE RAZORPAY ORDER
    # --------------------------------------------------------

    try:

        order = (
            razorpay_client()
            .order
            .create(
                {
                    "amount": amount,
                    "currency": "INR",
                    "receipt": (
                        f"movie_"
                        f"{payload.movie_id}_"
                        f"{user['uid']}"
                    )[:40],
                    "notes": {
                        "movieId": (
                            payload.movie_id
                        ),
                        "timeSlot": (
                            payload.time_slot
                        ),
                        "userId": (
                            user["uid"]
                        ),
                        "seats": ",".join(
                            payload.seats
                        ),
                    },
                }
            )
        )

    except Exception as error:

        print(
            "Razorpay order creation error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to create payment order.",
        )

    # --------------------------------------------------------
    # RETURN ORDER
    # --------------------------------------------------------

    return {
        "orderId": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "keyId": key_id,
    }


# ============================================================
# CONFIRM BOOKING
# ============================================================

@app.post("/api/bookings")
def confirm_booking(
    payload: PaymentConfirmation,
    user: dict = Depends(
        get_current_user
    ),
) -> dict:

    key_secret = os.getenv(
        "RAZORPAY_KEY_SECRET"
    )

    if not key_secret:

        raise HTTPException(
            status_code=500,
            detail="Payment service is not configured.",
        )

    # ========================================================
    # VERIFY RAZORPAY SIGNATURE
    # ========================================================

    expected_signature = hmac.new(
        key_secret.encode(),
        (
            f"{payload.order_id}"
            f"|"
            f"{payload.payment_id}"
        ).encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(
        expected_signature,
        payload.signature,
    ):

        raise HTTPException(
            status_code=403,
            detail="Payment verification failed.",
        )

    # ========================================================
    # CHECK MOVIE
    # ========================================================

    movie = (
        db.collection(
            "movies"
        )
        .document(
            payload.movie_id
        )
        .get()
    )

    if not movie.exists:

        raise HTTPException(
            status_code=404,
            detail="Movie not found.",
        )

    # ========================================================
    # FIRESTORE REFERENCES
    # ========================================================

    seat_ref = (
        db.collection(
            "showSeats"
        )
        .document(
            f"{payload.movie_id}_{payload.time_slot}"
        )
    )

    booking_ref = (
        db.collection(
            "bookings"
        )
        .document()
    )

    transaction = db.transaction()

    # ========================================================
    # RESERVE SEATS
    # ========================================================

    @firestore.transactional
    def reserve_seats(txn):

        seat_snapshot = (
            seat_ref.get(
                transaction=txn
            )
        )

        if seat_snapshot.exists:

            seat_data = (
                seat_snapshot.to_dict()
            )

            booked_seats = (
                seat_data.get(
                    "bookedSeats",
                    [],
                )
            )

        else:

            booked_seats = []

        # ----------------------------------------------------
        # CHECK WHETHER SEAT WAS JUST BOOKED
        # ----------------------------------------------------

        already_booked = [
            seat
            for seat in payload.seats
            if seat in booked_seats
        ]

        if already_booked:

            raise HTTPException(
                status_code=409,
                detail=(
                    "The following seat(s) were just booked: "
                    + ", ".join(
                        already_booked
                    )
                ),
            )

        # ----------------------------------------------------
        # BOOKING DATA
        # ----------------------------------------------------

        booking_data = {

            "userId":
                user["uid"],

            "userEmail":
                user.get(
                    "email",
                    "",
                ),

            "movieId":
                payload.movie_id,

            "timeSlot":
                payload.time_slot,

            "seats":
                payload.seats,

            "amount":
                (
                    len(payload.seats)
                    * PRICE_PER_SEAT
                ),

            "paymentId":
                payload.payment_id,

            "orderId":
                payload.order_id,

            "status":
                "confirmed",

            "createdAt":
                firestore.SERVER_TIMESTAMP,
        }

        # ----------------------------------------------------
        # UPDATE BOOKED SEATS
        # ----------------------------------------------------

        updated_booked_seats = (
            booked_seats
            + payload.seats
        )

        txn.set(
            seat_ref,
            {
                "bookedSeats":
                    updated_booked_seats,
            },
            merge=True,
        )

        # ----------------------------------------------------
        # CREATE BOOKING
        # ----------------------------------------------------

        txn.create(
            booking_ref,
            booking_data,
        )

        return booking_data

    # ========================================================
    # EXECUTE TRANSACTION
    # ========================================================

    try:

        booking = reserve_seats(
            transaction
        )

    except HTTPException:

        raise

    except Exception as error:

        print(
            "Booking transaction error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Booking could not be completed.",
        ) from error

    # ========================================================
    # RETURN SUCCESS
    # ========================================================

    return {
        "bookingId":
            booking_ref.id,

        "amount":
            booking["amount"],
    }