# Quick Local Test

## Terminal 1: Start Backend

```bash
cd c:\Users\RiddhiRainaPrasad\Downloads\ibm_watsonx
npm start
```

Wait for: `🚀 ResolveAI 360 Server listening on port 8080`

---

## Terminal 2: Start Frontend

```bash
cd c:\Users\RiddhiRainaPrasad\Downloads\ibm_watsonx\frontend
npm install
npm run dev
```

Wait for: `Local: http://localhost:3000`

---

## Open Browser

Go to: **http://localhost:3000**

You should see the dashboard!

---

## Test It

**Option 1: Use test script**
```bash
# In root directory, Terminal 3
node test-payloads.js
```

**Option 2: Manual curl**
```bash
curl -X POST http://localhost:8080/api/trigger-flow \
  -H "Content-Type: application/json" \
  -d "{\"text\":\"Is IBM cloud down?\",\"channel\":\"twitter\"}"
```

Watch the frontend update in real-time! 🎉

