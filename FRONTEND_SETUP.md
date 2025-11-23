# Frontend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create `.env` file in `frontend/` directory:

```env
VITE_BACKEND_URL=http://localhost:8080
```

For production, set to your deployed backend URL:
```env
VITE_BACKEND_URL=https://your-backend.vercel.app
```

### 3. Start Development Server

```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

### 4. Access the Dashboard

Open browser: `http://localhost:3000`

You'll see:
- **Dashboard** - Overview and stats
- **Flow Executions** - watsonx Orchestrate flow runs
- **Crisis Monitor** - Real-time crisis alerts
- **Event Log** - All events stream

## Features

### Real-time Updates
- Connects to backend via Socket.io
- Shows live updates as flows execute
- Displays crisis detections in real-time
- Event stream updates automatically

### Flow Executions
- Fetches executions from watsonx Orchestrate API
- Shows execution status, duration, details
- Filter by status (all, running, completed, failed)
- Click to see full execution details

### Crisis Monitor
- Displays all detected crises
- Shows crisis type, priority, score
- Lists actions taken
- Real-time updates

### Event Log
- All events from Socket.io
- Filter by event type
- Search functionality
- View event details

## Backend Integration

The frontend connects to your backend which:
1. Fetches data from watsonx Orchestrate API
2. Receives callbacks from Orchestrate
3. Emits Socket.io events to frontend

### Backend Endpoints Used:
- `GET /api/executions` - Get flow executions
- `GET /api/executions/:id` - Get execution details
- `GET /api/flows` - Get all flows
- `GET /api/flows/:id` - Get flow details
- `GET /health` - Health check
- Socket.io connection for real-time updates

## Deployment

### Deploy to Vercel (Free)

1. **Push to GitHub:**
```bash
git add frontend/
git commit -m "Add React frontend dashboard"
git push
```

2. **Deploy on Vercel:**
   - Go to https://vercel.com
   - Import your GitHub repo
   - Set root directory to `frontend`
   - Add environment variable: `VITE_BACKEND_URL` = your backend URL
   - Deploy

3. **Your frontend will be live!**

### Deploy to Netlify

1. Push to GitHub
2. Go to https://netlify.com
3. Import project
4. Build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
5. Add environment variable: `VITE_BACKEND_URL`
6. Deploy

## Troubleshooting

### Frontend not connecting to backend
- Check `VITE_BACKEND_URL` in `.env`
- Make sure backend is running
- Check CORS settings in backend

### No real-time updates
- Verify Socket.io connection (check browser console)
- Make sure backend Socket.io is working
- Check network tab for WebSocket connection

### Executions not showing
- Verify backend can access watsonx Orchestrate API
- Check `IBM_APIKEY` is set in backend
- Verify Orchestrate API endpoints are correct

## Next Steps

1. ✅ Frontend created
2. ✅ Backend endpoints added
3. ⏭️ Deploy backend
4. ⏭️ Deploy frontend
5. ⏭️ Configure Orchestrate callbacks
6. ⏭️ Test end-to-end

---

**Your React frontend is ready!** 🎉

