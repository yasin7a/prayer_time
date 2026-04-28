# Daily Prayer Reminder

A minimal Electron desktop app that calculates prayer times for Bangladesh, schedules reminder popups, and logs responses to a local JSON file.

## Run

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the app:
   ```bash
   npm start
   ```

## Features

- Uses `adhan` to calculate daily prayer times
- Schedules reminders with `setTimeout`
- Shows a popup asking `Did you pray [Prayer Name]?`
- Retries every 5 minutes after `NO`, up to 5 times
- Stores log entries in `data/logs.json`
- No database required
# prayer_time
