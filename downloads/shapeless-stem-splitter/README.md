# Local stem splitter (for shapelessworld.org's "Stems" button)

This runs Demucs on YOUR OWN computer to split a song into stems (vocals, drums,
bass, guitar, piano, other). shapeless-1974's "🔪 Stems" button talks to it at
`http://127.0.0.1:5599` — the audio never leaves your machine until you choose
to split it, and the resulting stems are then uploaded into the song as normal
tracks so your collaborators can hear/mute/replace them.

## Setup (one time)

```
pip install flask flask-cors demucs
```

A GPU speeds this up a lot but isn't required — CPU works, just slower.

## Run it

```
python tools/stem_server.py
```

Leave that terminal open. You'll see:

```
[stem-server] listening on http://127.0.0.1:5599  model=htdemucs_6s
```

Now go back to your song in shapeless-1974, tap **🔪 Stems**, and pick a file.
Close the terminal (or Ctrl+C) when you're done — it doesn't need to run all
the time, only while you're actively splitting a song.

## Notes

- First run downloads the Demucs model (a few hundred MB) — that's a one-time
  wait.
- Splitting a full song typically takes anywhere from ~20 seconds to a few
  minutes depending on your CPU/GPU and song length.
- This is per-person: everyone who wants to split songs runs their own copy —
  nothing is shared or uploaded until after the split finishes.
