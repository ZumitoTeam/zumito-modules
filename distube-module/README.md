# 🎵 Distube Module

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://www.npmjs.com/package/@zumito-team/distube-module)
[![License](https://img.shields.io/badge/license-ISC-green.svg)](LICENSE)

The **Distube Module** adds advanced music playback capabilities to any Zumito bot instance by wrapping the [DisTube](https://distube.js.org/) ecosystem into a reusable package. It provides Discord commands, a background service, and a user panel page for managing the current queue.

## ✨ Features

- **🔗 DisTube Integration** – Handles queuing, playback, and filtering with support for YouTube, Spotify, SoundCloud, VK, and BandLab.
- **🎯 Slash & Prefix Commands** – Includes common music commands such as `play`, `skip`, `queue`, `loop`, `volume`, and more.
- **📱 User Panel Page** – Renders the current guild queue inside the Zumito user panel using `music-queue.ejs`.
- **🖼️ Canvas Preview** – Generates an image preview for the currently playing track via `@zumito-team/canvas-module`.
- **🌍 Multi-language Support** – Ships with English and Spanish translation files out of the box.

## 🚀 Installation

This module depends on the Zumito framework, the user panel module, and DisTube plugins. Install the package alongside the required peer dependency:

```bash
npm install @zumito-team/distube-module discord.js
```

> The host project must also provide Discord voice dependencies (`@discordjs/voice`, `@discordjs/opus`, `ffmpeg-static`, etc.) as required by DisTube.

## 📖 Usage

Register the module inside your `zumito.config.ts`:

```ts
import path from 'path';
import { type LauncherConfig } from 'zumito-framework';

const __dirname = process.cwd();

export const config: LauncherConfig = {
    bundles: [
        {
            path: path.join(__dirname, 'node_modules', '@zumito-team', 'user-panel-module'),
        },
        {
            path: path.join(__dirname, 'node_modules', '@zumito-team', 'distube-module'),
        },
    ],
};
```

After installation, run your bot as usual. Users can control music playback with Discord commands or manage the queue via the user panel page.

## 🎶 Available Commands

- `/play <url|query>` – Plays a song or adds it to the queue.
- `/skip` – Skips to the next song.
- `/queue` – Shows the current queue.
- `/loop` – Toggles loop mode.
- `/volume <level>` – Adjusts the volume (0-100).
- And many more...

## 🤝 Contributions

Contributions are welcome! Open an issue or send a pull request in the main repository.

## 📄 License

This project is under the ISC license.