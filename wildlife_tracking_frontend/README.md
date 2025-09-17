# AnimalTrackr Frontend (React + TailwindCSS)

A React application scaffold for the AnimalTrackr project with TailwindCSS styling, React Router v6 routes, Auth context, and role-based navigation.

## Quick Start

- Install dependencies:
  - npm install
- Start dev server:
  - npm start

TailwindCSS is preconfigured via PostCSS and will process styles during development.

## Routes

- Public: `/login`, `/register`
- Protected: `/dashboard`, `/animals`, `/devices`, `/alerts`, `/analytics`, `/profile`
- Admin only: `/admin`

## Auth

A minimal AuthContext persists a token, role, and user in localStorage for rapid prototyping. Replace `login()` in `src/contexts/AuthContext.js` with real API calls later.

## Theming

The Ocean Professional theme is available via Tailwind config and CSS variables in `src/index.css` and `src/App.css`.

## Environment

- REACT_APP_API_URL (optional): URL of the backend API.

## Telemetry integration

- Endpoints expected:
  - POST `/telemetry` — ingest single point or an array of points. Body example:
    ```json
    { "animalId": 101, "deviceId": "collar-42", "ts": "2024-01-01T12:00:00Z", "lat": 12.34, "lng": 56.78, "speed": 1.2, "battery": 90 }
    ```
  - GET `/telemetry?animalId=...&deviceId=...&start=ISO&end=ISO&limit=1000` — returns array or `{ data: [...] }`.

- JWT: All requests include `Authorization: Bearer <token>` header automatically via `src/services/api.js`.

- UI:
  - Dashboard: filter by Animal ID or Device ID, demo ingestion button, and a playback/timeline component.
  - Animals: when an animal is selected, a telemetry timeline appears under details.

- Date/Range:
  - Timeline supports start/end selection via `datetime-local` inputs; values are converted to ISO-8601 UTC for API calls.
