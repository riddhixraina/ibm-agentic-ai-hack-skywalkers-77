# Local Testing Guide

## Step 1: Start Backend

```bash
# Make sure you're in the root directory
cd c:\Users\RiddhiRainaPrasad\Downloads\ibm_watsonx

# Install dependencies (if not done)
npm install

# Start backend server
npm start
```

Backend will run on `http://localhost:8080`

**Verify it's working:**
```bash
curl http://localhost:8080/health
```

Should return: `{"status":"ok","service":"ResolveAI 360",...}`

---

## Step 2: Start Frontend

**Open a NEW terminal window:**

```bash
# Navigate to frontend directory
cd c:\Users\RiddhiRainaPrasad\Downloads\ibm_watsonx\frontend

# Install dependencies
npm install

# Create .env file
echo VITE_BACKEND_URL=http://localhost:8080 > .env

# Start frontend dev server
npm run dev
```

Frontend will run on `http://localhost:3000`

---

## Step 3: Open Dashboard

Open browser: **http://localhost:3000**

You should see:
- ✅ Connection status (green dot = connected)
- 📊 Dashboard with stats
- 🔄 Flow Executions tab
- 🚨 Crisis Monitor tab
- 📝 Event Log tab

---

## Step 4: Test Backend Endpoints

**Test health:**
```bash
curl http://localhost:8080/health
```

**Test tool endpoint:**
```bash
curl -X POST http://localhost:8080/api/skills/create-ticket \
  -H "x-api-key: XYp7gHzl26ELm3ZSOwof4DuQFvaP5bjNJ0sIiBAxVnq8KCGTdyeh9rRWkUM1ct" \
  -H "Content-Type: application/json" \
  -d "{\"customer\":{\"id\":\"TEST\"},\"title\":\"Test\",\"text\":\"Test\",\"priority\":\"P3\"}"
```

**Test flow trigger:**
```bash
curl -X POST http://localhost:8080/api/trigger-flow \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Is IBM cloud down?\",\"channel\":\"twitter\",\"metadata\":{\"retweets\":120}}"
```

---

## Step 5: Test Real-time Updates

1. **Keep frontend open** in browser
2. **Send a test event** from backend (or trigger a flow)
3. **Watch frontend update** in real-time via Socket.io

You can also use the test script:
```bash
# In root directory
node test-payloads.js
```

This will trigger test flows and you'll see updates in the frontend!

---

## Troubleshooting

### Frontend not connecting
- Check backend is running on port 8080
- Verify `.env` file has correct `VITE_BACKEND_URL`
- Check browser console for errors
- Verify Socket.io connection in Network tab

### Backend not starting
- Check if port 8080 is available
- Verify `.env` file exists with required variables
- Check for errors in terminal

### No real-time updates
- Verify Socket.io is working (check backend logs)
- Check browser console for Socket.io connection
- Make sure backend is emitting events

### CORS errors
- Backend already has CORS enabled
- If issues persist, check `server.js` CORS config

---

## What to Test

1. ✅ Backend health endpoint
2. ✅ Frontend loads and connects
3. ✅ Socket.io connection (green dot)
4. ✅ Dashboard shows stats
5. ✅ Trigger test flow - see updates
6. ✅ Flow Executions tab shows data
7. ✅ Crisis Monitor shows crises
8. ✅ Event Log shows events

---

## Next Steps After Testing

Once local testing works:
1. Deploy backend
2. Deploy frontend
3. Update frontend `.env` with production backend URL
4. Test end-to-end

---

**Ready to test!** 🚀

