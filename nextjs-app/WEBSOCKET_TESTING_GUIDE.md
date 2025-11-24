# WebSocket GPS Connection Testing Guide

## Prerequisites

1. **Backend Server Running**
   - Navigate to `backend` folder
   - Run: `python -m uvicorn main:app --reload` (or your start command)
   - Server should be running on `http://localhost:8000`

2. **Frontend Running**
   - Navigate to `nextjs-app` folder
   - Run: `npm run dev`
   - Frontend should be running on `http://localhost:3000`

## Step-by-Step Testing

### Step 1: Login as Student

1. Go to `http://localhost:3000`
2. Login with a student account
3. Verify you're logged in (check if you see student dashboard)

### Step 2: Check Browser Console

Open browser DevTools (Press F12) and go to the Console tab. You should see logs like:

```
[GPS WebSocket] Fetching auth token for role: student
[GPS WebSocket] Token API response status: 200
[GPS WebSocket] ✅ Auth token retrieved successfully (length: XXX)
```

**If you see errors here:**
- ❌ `Token API response status: 401` → You're not logged in
- ❌ `No authentication token found` → Cookie issue (see Common Issues below)

### Step 3: Navigate to Live Tracking

1. Click on "Track Shuttle" in the sidebar (or go to Live Tracking page)
2. You should see:
   - List of active shuttles on the right
   - A dropdown to select trips
   - A debug panel showing connection status

### Step 4: Select a Trip

1. Click "Live Track" button on any shuttle card, OR
2. Select a trip from the dropdown
3. Watch the debug panel in the right sidebar

**Expected Console Logs:**
```
[GPS WebSocket] Student connection - Trip ID: X, WS Base URL: ws://localhost:8000
[GPS WebSocket] 🔌 Initiating connection to: ws://localhost:8000/gps/ws/student/trip/X?token=***
[GPS WebSocket] Token available: Yes
[GPS WebSocket] Token length: XXX
[GPS WebSocket] ✅ Connected successfully for role: student
```

### Step 5: Check Backend Logs

In your backend terminal, you should see:
```
student websocket requested
🔍 [Student WS] Token received: ...
✅ [Student WS] Token decoded: {...}
👤 [Student WS] Student ID: X, Role: student
✅ [Student WS] Trip X found, route_id: Y
✅ [Student WS] Student X is registered for route Y
✅ [Student WS] Registering connection for student X, trip X
```

**If you see errors:**
- ❌ `Student not registered for this route` → Student needs to be registered for that route in the database
- ❌ `Invalid token` → Token decode failed, check SECRET_KEY matches between frontend and backend
- ❌ `Not authorized - students only` → Role mismatch in JWT token

### Step 6: Check Map Updates

1. Once connected, you should see:
   - Green "Tracking: Bus #X" badge at top of map
   - Debug panel shows "Connected successfully!"
   - Map displays (may show "Waiting for GPS location..." if no driver is sending data)

2. If a driver is sending GPS data:
   - Map should show the bus marker
   - Location details should update in real-time
   - Console shows: `[GPS WebSocket] Message received: location_update {...}`

## Debug Panel Information

The debug panel shows:
- **Connection**: Current WebSocket status (connecting/connected/disconnected/error)
- **Auth Token**: Whether authentication token was found
- **WS URL**: The WebSocket URL being used
- **Error messages**: Specific errors if connection fails
- **Troubleshooting tips**: Based on the error

## Common Issues and Solutions

### Issue 1: "No authentication token found"

**Cause**: Cookie not being sent/set properly

**Solutions**:
1. Check if you're logged in (try logging out and back in)
2. Clear browser cookies and login again
3. Check browser DevTools → Application → Cookies → `http://localhost:3000` → Look for `auth_token`
4. If using HTTPS locally, cookies with `secure=true` won't work on HTTP

**Backend Fix** (if needed):
In `backend/routes/auth.py`, change cookie settings:
```python
response.set_cookie(
    key="auth_token",
    value=token,
    httponly=True,
    secure=False,  # Change to False for local HTTP
    samesite="Lax",  # Change to Lax for local testing
    max_age=18000,
)
```

### Issue 2: "Student not registered for this route"

**Cause**: Student record doesn't exist in `registered` table for this route

**Solutions**:
1. Register the student for the route via admin panel
2. Manually add to database:
   ```sql
   INSERT INTO registered (student_id, route_id, status)
   VALUES (YOUR_STUDENT_ID, ROUTE_ID, 'approved');
   ```
3. **Backend workaround**: Comment out the registration check in `backend/routes/gps.py` lines 212-216

### Issue 3: WebSocket connection times out

**Cause**: Backend not running or port mismatch

**Solutions**:
1. Verify backend is running: `curl http://localhost:8000/docs`
2. Check `.env.local` has correct WS URL: `NEXT_PUBLIC_WS_URL=ws://localhost:8000`
3. Check firewall isn't blocking WebSocket connections
4. Try different port if 8000 is taken

### Issue 4: "Waiting for GPS location..."

**Cause**: No driver is actively sending GPS data for this trip

**This is normal!** The WebSocket is connected, but there's no GPS data yet because:
- No driver has started this trip
- Driver hasn't sent location updates
- Trip status isn't "in_progress"

**To test with real data**, you need a driver to:
1. Login as driver
2. Start the trip
3. Send GPS location updates

## Testing Checklist

- [ ] Backend server running
- [ ] Frontend server running
- [ ] Logged in as student
- [ ] Browser console shows token retrieved
- [ ] Can navigate to Live Tracking page
- [ ] Can select a trip
- [ ] WebSocket connection established (check debug panel)
- [ ] Backend logs show successful connection
- [ ] Map displays (with or without GPS data)
- [ ] No errors in console or backend logs

## Environment Variables

Make sure you have `.env.local` in `nextjs-app` folder:
```env
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

And `.env` in `backend` folder:
```env
DATABASE_URL=sqlite:///database.db
SECRET_KEY=2025FallAurakShuttleBetHewProj!@#$%
ALGORITHM=HS256
```

## Need More Help?

Check these logs in order:
1. **Browser Console** (F12 → Console tab) → Shows frontend WebSocket connection
2. **Network Tab** (F12 → Network → WS filter) → Shows WebSocket messages
3. **Backend Terminal** → Shows server-side connection logs
4. **Debug Panel** in UI → Shows summarized connection status

If everything connects but no GPS data shows, that's expected until a driver starts sending location updates!
