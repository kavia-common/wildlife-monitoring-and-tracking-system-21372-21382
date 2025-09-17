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

