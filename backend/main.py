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

# Load environment variables from .env file
load_dotenv()

PRICE_PER_SEAT = 200
VALID_TIME_SLOTS = {"10:00 AM", "02:30 PM", "07:00 PM"}
SEAT_PATTERN = re.compile(r"^[A-D][1-6]$")


def init_firebase() -> None:
    if not firebase_admin._apps:
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
        else:
            firebase_admin.initialize_app()


init_firebase()
db = firestore.client()

app = FastAPI(title="MovieNest API", version="1.0.0")

# CORS setup
cors_origins_raw = os.getenv("CORS_ORIGINS", "http://127.0.0.1:5500,http://localhost:5500")
allow_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class BookingInput(BaseModel):
    movie_id: str = Field(min_length=1, max_length=200)
    time_slot: str
    seats: list[str] = Field(min_length=1, max_length=6)

    @field_validator("time_slot")
    @classmethod
    def valid_time_slot(cls, value: str) -> str:
        if value not in VALID_TIME_SLOTS:
            raise ValueError("That showtime is not available.")
        return value

    @field_validator("seats")
    @classmethod
    def valid_seats(cls, value: list[str]) -> list[str]:
        if len(set(value)) != len(value) or not all(SEAT_PATTERN.fullmatch(seat) for seat in value):
            raise ValueError("One or more seats are invalid.")
        return value


class PaymentConfirmation(BookingInput):
    order_id: str = Field(min_length=1)
    payment_id: str = Field(min_length=1)
    signature: str = Field(min_length=1)


def get_current_user(authorization: Annotated[str | None, Header()] = None) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sign-in required.")
    
    token = authorization.removeprefix("Bearer ").strip()
    try:
        return firebase_auth.verify_id_token(token)
    except (ValueError, firebase_auth.InvalidIdTokenError, firebase_auth.ExpiredIdTokenError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired sign-in token.")


def razorpay_client() -> razorpay.Client:
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        raise HTTPException(status_code=500, detail="Payment service is not configured.")
    return razorpay.Client(auth=(key_id, key_secret))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/orders")
def create_order(payload: BookingInput, user: dict = Depends(get_current_user)) -> dict:
    movie = db.collection("movies").document(payload.movie_id).get()
    if not movie.exists:
        raise HTTPException(status_code=404, detail="Movie not found.")

    key_id = os.getenv("RAZORPAY_KEY_ID")
    order = razorpay_client().order.create(
        {
            "amount": len(payload.seats) * PRICE_PER_SEAT * 100,
            "currency": "INR",
            "receipt": f"movie_{payload.movie_id}_{user['uid']}"[:40],
            "notes": {
                "movieId": payload.movie_id,
                "timeSlot": payload.time_slot,
                "userId": user["uid"],
            },
        }
    )
    return {
        "orderId": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "keyId": key_id,
    }


@app.post("/api/bookings")
def confirm_booking(payload: PaymentConfirmation, user: dict = Depends(get_current_user)) -> dict:
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_secret:
        raise HTTPException(status_code=500, detail="Payment service is not configured.")

    # Verify signature
    expected_signature = hmac.new(
        key_secret.encode(),
        f"{payload.order_id}|{payload.payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, payload.signature):
        raise HTTPException(status_code=403, detail="Payment verification failed.")

    movie = db.collection("movies").document(payload.movie_id).get()
    if not movie.exists:
        raise HTTPException(status_code=404, detail="Movie not found.")

    seat_ref = db.collection("showSeats").document(f"{payload.movie_id}_{payload.time_slot}")
    booking_ref = db.collection("bookings").document()
    transaction = db.transaction()

    @firestore.transactional
    def reserve_seats(txn):
        seat_snapshot = seat_ref.get(transaction=txn)
        booked_seats = seat_snapshot.to_dict().get("bookedSeats", []) if seat_snapshot.exists else []
        
        if any(seat in booked_seats for seat in payload.seats):
            raise HTTPException(status_code=409, detail="One or more selected seats were just booked.")

        booking_data = {
            "userId": user["uid"],
            "userEmail": user.get("email", ""),
            "movieId": payload.movie_id,
            "timeSlot": payload.time_slot,
            "seats": payload.seats,
            "amount": len(payload.seats) * PRICE_PER_SEAT,
            "paymentId": payload.payment_id,
            "orderId": payload.order_id,
            "status": "confirmed",
            "createdAt": firestore.SERVER_TIMESTAMP,
        }
        
        txn.set(seat_ref, {"bookedSeats": booked_seats + payload.seats}, merge=True)
        txn.create(booking_ref, booking_data)
        return booking_data

    try:
        booking = reserve_seats(transaction)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(status_code=500, detail="Booking could not be completed.") from error

    return {"bookingId": booking_ref.id, "amount": booking["amount"]}
@app.get("/")
def root() -> dict[str, str]:
    return {"message": "MovieNest API is running"}

  