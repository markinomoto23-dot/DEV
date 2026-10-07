#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "Starting Django backend on http://127.0.0.1:8000"
(
  cd backend
  if [ -x venv/bin/python ]; then
    venv/bin/python manage.py migrate
    venv/bin/python manage.py runserver 127.0.0.1:8000
  else
    python3 -m pip install -r requirements.txt
    python3 manage.py migrate
    python3 manage.py runserver 127.0.0.1:8000
  fi
) &
BACKEND_PID=$!

echo "Starting React frontend on http://127.0.0.1:5173"
(
  cd frontend
  npm install
  npm run dev -- --host 127.0.0.1
) &
FRONTEND_PID=$!

trap 'kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true' EXIT INT TERM
echo "Open http://127.0.0.1:5173 in your browser."
wait
