import { NextRequest, NextResponse } from "next/server";

// API route to get the auth token from cookies (server-side only)
// This is needed because HttpOnly cookies can't be read by client-side JavaScript
export async function GET(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  
  if (!token) {
    return NextResponse.json(
      { error: "No authentication token found" },
      { status: 401 }
    );
  }

  // Return the token so the client can use it for WebSocket connections
  // Note: This is a workaround. Ideally, the backend should read from cookies directly
  return NextResponse.json({ token });
}

