"""
Demucs runner that monkey-patches torchaudio to use soundfile
instead of torchcodec (which needs FFmpeg DLLs we don't have).
Usage: python tools/demucs_run.py -n htdemucs_6s -o <out> [--mp3] <input_file>
"""
import os, sys

# MUST set TORCH_HOME before any torch import
os.environ["TORCH_HOME"] = os.path.join(os.path.expanduser("~"), ".cache", "torch")

import torch
import numpy as np
import soundfile as _sf

# --- monkey-patch torchaudio.load + torchaudio.save via soundfile ---
def _sf_load(path, frame_offset=0, num_frames=-1, normalize=True, channels_first=True, format=None, backend=None):
    data, sr = _sf.read(str(path), dtype="float32", always_2d=True)
    # data shape: (frames, channels) -> (channels, frames)
    t = torch.from_numpy(data.T)
    if not channels_first:
        t = t.T
    if frame_offset:
        t = t[..., frame_offset:]
    if num_frames > 0:
        t = t[..., :num_frames]
    return t, sr

def _sf_save(path, src, sample_rate, encoding=None, bits_per_sample=None, format=None, backend=None, compression=None):
    arr = src.numpy()
    if arr.ndim == 2:
        arr = arr.T  # (channels, frames) -> (frames, channels)
    _sf.write(str(path), arr, sample_rate)

import types, importlib
ta = types.ModuleType("torchaudio")
ta.load = _sf_load
ta.save = _sf_save
ta.__version__ = "patched-soundfile"
# stub out anything demucs might touch
ta.transforms = types.ModuleType("torchaudio.transforms")
ta.functional = types.ModuleType("torchaudio.functional")
sys.modules["torchaudio"] = ta
sys.modules["torchaudio.transforms"] = ta.transforms
sys.modules["torchaudio.functional"] = ta.functional

# also stub _torchcodec so torchaudio sub-imports don't explode
sys.modules["torchaudio._torchcodec"] = types.ModuleType("torchaudio._torchcodec")
sys.modules["torchaudio._internal"] = types.ModuleType("torchaudio._internal")

# Now run demucs CLI with the remaining sys.argv
from demucs.separate import main
sys.argv = [sys.argv[0]] + sys.argv[1:]
main()
