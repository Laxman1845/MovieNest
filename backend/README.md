# MovieNest FastAPI backend

## Run locally

1. Create a Firebase service account in Firebase Console and set `GOOGLE_APPLICATION_CREDENTIALS` to its JSON file, or set `FIREBASE_SERVICE_ACCOUNT_JSON`.
2. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from Razorpay. The secret must stay on the server.
3. Install dependencies: `python -m pip install -r backend/requirements.txt`
4. Start the API: `python -m uvicorn backend.main:app --reload --port 8000`

The browser expects the API at `http://127.0.0.1:8000`. Set `window.MOVIENEST_API_URL` before `app.js` if deploying elsewhere.

## Booking cancellation and refunds

Signed-in customers can cancel a confirmed booking through
`POST /api/bookings/{booking_id}/cancel`. The backend requests a full refund
from Razorpay, marks the booking as cancelled, and releases its seats. A
booking's creation date is treated as its show date, and cancellation is
rejected once its configured showtime has started in the `Asia/Kolkata`
timezone. Refunds that cannot be confirmed are marked for support rather than
being retried automatically.
