# CMPM120-Platformer_Game

# Echoes of the Vanguard
## Production Release & Technical Changelog
**Version:** 1.0.0 Stable  
**Engine Framework:** Phaser 3 / Arcade Physics  
**Typography Core:** MedievalSharp (Google Fonts API)  
**Interface Assets:** Kenney Fantasy UI Module  

---

### Project Architecture & Specifications

| Component | Specification | Operational Focus |
| :--- | :--- | :--- |
| **Render Pipeline** | Canvas / WebGL | Pixel-perfect hardware scaling |
| **Physics Module** | Arcade Physics | High-velocity AABB collision grids |
| **Typeface** | MedievalSharp | Immersive dark fantasy legibility |
| **UI Framework** | 9-Slice Grid Scaling | Distortion-free dynamic panel sizing |

---

## 1. Architectural Evolution: Monolithic to Modular

The entire gameplay pipeline has been refactored away from an unmaintainable monolithic structure into an object-oriented, decoupled architecture. This ensures strict isolation of scope, clean memory management, and reusable components.

### Core Architecture Components

> ### `index.html`
> Acts as the absolute bootstrap layer. Injects the Google Fonts API string and executes an invisible DOM text placeholder script. This forces the browser to download and cache the `MedievalSharp` asset immediately on page load, completely eliminating Phaser's canvas-rendering font race conditions.

> ### `src/main.js`
> The global environment configuration center. Dictates canvas geometry, registers the active scene index array, and enforces strict physics constants.

> ### `src/Scenes/Load.js`
> Manages the preloader pipeline and system memory allocation. Handles the streaming extraction of XML texture atlases, JSON tile maps, and raw audio files while compiling global animation loop registries.

> ### `src/Scenes/Menu.js`
> Coordinates the primary title screen UI. It maps out navigation instructions and structural open-source asset attributions framed perfectly inside 9-slice graphical plates.

> ### `src/Scenes/Play.js`
> The primary gameplay controller. Directs static tilemap layer collisions, player physics overlays, user inventory states, camera matrices, and coordinate-bounded logic updates.

> ### `src/Scenes/GameOver.js`
> Handles end-state routing conditions. Evaluates win/loss data payloads from the play scene to dynamically render contextual fantasy alerts and processes keyboard-driven reset commands.

> ### `src/Sprites/Player.js`
> Custom extension module implementing the **Sprite Prefab Class Pattern**. Fully encapsulates internal input listeners, custom velocity curves, crouching profiles, localized particle footprint tracking, and floating heart damage matrices.

> ### `src/Utils/Spawner.js`
> A static asynchronous builder utility. Automatically parses coordinate nodes out of the Tiled object layer to instantiate game items, structural barrier blocks, and drives the background AI heuristics of patrolling hazards.

---

## 🎨 2. Visual Overhaul & Interface Re-Design

```text
====================================================================
                        RE-DESIGN PALETTE
   UI Panels: Kenney Slate-Gray Gray-Fills (#panel-028)
   Typography: MedievalSharp Font 
   Text Fill 1: Obsidian Charcoal (#1a1a1a) -> High Readability
   Text Fill 2: Dark Crimson Red  (#8b0000) -> Alert Signaling
====================================================================