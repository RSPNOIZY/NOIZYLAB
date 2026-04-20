---
description: Voice pipeline — voice bridge, audio MCP, TTS, Automator workflows, Rogue Amoeba suite.
paths:
  - "scripts/voice-bridge-server.js"
  - "dreamchamber-audio-mcp/**/*.py"
  - "power-automate-flows/**"
---

# VOICE PIPELINE

## Architecture

```
Rob speaks → Siri/Google → Power Automate → Voice Bridge (8080) → Command Router → Response → TTS
```

## Voice Bridge Server

- **File**: `scripts/voice-bridge-server.js` (323 lines)
- **Port**: 8080 on GOD.local
- **Auth**: Bearer token (`VOICE_AUTH_TOKEN`)
- **Commands**: claude, deploy, dreamchamber, compare, status, cascade

## DreamChamber Audio MCP (NEW)

FastMCP server for multi-AI voice collaboration. Controls:
- **Loopback** — virtual audio devices (one-time GUI config, persists)
- **Audio Hijack** — session capture via `.ahcommand` JS scripting
- **SoundSource** — per-app mute/unmute/volume via AppleScript

13 MCP tools: open, close, bring_in, remove, mute, unmute, solo, unmute_all, volume, record, stop_recording, status, setup_guide.

**Path**: `dreamchamber-audio-mcp/server.py`
**Install**: `pip install -e ~/NOIZYLAB/dreamchamber-audio-mcp`

## Automator Suite (macOS)

- 230+ workflows designed
- Active: SendToClaude, CompareAI, DeployProject, GORUNFREE-Speak (TTS), Copy Full Path
- Power Automate: `power-automate-flows/Voice-To-Claude.json`

## TaleSpin Audio Archive

- 235-660+ professional audio assets from 2020 VR project (unreleased)
- RSP voice performances (50-150 WAV files)
- Original music compositions (20-40 files)
- All TaleSpin audio is RSP_001's IP
- Discovery script: `scripts/talespin-finder.sh`

## Audio Configuration

- Sample rate: 48000 Hz
- Bit depth: 32-bit
- Rob's frequency: 396 Hz (liberation)
- Interface: Apollo
- Monitor: Built-in Output or Apollo monitors
