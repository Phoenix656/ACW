# ACW – Alert System

A simple **Alert‑system** web app that tracks expirable documents (e.g., vehicle registration, insurance) and sends reminder notifications via email or SMS.

## Features
- JWT‑based authentication (user & master roles)
- Document CRUD with customizable reminder thresholds (`renewal_due_days`)
- File upload support (Multer stores files under `uploads/`)
- Hourly scheduler creates notifications when a document approaches its expiry dates.
- Admin (master) view lists all users.
- React front‑end using MUI, Axios, and JWT‑decoded auth context.

## Quick start
```bash
# 1️⃣ Install server deps
cd server && npm install

# 2️⃣ Install client deps
cd ../client && npm install

# 3️⃣ Start PostgreSQL (system service or Docker) and run migrations
export DATABASE_URL=postgres://postgres:secret@localhost:5432/acw_db
psql $DATABASE_URL -f schema.sql
psql $DATABASE_URL -f migrations/001_add_renewal_status.sql

# 4️⃣ Run the API
cd ../server && npm run dev   # or `node server.js`

# 5️⃣ Run the UI (new terminal)
cd ../client && npm start
```

Open `http://localhost:3000` in a browser, register a user, and start adding documents.

## Configuration
Create a `.env` file in the project root (copy from `.env.example`). Typical variables:
```
PORT=5000
DATABASE_URL=postgres://postgres:secret@localhost:5432/acw_db
JWT_SECRET=super-secret-key
# SMTP (optional email notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_user
SMTP_PASSWORD=your_pass
SMTP_FROM=no-reply@example.com
# Twilio (optional SMS notifications)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_NUMBER=+1234567890
```

## Tests
```bash
cd server
npm test
```

## License
ISC
