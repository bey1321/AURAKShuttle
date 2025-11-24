# Backend Connection Diagnostic Guide

## Problem: Backend not showing any logs when frontend connects

This means the WebSocket connection isn't reaching the backend at all. Let's diagnose why.

---

## Step 1: Use the New Network Debug Panel

1. **Navigate to Live Tracking page** in your frontend
2. **Select any trip** from the dropdown or click "Live Track"
3. **Look at the right sidebar** - you'll see TWO debug panels now:
   - **WebSocket Debug Info** (connection status)
   - **Network Debug Logs** (real-time logs in terminal style)

4. **Click "Test Backend" button** in the Network Debug Logs panel
5. **Watch the terminal output** - it will test:
   - ✅ API endpoint reachability (`/docs`)
   - ✅ Token endpoint (`/api/gps-token`)
   - ✅ WebSocket connection capability

---

## Step 2: Check What You See

### Scenario A: "API is NOT reachable"

```
❌ [Network Test] API is NOT reachable: Failed to fetch
```

**Problem**: Backend server isn't running or wrong URL

**Solutions**:
1. Start backend server:
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

2. Check if it's actually running:
   ```bash
   curl http://localhost:8000/docs
   ```

3. Verify port 8000 isn't taken by another app

---

### Scenario B: "Token endpoint failed" or "No authentication token found"

```
❌ [Network Test] Token endpoint response: { error: "No authentication token found" }
```

**Problem**: You're not logged in or cookie wasn't set

**Solutions**:
1. **Logout and login again** (this refreshes the cookie)

2. **Check cookie in browser**:
   - Press F12 → Application tab → Cookies → `http://localhost:3000`
   - Look for `auth_token` cookie
   - If missing, the login didn't set it properly

3. **Backend cookie issue** - cookies with `secure=True` don't work on HTTP:
   ```python
   # In backend/routes/auth.py (line 89-96)
   response.set_cookie(
       key="auth_token",
       value=token,
       httponly=True,
       secure=False,  # ← Change to False for local dev
       samesite="Lax",  # ← Change to Lax for local dev
       max_age=18000,
   )
   ```

---

### Scenario C: "WebSocket connection timeout" or "WebSocket connection error"

```
❌ [Network Test] WebSocket connection timeout
```

**Problem**: WebSocket isn't reaching the backend

**Possible Causes**:

#### 1. **CORS / WebSocket Headers Issue**

The backend might be blocking WebSocket connections.

**Check backend `main.py` for CORS**:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 2. **Wrong WebSocket URL**

**Check `.env.local`**:
```env
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Restart frontend after changing `.env.local`**:
```bash
# Kill the dev server (Ctrl+C)
npm run dev
```

#### 3. **Backend Not Listening on 0.0.0.0**

If backend is only listening on 127.0.0.1, some setups might have issues.

**Start backend with explicit host**:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

### Scenario D: WebSocket connects but closes immediately

```
🧪 [Network Test] WebSocket closed - Code: 1008, Reason: Invalid token
```

**Code Meanings**:
- **1000**: Normal closure (good, but means connection worked!)
- **1006**: Abnormal closure (connection dropped)
- **1008**: Policy violation (usually auth error)
- **1011**: Internal server error

**If Code 1008**:
- Token is invalid or expired
- Student not registered for route
- JWT decode failure (SECRET_KEY mismatch)

**Check backend terminal** - you SHOULD see logs now like:
```
student websocket requested
❌ [Student WS] Invalid token
```

---

## Step 3: Manual WebSocket Test (Advanced)

If the Network Debug Panel doesn't help, test manually:

### Using Browser Console:

```javascript
// Open browser console (F12)
const ws = new WebSocket('ws://localhost:8000/gps/ws/admin?token=test');

ws.onopen = () => console.log('✅ WebSocket CONNECTED');
ws.onerror = (err) => console.error('❌ WebSocket ERROR:', err);
ws.onclose = (event) => console.log('WebSocket CLOSED:', event.code, event.reason);
ws.onmessage = (msg) => console.log('Message:', msg.data);
```

**What to expect**:
- `onopen` fires → Backend is reachable!
- `onclose` with code 1008 → Auth failed (expected with 'test' token)
- `onerror` fires → Backend not reachable

---

## Step 4: Check Backend Explicitly

### Verify Backend is Actually Running:

```bash
# In a new terminal
curl http://localhost:8000/docs
```

**Should see**: HTML response with FastAPI docs

### Check Backend Logs:

When you connect, backend should print:
```
INFO:     127.0.0.1:PORT - "WebSocket /gps/ws/student/trip/1" [accepted]
student websocket requested
```

**If you see NOTHING**:
- WebSocket request isn't reaching backend at all
- Wrong URL/port
- Firewall blocking
- Backend crashed (check for Python errors)

---

## Step 5: Network Tab Inspection

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Filter by **WS** (WebSocket)
4. Click "Live Track" button
5. Look for WebSocket connection

**What you should see**:
- A WebSocket request to `ws://localhost:8000/gps/ws/student/trip/X`
- Status: `101 Switching Protocols` (success) or error

**If no WS request appears**:
- Frontend isn't trying to connect at all
- Check console for errors
- Verify `tripId` is set (not null)

---

## Common Root Causes Checklist

| Issue | Check This | Fix |
|-------|-----------|-----|
| Backend not running | `curl http://localhost:8000` | Start backend |
| Wrong port | `.env.local` has correct URL | Update and restart |
| Not logged in | Cookie `auth_token` exists | Login again |
| Cookie security | `secure=True` on HTTP | Change to `False` in backend |
| CORS issue | Backend allows `http://localhost:3000` | Add CORS middleware |
| Student not registered | Database has registration | Add registration or comment out check |
| SECRET_KEY mismatch | Frontend and backend same key | Use same `.env` |
| Frontend cached | Old code running | Hard refresh (Ctrl+Shift+R) |

---

## Quick Fix Commands

```bash
# 1. Restart backend
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 2. Restart frontend
cd nextjs-app
# Kill dev server (Ctrl+C)
npm run dev

# 3. Clear browser cache
# In browser: Ctrl+Shift+Delete → Clear cache

# 4. Test backend manually
curl http://localhost:8000/docs
```

---

## Expected Output When Working

### Frontend Console:
```
[GPS WebSocket] Fetching auth token for role: student
[GPS WebSocket] Token API response status: 200
[GPS WebSocket] ✅ Auth token retrieved successfully (length: 245)
[GPS WebSocket] 🔌 Initiating connection to: ws://localhost:8000/gps/ws/student/trip/1?token=***
[GPS WebSocket] ✅ Connected successfully for role: student
```

### Backend Terminal:
```
INFO:     127.0.0.1:52847 - "WebSocket /gps/ws/student/trip/1" [accepted]
student websocket requested
🔍 [Student WS] Token received: eyJ0...
✅ [Student WS] Token decoded: {'id': 1, 'role': 'student', 'exp': ...}
👤 [Student WS] Student ID: 1, Role: student
✅ [Student WS] Trip 1 found, route_id: 1
✅ [Student WS] Student 1 is registered for route 1
✅ [Student WS] Registering connection for student 1, trip 1
```

---

## Still Not Working?

**Share these with me**:
1. Screenshot of Network Debug Panel after clicking "Test Backend"
2. Any errors in browser console (full text)
3. Backend terminal output (any errors?)
4. Output of `curl http://localhost:8000/docs`

This will help identify the exact issue!
