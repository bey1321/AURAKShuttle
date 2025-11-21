"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const WEBSOCKET_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

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
    fetch("/api/gps-token")
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          setAuthToken(data.token);
        } else {
          console.error("[GPS WebSocket] Failed to get auth token:", data.error);
        }
        setTokenLoading(false);
      })
      .catch((error) => {
        console.error("[GPS WebSocket] Error fetching auth token:", error);
        setTokenLoading(false);
      });
  }, [role]);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Wait for token to be loaded for all roles
    if (tokenLoading) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    let wsUrl = "";
    
    if (role === "student" && tripId) {
      // Student route needs token as query parameter (cookies don't work reliably with WebSocket)
      if (!authToken) {
        setLastError("Authentication token not found. Please log in.");
        setConnectionStatus("error");
        onError?.("Authentication token not found");
        return;
      }
      wsUrl = `${WEBSOCKET_BASE_URL}/gps/ws/student/trip/${tripId}?token=${encodeURIComponent(authToken)}`;
    } else if (role === "admin") {
      // Admin needs token as query parameter
      if (!authToken) {
        setLastError("Authentication token not found. Please log in.");
        setConnectionStatus("error");
        onError?.("Authentication token not found");
        return;
      }
      wsUrl = `${WEBSOCKET_BASE_URL}/gps/ws/admin?token=${encodeURIComponent(authToken)}`;
    } else if (role === "driver" && userId) {
      // Driver needs token as query parameter
      if (!authToken) {
        setLastError("Authentication token not found. Please log in.");
        setConnectionStatus("error");
        onError?.("Authentication token not found");
        return;
      }
      wsUrl = `${WEBSOCKET_BASE_URL}/gps/ws/driver/${userId}?token=${encodeURIComponent(authToken)}`;
    } else {
      console.warn("Invalid WebSocket configuration for role:", role, { userId, tripId });
      setLastError(`Invalid configuration: missing ${role === "student" ? "tripId" : "userId"}`);
      setConnectionStatus("error");
      return;
    }

    setConnectionStatus("connecting");
    setLastError(null);

    const maskedUrl = wsUrl.replace(/\?token=[^&]*/, "?token=***");
    console.log(`[GPS WebSocket] Connecting to: ${maskedUrl}`);
    console.log(`[GPS WebSocket] Token available: ${authToken ? "Yes" : "No"}`);
    console.log(`[GPS WebSocket] Token length: ${authToken?.length || 0}`);

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
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log(`[GPS WebSocket] Message received:`, message.type, message);
          
          if (message.type === "error") {
            const errorMsg = message.message || "Unknown error";
            console.error(`[GPS WebSocket] Error from server:`, errorMsg);
            setLastError(errorMsg);
            setConnectionStatus("error");
            // Don't call onError here to prevent infinite loops, just set the error state
            if (onError) {
              onError(errorMsg);
            }
            // Close connection on error to prevent reconnection loops
            if (wsRef.current) {
              wsRef.current.close(1008, errorMsg); // 1008 = Policy Violation
            }
          } else {
            // Clear any previous errors on successful message
            setLastError(null);
            onMessage?.(message);
          }
        } catch (error) {
          console.error("[GPS WebSocket] Error parsing message:", error, event.data);
          const errorMsg = "Failed to parse message";
          setLastError(errorMsg);
          onError?.(errorMsg);
        }
      };

      ws.onerror = (error) => {
        console.error("[GPS WebSocket] Connection error:", error);
        setConnectionStatus("error");
        setLastError("WebSocket connection error");
        onError?.("WebSocket connection error");
      };

      ws.onclose = (event) => {
        console.log(`[GPS WebSocket] Connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`);
        setIsConnected(false);
        setConnectionStatus("disconnected");
        onDisconnect?.();

        // Don't reconnect on authentication errors (1008), policy violations, or if manually closed (1000)
        // Also don't reconnect if we've exceeded max attempts
        const isAuthError = event.code === 1008; // Policy violation (authentication/authorization)
        const isServerError = event.code === 1011; // Internal server error
        const isManualClose = event.code === 1000; // Normal closure
        const isAbnormalClose = event.code === 1006; // Abnormal closure (no close frame)
        
        // Only reconnect on network errors, not on auth/server errors
        const shouldReconnect = enabled && 
                                !isAuthError && 
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
    if (enabled && !tokenLoading) {
      // Small delay to ensure token is fully set
      const timeoutId = setTimeout(() => {
        connect();
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        disconnect();
      };
    }

    return () => {
      disconnect();
    };
  }, [enabled, tokenLoading, connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    lastError,
    sendMessage,
    connect,
    disconnect,
  };
}

