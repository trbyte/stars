
## Setup
Download [Node.js](https://nodejs.org/en/download/).
Run this followed commands:

``` bash
# Install dependencies (only the first time)
npm install

# Run the local server at localhost:8080
npm run dev

# Build for production (Electron + Vite)

```bash
npm run build
```

* Generates the Vite production build in `dist/`.
* You can then run the app in Electron:

```bash
npm run electron
```

# Create Windows Installer (.exe)

```bash
npm run dist
```

* Uses **electron-builder**.
* Output installer will be in `dist_electron/`.

---

## Project Structure

```
star-app/
├─ dist/                   # Vite production build output
├─ src/
│  ├─ script.js            # Three.js star scene and interactions
│  └─ preload.js           # Electron preload script
├─ main.js                 # Electron main process
├─ package.json
├─ README.md
└─ node_modules/
```

---

## Controls

* **Orbit Controls**: Drag with mouse to rotate camera
* **Keyboard**:

  * `W` / `S` → Move forward/back
  * `A` / `D` → Move left/right
  * `Q` / `E` → Move up/down
* **Click Star**: Highlight and show coordinates in info box
* **GUI**: Adjust star material and bloom effect in 