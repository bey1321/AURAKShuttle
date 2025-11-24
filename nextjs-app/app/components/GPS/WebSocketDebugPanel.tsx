"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from "../ui";
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface WebSocketDebugPanelProps {
  isConnected: boolean;
  connectionStatus: string;
  lastError: string | null;
  onRetry?: () => void;
}

export function WebSocketDebugPanel({
  isConnected,
  connectionStatus,
  lastError,
  onRetry,
}: WebSocketDebugPanelProps) {
  const [tokenStatus, setTokenStatus] = useState<"checking" | "found" | "missing">("checking");
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    // Check token availability
    fetch("/api/gps-token")
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          setTokenStatus("found");
        } else {
          setTokenStatus("missing");
          setTokenError(data.error || "Token not found");
        }
      })
      .catch((error) => {
        setTokenStatus("missing");
        setTokenError(error.message || "Failed to fetch token");
      });
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "connecting":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case "error":
      case "disconnected":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getTokenStatusBadge = () => {
    switch (tokenStatus) {
      case "found":
        return <Badge variant="default" className="bg-green-500">Token OK</Badge>;
      case "missing":
        return <Badge variant="destructive">No Token</Badge>;
      default:
        return <Badge variant="secondary">Checking...</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Connection Debug Info</CardTitle>
        <CardDescription className="text-xs">
          WebSocket connection diagnostics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Connection:</span>
          <div className="flex items-center gap-2">
            {getStatusIcon(connectionStatus)}
            <span className="text-sm font-medium capitalize">{connectionStatus}</span>
          </div>
        </div>

        {/* Token Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Auth Token:</span>
          {getTokenStatusBadge()}
        </div>

        {/* WebSocket URL */}
        <div className="text-xs text-muted-foreground">
          <p>WS URL: {process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}</p>
        </div>

        {/* Error Display */}
        {(lastError || tokenError) && (
          <div className="p-2 bg-destructive/10 border border-destructive/20 rounded text-xs">
            <p className="font-semibold text-destructive mb-1">Error:</p>
            <p className="text-destructive/90">{lastError || tokenError}</p>
          </div>
        )}

        {/* Troubleshooting Tips */}
        {!isConnected && (
          <div className="p-2 bg-muted rounded text-xs space-y-1">
            <p className="font-semibold">Troubleshooting:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {tokenStatus === "missing" && (
                <li>Please log in again to refresh your authentication</li>
              )}
              {lastError?.includes("registration") && (
                <li>You may not be registered for this route</li>
              )}
              {lastError?.includes("connection") && (
                <li>Check if backend server is running on port 8000</li>
              )}
              <li>Open browser console (F12) for detailed logs</li>
            </ul>
          </div>
        )}

        {/* Retry Button */}
        {onRetry && !isConnected && connectionStatus !== "connecting" && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={onRetry}
          >
            <RefreshCw className="w-3 h-3 mr-2" />
            Retry Connection
          </Button>
        )}

        {/* Success Message */}
        {isConnected && (
          <div className="p-2 bg-green-500/10 border border-green-500/20 rounded text-xs">
            <p className="text-green-700 dark:text-green-400">
              ✅ Connected successfully! Receiving live GPS updates.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
