# Chess Logger

A fully-featured, modern CRUD web application developed for the *System Analysis and Design* course. Chess Logger allows chess players to log their matches, track their opening variations, analyze historical grandmaster matches, customize their player profile, set target ELO progress goals, and export/import game history.

## Features
- **Player Profile:** Customize your profile name, track current rating, and monitor progress toward a target ELO via dynamic progress bars.
- **Advanced Match Logs:** Add chess games with detailed notes, result metrics, color played, opening category, and full PGN notation.
- **Interactive PGN Player:** Load PGN chess notations and play through moves interactively on an animated visual board directly within the app.
- **Analytics & Data Visualizations:** Real-time dashboards displaying ELO progression charts, white/black performance statistics, and opening efficiency ratings.
- **Advanced Search & Filtering:** Filter games by date ranges, match results, color played, and search dynamically through opponent names and note contents.
- **Data Export & Import:** Export matches to JSON or CSV formats and import backups seamlessly.
- **Printable PDF Reports:** Instantly generate clean, styled, ink-saving, print-ready PDF performance report cards.

## Architecture & Technologies
- **Frontend:** Pure HTML5, Vanilla CSS, and Vanilla JavaScript. Built without heavy frameworks, utilizing asynchronous `fetch` APIs for a smooth Single Page Application (SPA) experience with a premium glassmorphic dark theme.
- **Backend:** Node.js with Express. Structured cleanly with controllers and routes.
- **Database:** SQLite. Local, lightweight, pre-seeded database.
- **API Documentation:** Integrated Swagger UI API documentation.

## Installation & Execution

Follow these steps to run the application locally:

1. Open your Terminal or Command Prompt (PowerShell, Bash, etc.).
2. Navigate to the project root directory (`chess-logger`).
3. Install dependencies by entering the `backend` directory:
   ```bash
   cd backend
   npm install
   ```
4. Start the Express server:
   ```bash
   node server.js
   ```

## Usage
- **Main Web Application:** Open your browser and navigate to [http://localhost:3000](http://localhost:3000) to view the client dashboard.
- **Interactive API Documentation (Swagger):** Go to [http://localhost:3000/api-docs](http://localhost:3000/api-docs) to view and test all available REST API endpoints.
