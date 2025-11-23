# ResolveAI 360 Frontend

React frontend dashboard for ResolveAI 360 Crisis Management System.

## Features

- 📊 **Dashboard** - Overview of system health and statistics
- 🔄 **Flow Executions** - View and monitor watsonx Orchestrate flow executions
- 🚨 **Crisis Monitor** - Real-time crisis detection alerts
- 📝 **Event Log** - Complete event stream with filtering

## Tech Stack

- React 18
- Vite
- Socket.io Client (real-time updates)
- Tailwind CSS
- Recharts (charts)

## Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env and set VITE_BACKEND_URL to your backend URL
```

3. **Start development server:**
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variable: `VITE_BACKEND_URL`
4. Deploy

### Netlify

1. Push to GitHub
2. Import in Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Set environment variable: `VITE_BACKEND_URL`

## Environment Variables

- `VITE_BACKEND_URL` - Your backend URL (default: http://localhost:8080)

## Features

### Real-time Updates
- Connects to backend via Socket.io
- Receives live updates for:
  - Flow executions
  - Crisis detections
  - Events
  - Ops notifications

### Flow Executions
- View all flow runs from watsonx Orchestrate
- Filter by status (running, completed, failed)
- See execution details
- Real-time status updates

### Crisis Monitor
- Real-time crisis alerts
- Crisis type and priority
- Actions taken
- Metadata

### Event Log
- All events in real-time
- Filter by event type
- Search functionality
- Event details

