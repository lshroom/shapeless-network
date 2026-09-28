@echo off
echo Installing/checking dependencies (Flask + Demucs)...
python -m pip install --quiet --disable-pip-version-check flask flask-cors demucs soundfile
if errorlevel 1 (
  echo.
  echo Could not install dependencies. Make sure Python 3.9+ is installed and on your PATH.
  echo Download Python from https://python.org if needed, then run this file again.
  pause
  exit /b 1
)
echo.
echo Starting the local stem splitter at http://127.0.0.1:5599
echo Leave this window open, then go back to shapelessworld.org and use the Stems button.
echo Close this window (or press Ctrl+C) when you're done.
echo.
python stem_server.py
pause
