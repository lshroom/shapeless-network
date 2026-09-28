# Local stem splitter (for shapelessworld.org's "Stems" button)

This runs Demucs on YOUR OWN computer to split a song into stems (vocals, drums,
bass, guitar, piano, other). shapeless-1974's "🔪 Stems" button talks to it at
`http://127.0.0.1:5599`, and so does shapelessworld.org's "Split automatically"
button in the Feed composer's Full (4 stems) mode — the audio never leaves your
machine until you choose to split it, and the resulting stems are then uploaded
into the song as normal tracks so your collaborators can hear/mute/replace them.

## Setup (one time)

```
pip install flask flask-cors demucs
```

A GPU speeds this up a lot but isn't required — CPU works, just slower.

## Run it

```
python tools/stem_server.py
```

Leave that terminal open. You'll see something like:

```
[stem-server] listening on http://127.0.0.1:5599  model=htdemucs_6s
[stem-server] access token (only needed for tunneled/remote requests, e.g. from your phone): 7Kj9x...
[stem-server] to reach this from your phone away from home, see tools/STEM_SERVER_README.md (Cloudflare Tunnel)
```

Now go back to your song in shapeless-1974 (or shapelessworld.org, on the same
PC), and split as usual. Close the terminal (or Ctrl+C) when you're done — it
doesn't need to run all the time, only while you're actively splitting a song.

## Reaching it from your phone, away from home (Cloudflare Tunnel)

Browsing shapelessworld.org from your PC already works with no extra setup —
`127.0.0.1` just means "this same computer." Your phone, on a different
network, can't reach `127.0.0.1` of your PC at all — that's normal browser/
network behavior, not a bug. To let your phone reach it anyway, run a free
Cloudflare Tunnel that gives your PC's stem server a real `https://` address:

1. **One-time install:** download `cloudflared` from
   https://github.com/cloudflare/cloudflared/releases (Windows: grab the
   `.exe`, no account needed for a quick/anonymous tunnel).
2. **Every time you want your phone to reach it:** with `stem_server.py`
   already running in one terminal, open another and run:
   ```
   cloudflared tunnel --url http://127.0.0.1:5599
   ```
   It prints a line like `https://random-words-1234.trycloudflare.com` —
   that's your PC's stem server, reachable from anywhere.
3. On shapelessworld.org's phone browser, open the Full (4 stems) section,
   tap **⚙ configure remote splitter**, and paste in that `https://...` URL
   plus the access token the server printed on startup. It's saved on that
   phone only (not shared with anyone else who opens the site).
4. Every future `cloudflared tunnel` run gives you a **new** random address
   (the free/quick-tunnel mode doesn't keep one address) — you'll need to
   re-paste it into the phone's settings each time you restart the tunnel.
   A stable address is possible with a free Cloudflare account + a domain,
   but that's more setup than this needs for now.

The token is what actually keeps this safe once it's reachable from the
internet — anyone without it gets refused; only requests from this same PC
(`127.0.0.1`, which is what shapeless-1974 and a same-PC shapelessworld.org
tab use) skip the token check.

## Notes

- First run downloads the Demucs model (a few hundred MB) — that's a one-time
  wait.
- Splitting a full song typically takes anywhere from ~20 seconds to a few
  minutes depending on your CPU/GPU and song length.
- This is per-person: everyone who wants to split songs runs their own copy —
  nothing is shared or uploaded until after the split finishes.
- The access token lives in `tools/stem_server_token.txt`, generated the first
  time the server runs. Delete that file and restart the server to rotate it
  (any phone using the old token will need the new one re-pasted in).
