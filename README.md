# Namaz Reminder & Tracker

A production-ready Electron desktop application for prayer reminders with local JSON storage and background tray support.

## Project layout

- `main/` — Electron main process entry, window and tray helpers, IPC handlers
- `renderer/` — UI entry point, styling, and modular UI components
- `preload/` — secure IPC bridge exposing only permitted APIs
- `services/` — prayer calculations, scheduling, notification and reminder retry logic
- `storage/` — atomic JSON persistence and schema definitions
- `utils/` — shared time helpers and logging utilities
- `config/` — global runtime settings

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm start
   ```

## Features

- Calculates daily prayer times for Fajr, Dhuhr, Asr, Maghrib, and Isha
- Triggers notifications at prayer time
- Keeps reminding until a user response is recorded
- Stores responses locally in JSON files
- Runs in the system tray for background use
- Handles system resume and app restarts safely

