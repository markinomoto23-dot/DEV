# DEV — Local Server

This project can run locally with the bundled SQLite database.

## Windows

1. Make sure Node.js and Python are installed.
2. Double-click `start-local.bat`.
3. Open http://127.0.0.1:5173

The script starts:
- Frontend: Vite on `127.0.0.1:5173`
- Backend: Django on `127.0.0.1:8000`

## macOS / Linux

```bash
./start-local.sh
```

Then open http://127.0.0.1:5173

## Manual startup

Backend:

```bash
cd backend
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Database

Local development uses the included `backend/db.sqlite3`.

The local `.env` deliberately does not contain the previously configured hosted database credentials. Set `DATABASE_URL` yourself only if you intentionally want to use an external PostgreSQL database.
