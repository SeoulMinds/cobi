# React Frontend

## Overview

This is the React frontend for SeoulMinds Night Action. Built with:
- **Vite** - Lightning-fast build tool
- **React 18** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **Axios** - HTTP client

## Quick Start

```bash
# Install dependencies
npm install

# Start dev server (auto-reload on save)
npm run dev
# Open http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── App.tsx           # Main component (chat interface)
├── api.ts            # API client & endpoints
├── main.tsx          # React entry point
└── index.css         # Tailwind styles
```

## Features

- 💬 Real-time chat interface
- 📨 Send messages to backend AI
- 📜 View message history
- 🟢 Backend health status
- 🎨 Beautiful Tailwind UI
- 📱 Responsive design

## Development

### Hot Reload
Changes to `.tsx` and `.css` files auto-reload in the browser.

### TypeScript
Strict mode enabled. All components should be typed.

### Tailwind CSS
Utility classes for styling. See `tailwind.config.js` for customization.

## Build

```bash
npm run build
```

Outputs optimized build to `dist/` folder.

## Deployment

### Docker
```bash
docker build -t seoulminds-frontend .
docker run -p 5173:5173 seoulminds-frontend
```