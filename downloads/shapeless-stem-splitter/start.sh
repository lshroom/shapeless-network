#!/bin/bash
set -e
echo "Installing/checking dependencies (Flask + Demucs)..."
python3 -m pip install --quiet --disable-pip-version-check flask flask-cors demucs soundfile
echo ""
echo "Starting the local stem splitter at http://127.0.0.1:5599"
echo "Leave this terminal open, then go back to shapelessworld.org and use the Stems button."
echo "Close this terminal (or press Ctrl+C) when you're done."
echo ""
python3 stem_server.py
