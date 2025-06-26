# FBA Project

This project includes both a frontend (React) and a backend (Python) that integrates with Firebase and Amazon's Selling Partner API.

---

## 📁 Project Structure

FBA_Project/
├── backend/
│ └── credential.py # Contains SP-API and AWS credentials
├── frontend/
│ └── .env # Contains Firebase and backend config
└── README.md

---

## 🔐 Environment & Secret Configuration

### 🔸 Frontend: `.env` file

Create a `.env` file inside the `frontend/` folder with the following content:

```env
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=

REACT_APP_BACKEND_URL=

credentials = dict(
    refresh_token='Atzr|IwE....',
    lwa_app_id='amzn1.a....',
    lwa_client_secret='amzn1.....',
    aws_access_key_id='AKIA....',
    aws_secret_access_key='F4Xs....',
    role_arn='arn:aws:iam....'
)