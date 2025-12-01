"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WEBSOCKET_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export interface PathPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  heading?: number;
}

export interface LocationData {
  trip_id: number;
  bus_id?: number;
  bus_number?: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  last_update: string;
  status?: string;
  path?: PathPoint[];  // Full path history
  new_point?: PathPoint;  // Single new point to append
}

export interface WebSocketMessage {
  type: "location_update" | "bus_location" | "initial_location" | "all_buses" | "location_confirmed" | "error";
  data: LocationData | LocationData[];
  message?: string;
  timestamp?: string;
}

export interface UseGPSWebSocketOptions {
  role: "student" | "driver" | "admin";
  userId?: number;
  tripId?: number;
  enabled?: boolean;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useGPSWebSocket({
  role,
  userId,
  tripId,
  enabled = true,
  onMessage,
  onError,
  onConnect,
  onDisconnect,
}: UseGPSWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected" | "error">("disconnected");
  const [lastError, setLastError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Helper function to get auth token from cookies via API route
  // HttpOnly cookies can't be read by JavaScript, so we use a server-side API route
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [tokenLoading, setTokenLoading] = useState(true);

  useEffect(() => {
    // Fetch token from API route (which can read HttpOnly cookies server-side)
    // All roles need the token since WebSocket connections don't reliably send cookies
    console.log(`[GPS WebSocket] Fetching auth token for role: ${role}`);
    fetch("/api/gps-token")
      .then((res) => {
        console.log(`[GPS WebSocket] Token API response status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.token) {
          console.log(`[GPS WebSocket] ✅ Auth token retrieved successfully (length: ${data.token.length})`);
          setAuthToken(data.token);
        } else {
          console.error("[GPS WebSocket] ❌ Failed to get auth token:", data.error);
          setLastError(data.error || "Failed to retrieve authentication token");
        }
        setTokenLoading(false);
      })
      .catch((error) => {
        console.error("[GPS WebSocket] ❌ Error fetching auth token:", error);
        setLastError("Network error: Could not retrieve authentication token");
        setTokenLoading(false);
      });
  }, [role]);

  const connect = useCallback(() => {
    console.log(`[GPS WebSocket] 🎯 Connect called with:`, { role, tripId, userId, enabled, tokenLoading, hasToken: !!authToken });

    if (!enabled) {
      console.log(`[GPS WebSocket] ⚠️ Connection disabled`);
      return;
    }

    // Wait for token to be loaded for all roles
    if (tokenLoading) {
      console.log(`[GPS WebSocket] ⏳ Waiting for token to load...`);
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      console.log(`[GPS WebSocket] 🔄 Closing existing connection`);
      wsRef.current.close();
      wsRef.current = null;
    }

    let wsUrl = "";

    console.log(`[GPS WebSocket] 🔍 Checking conditions - role: "${role}", tripId: ${tripId}, condition result: ${role === "student" && !!tripId}`);

    if (role === "student" && tripId) {
      console.log(`[GPS WebSocket] ✅ MATCHED: Student route with tripId ${tripId}`);
      // Student route needs token as query parameter (cookies don't work reliably with WebSocket)
      if (!authToken) {
        const errorMsg = "Authentication token not found. Please log in.";
        console.error(`[GPS WebSocket] ❌ ${errorMsg}`);
        setLastError(errorMsg);
        setConnectionStatus("error");
        onError?.(errorMsg);
        return;
      }
      wsUrl = `${WEBSOCKET_BASE_URL}/gps/ws/student/trip/${tripId}?token=${encodeURIComponent(authToken)}`;
      console.log(`[GPS WebSocket] ✅ Student WebSocket URL: ${wsUrl.replace(/\?token=.*/, '?token=***')}`);
    } else if (role === "admin") {
      console.log(`[GPS WebSocket] ✅ MATCHED: Admin route`);
      // Admin needs token as query parameter
      if (!authToken) {
        const errorMsg = "Authentication token not found. Please log in.";
        console.error(`[GPS WebSocket] ❌ ${errorMsg}`);
        setLastError(errorMsg);
        setConnectionStatus("error");
        onError?.(errorMsg);
        return;
      }
      wsUrl = `${WEBSOCKET_BASE_URL}/gps/ws/admin?token=${encodeURIComponent(authToken)}`;
      console.log(`[GPS WebSocket] Admin connection - WS Base URL: ${WEBSOCKET_BASE_URL}`);
    } else if (role === "driver" && userId) {
      // Driver needs token as query parameter
      if (!authToken) {
        const errorMsg = "Authentication token not found. Please log in.";
        console.error(`[GPS WebSocket] ❌ ${errorMsg}`);
        setLastError(errorMsg);
        setConnectionStatus("error");
        onError?.(errorMsg);
        return;
      }
      wsUrl = `${WEBSOCKET_BASE_URL}/gps/ws/driver/${userId}?token=${encodeURIComponent(authToken)}`;
      console.log(`[GPS WebSocket] Driver connection - User ID: ${userId}, WS Base URL: ${WEBSOCKET_BASE_URL}`);
    } else {
      const errorMsg = `Invalid configuration: missing ${role === "student" ? "tripId" : "userId"}`;
      console.warn(`[GPS WebSocket] ⚠️ Invalid WebSocket configuration for role: ${role}`, { userId, tripId });
      setLastError(errorMsg);
      setConnectionStatus("error");
      return;
    }

    setConnectionStatus("connecting");
    setLastError(null);

    const maskedUrl = wsUrl.replace(/\?token=[^&]*/, "?token=***");
    console.log(`[GPS WebSocket] 🔌 Initiating connection to: ${maskedUrl}`);
    console.log(`[GPS WebSocket] Token available: ${authToken ? "Yes" : "No"}`);
    console.log(`[GPS WebSocket] Token length: ${authToken?.length || 0}`);
    console.log(`[GPS WebSocket] Role: ${role}, Trip ID: ${tripId || "N/A"}, User ID: ${userId || "N/A"}`);

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      // Set a timeout to detect if connection doesn't open
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.error(`[GPS WebSocket] Connection timeout after 10 seconds. State: ${ws.readyState}`);
          ws.close();
          setLastError("Connection timeout. Please check if the backend server is running.");
          setConnectionStatus("error");
        }
      }, 10000);

      ws.onopen = (event) => {
        clearTimeout(connectionTimeout);
        console.log(`[GPS WebSocket] Connected successfully for role: ${role}`, event);
        setIsConnected(true);
        setConnectionStatus("connected");
        reconnectAttemptsRef.current = 0;
        setLastError(null); // Clear any previous errors
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          console.log(`[GPS WebSocket] Raw message received:`, event.data);
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log(`[GPS WebSocket] Parsed message:`, message.type, message);

          if (message.type === "error") {
            const errorMsg = message.message || "Unknown error";
            console.log(`[GPS WebSocket] Server message:`, errorMsg);
            setLastError(errorMsg);
            setConnectionStatus("error");
            // Call onError to trigger user-friendly error translation
            if (onError) {
              onError(errorMsg);
            }
            // Close connection on error to prevent reconnection loops
            // Use 4000 (custom error code in valid range 3000-4999)
            if (wsRef.current) {
              wsRef.current.close(4000, "Server error");
            }
          } else {
            // Clear any previous errors on successful message
            setLastError(null);
            onMessage?.(message);
          }
        } catch (error) {
          console.error("[GPS WebSocket] Error parsing message:", error);
          console.error("[GPS WebSocket] Raw message data:", event.data);
          console.error("[GPS WebSocket] Message data type:", typeof event.data);
          const errorMsg = `Failed to parse server message: ${event.data}`;
          setLastError(errorMsg);
          onError?.(errorMsg);
        }
      };

      ws.onerror = (error) => {
          // Log the full error event for debugging (some browsers provide limited info)
          try {
            console.error("[GPS WebSocket] Connection error event:", error);
            // if the event has an error property, log it too
            // @ts-ignore
            if (error && (error as any).error) console.error("Underlying error:", (error as any).error);
          } catch (e) {
            console.error("[GPS WebSocket] Failed to log error event:", e);
          }

          setConnectionStatus("error");
          setLastError("WebSocket connection error");
          onError?.("WebSocket connection error");
      };

      ws.onclose = (event) => {
          // Log the full close event object to capture codes/reasons and abnormal closures
          try {
            console.log("[GPS WebSocket] onclose event:", event);
          } catch (e) {
            console.log(`[GPS WebSocket] Connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`);
          }
        setIsConnected(false);
        setConnectionStatus("disconnected");
        onDisconnect?.();

        // Don't reconnect on authentication errors, policy violations, or if manually closed
        // Also don't reconnect if we've exceeded max attempts
        const isAuthError = event.code === 1008; // Policy violation (authentication/authorization) - legacy
        const isCustomError = event.code === 4000; // Custom error code for server-side errors
        const isServerError = event.code === 1011; // Internal server error
        const isManualClose = event.code === 1000; // Normal closure
        const isAbnormalClose = event.code === 1006; // Abnormal closure (no close frame)

        // Only reconnect on network errors, not on auth/server/custom errors
        const shouldReconnect = enabled &&
                                !isAuthError &&
                                !isCustomError &&
                                !isServerError &&
                                !isManualClose &&
                                reconnectAttemptsRef.current < maxReconnectAttempts;

        if (shouldReconnect) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          console.log(`[GPS WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          if (isAuthError) {
            setLastError("Authentication failed. Please log in again.");
            setConnectionStatus("error");
            onError?.("Authentication failed");
          } else if (isServerError) {
            setLastError(`Server error: ${event.reason || "Internal server error"}`);
            setConnectionStatus("error");
            onError?.(`Server error: ${event.reason || "Internal server error"}`);
          } else if (isAbnormalClose && reconnectAttemptsRef.current >= maxReconnectAttempts) {
            setLastError("Connection failed. Please check your network connection.");
            setConnectionStatus("error");
            onError?.("Connection failed after multiple attempts");
          }
        }
      };
    } catch (error) {
      console.error("Error creating WebSocket:", error);
      setConnectionStatus("error");
      setLastError("Failed to create WebSocket connection");
      onError?.("Failed to create WebSocket connection");
    }
  }, [role, userId, tripId, enabled, onMessage, onError, onConnect, onDisconnect, authToken, tokenLoading]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      // Clear ping interval if it exists
      if ((wsRef.current as any).pingInterval) {
        clearInterval((wsRef.current as any).pingInterval);
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setConnectionStatus("disconnected");
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Connect when enabled and (for admin/driver) when token is loaded
  useEffect(() => {
    console.log(`[GPS WebSocket] 🔄 useEffect triggered:`, { enabled, tokenLoading, role, tripId, userId });

    if (enabled && !tokenLoading) {
      console.log(`[GPS WebSocket] ⏰ Scheduling connection in 100ms...`);
      // Small delay to ensure token is fully set
      const timeoutId = setTimeout(() => {
        console.log(`[GPS WebSocket] 🚀 Calling connect() now...`);
        connect();
      }, 100);

      return () => {
        console.log(`[GPS WebSocket] 🧹 Cleanup: clearing timeout and disconnecting`);
        clearTimeout(timeoutId);
        disconnect();
      };
    } else {
      console.log(`[GPS WebSocket] ⏸️ Not connecting: enabled=${enabled}, tokenLoading=${tokenLoading}`);
    }

    return () => {
      console.log(`[GPS WebSocket] 🧹 Cleanup: disconnecting (enabled was false)`);
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, tokenLoading, role, tripId, userId]);

  return {
    isConnected,
    connectionStatus,
    lastError,
    sendMessage,
    connect,
    disconnect,
  };
}

