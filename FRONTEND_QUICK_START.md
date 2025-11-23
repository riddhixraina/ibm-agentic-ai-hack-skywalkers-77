# Frontend Quick Start Guide

## 🚀 ResolveAI 360 Frontend

A React dashboard that displays watsonx Orchestrate agent responses and tool status.

---

## ✨ Features

### 1. **watsonx Agent Tab** 🤖
- Test agent with prompts
- View agent responses with crisis detection
- See tool calls and results
- Example responses included for demo

### 2. **Tools Status Tab** 🔧
- View all 6 tools:
  - CreateTicket 🎫
  - PostSocial 📱
  - NotifyOps 🔔
  - FetchKB 📚
  - IngestEvent 💾
  - SocialMediaMonitor 👁️
- Test tool connections
- See connection status

### 3. **Dashboard Tab** 📊
- System stats
- Health status
- Recent executions
- Real-time events

### 4. **Other Tabs**
- Flow Executions
- Crisis Monitor
- Event Log

---

## 🏃 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Backend URL

Create `.env` file in `frontend/` directory:

```bash
VITE_BACKEND_URL=https://ibm-agentic-ai-hack-skywalkers-77.vercel.app
```

### 3. Start Development Server

```bash
npm run dev
```

Frontend will run on: `http://localhost:3000`

---

## 🎯 Using the Frontend

### Test watsonx Agent

1. Go to **"watsonx Agent"** tab
2. Enter a test prompt:
   ```
   Analyze this crisis: "Is IBM cloud down? can't access my bucket since 10:05. many people complaining #ibmclouddown"
   ```
3. Click **"Analyze"**
4. View the response:
   - Crisis detection result
   - Priority classification
   - Generated response
   - Tools called

### Check Tools Status

1. Go to **"Tools Status"** tab
2. See all 6 tools with their status
3. Click **"Test Connection"** on any tool
4. View connection status

### View Example Responses

1. In **"watsonx Agent"** tab
2. Check **"Show example responses"**
3. See 3 pre-loaded example responses

---

## 📦 Build for Production

```bash
npm run build
```

Output will be in `frontend/dist/`

---

## 🌐 Deploy to Vercel

1. Go to https://vercel.com
2. Import your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - `VITE_BACKEND_URL` = `https://ibm-agentic-ai-hack-skywalkers-77.vercel.app`
5. Deploy

---

## 🎨 Features in Detail

### watsonx Agent Component

- **Test Input**: Enter prompts to test the agent
- **Response Display**: Shows:
  - Crisis detection (Yes/No)
  - Crisis score (0-100%)
  - Crisis type (outage, PR, billing, etc.)
  - Priority (P1, P2, P3)
  - Generated response message
  - Tools executed with results
- **Example Responses**: 3 pre-loaded examples for demo

### Tools Status Component

- **6 Tools Display**: All tools shown in a grid
- **Connection Testing**: Test each tool individually
- **Status Indicators**: Green (connected), Red (error), Gray (unknown)
- **Backend Info**: Shows backend URL and connection stats

---

## 🔧 Configuration

### Environment Variables

- `VITE_BACKEND_URL`: Your backend URL (default: http://localhost:8080)

### Backend Integration

The frontend connects to your backend at:
```
https://ibm-agentic-ai-hack-skywalkers-77.vercel.app
```

All API calls go through this URL.

---

## 📱 Responsive Design

The frontend is fully responsive and works on:
- Desktop
- Tablet
- Mobile

---

## 🎯 Demo Use Cases

### Use Case 1: Show Crisis Detection
1. Go to watsonx Agent tab
2. Test with: "Is IBM cloud down? many people complaining"
3. Show crisis detected, P1 priority, tools called

### Use Case 2: Show Tools
1. Go to Tools Status tab
2. Show all 6 tools
3. Test a tool connection
4. Show status

### Use Case 3: Show Normal Request
1. Go to watsonx Agent tab
2. Test with: "My VM crashed, help debug"
3. Show NOT a crisis, P3 priority, KB search

---

**Ready to demo!** 🚀

