# Clip Color Changer — Adobe CEP Plugin

A dockable panel for **After Effects** and **Premiere Pro** that lets you change the label color of selected layers, clips, and project items with a **single click**.

---

## Features

- **16 Adobe label colors** displayed as color swatches
- **After Effects**: changes selected layers in the active comp AND selected project panel items
- **Premiere Pro**: changes selected timeline clips (via internal commands) AND selected project panel items
- Dark UI matching Adobe's panel aesthetic
- Hover tooltips showing color names
- Animated feedback (pulse + toast notification)
- Single undo step in AE (Ctrl+Z friendly)

---

## Installation

### Step 1 — Enable debug mode (one time, Windows)

Open PowerShell as Administrator and run:

```powershell
# For CEP 11 (CC 2021+) — most common
New-Item -Path "HKCU:\Software\Adobe\CSXS.11" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.11" -Name "PlayerDebugMode" -Value "1" -Type String

# Also set for CEP 10, 12 to be safe
New-Item -Path "HKCU:\Software\Adobe\CSXS.10" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.10" -Name "PlayerDebugMode" -Value "1" -Type String
New-Item -Path "HKCU:\Software\Adobe\CSXS.12" -Force | Out-Null
Set-ItemProperty -Path "HKCU:\Software\Adobe\CSXS.12" -Name "PlayerDebugMode" -Value "1" -Type String
```

> You only need to do this **once**. It allows unsigned/development extensions to load.

### Step 2 — Copy plugin folder

Copy the `ClipColorChanger` folder to:

**Windows:**
```
%AppData%\Adobe\CEP\extensions\
```
Full path: `C:\Users\<YourName>\AppData\Roaming\Adobe\CEP\extensions\ClipColorChanger\`

**macOS:**
```
~/Library/Application Support/Adobe/CEP/extensions/ClipColorChanger/
```

### Step 3 — Open the panel

1. Launch **After Effects** or **Premiere Pro**
2. Go to **Window → Extensions → Clip Color Changer**
3. The panel docks like any other Adobe panel

> If you don't see it under Extensions, restart the app after copying the folder.

---

## Usage

1. **Select** layers in a comp (AE) or clips on the timeline (Pr)
2. **Click** any color swatch in the panel
3. Done — label color changes instantly

Works with multiple selections. In After Effects, also works on items selected in the Project panel.

---

## Color Reference

| Swatch | Index | Name |
|--------|-------|------|
| ✕ | 0 | None (clear) |
| 🟣 | 1 | Violet |
| 🔵 | 2 | Iris |
| 🟢 | 3 | Caribbean |
| 💜 | 4 | Lavender |
| 🔵 | 5 | Cerulean |
| 🟢 | 6 | Forest |
| 🌹 | 7 | Rose |
| 🟠 | 8 | Mango |
| 🟣 | 9 | Purple |
| 🔵 | 10 | Blue |
| 🟢 | 11 | Teal |
| 🔴 | 12 | Magenta |
| 🟡 | 13 | Tan |
| 🟢 | 14 | Green |
| 🟤 | 15 | Brown |
| 🟡 | 16 | Yellow |

---

## Notes on Premiere Pro

Adobe's scripting API does **not** expose a direct method to set the label color of a placed timeline clip (TrackItem). This plugin uses `app.executeCommand()` with Premiere's internal label command IDs — the same method used by many professional Premiere Pro tools. The clip must be **selected on the timeline** before clicking a color.

---

## File Structure

```
ClipColorChanger/
├── CSXS/
│   └── manifest.xml      ← Extension configuration
├── css/
│   └── style.css         ← Panel styles
├── js/
│   ├── CSInterface.js    ← Adobe CEP bridge library
│   └── main.js           ← Panel logic
├── jsx/
│   └── host.jsx          ← ExtendScript (AE + Premiere)
├── index.html            ← Panel UI
└── README.md
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Panel not in Window → Extensions | Confirm folder is in CEP extensions dir; restart app |
| Colors not changing | Make sure clips/layers are **selected** first |
| "No active composition" toast | Click inside a comp before clicking a color (AE) |
| Panel shows blank white | Debug mode registry key not set (Step 1) |

---

## License

MIT License — see [LICENSE](./LICENSE) for full text.

Copyright (c) 2026 Clip Color Changer Contributors.
Free to use, modify, and distribute.
