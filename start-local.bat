@echo off
setlocal
cd /d "%~dp0"

echo Starting Django backend on http://127.0.0.1:8000
start "DEV - Backend" cmd /k "cd /d "%~dp0backend" && if exist venv\Scripts\python.exe (venv\Scripts\python.exe manage.py migrate && venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000) else (py -m pip install -r requirements.txt && py manage.py migrate && py manage.py runserver 127.0.0.1:8000)"

echo Starting React frontend on http://127.0.0.1:5173
start "DEV - Frontend" cmd /k "cd /d "%~dp0frontend" && npm install && npm run dev"

echo.
echo Open http://127.0.0.1:5173 in your browser.
