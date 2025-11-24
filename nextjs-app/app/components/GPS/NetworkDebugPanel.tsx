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
import { Terminal, Copy, CheckCircle } from "lucide-react";

export function NetworkDebugPanel() {
  const [logs, setLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: string, ...args: any[]) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = `[${timestamp}] ${type}: ${args.map(a =>
        typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)
      ).join(' ')}`;

      setLogs(prev => [...prev.slice(-50), message]); // Keep last 50 logs
    };

    console.log = (...args: any[]) => {
      originalLog(...args);
      if (args.some(arg => String(arg).includes('GPS WebSocket') || String(arg).includes('Student WS'))) {
        addLog('LOG', ...args);
      }
    };

    console.error = (...args: any[]) => {
      originalError(...args);
      if (args.some(arg => String(arg).includes('GPS WebSocket') || String(arg).includes('WebSocket'))) {
        addLog('ERROR', ...args);
      }
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);
      if (args.some(arg => String(arg).includes('GPS WebSocket') || String(arg).includes('WebSocket'))) {
        addLog('WARN', ...args);
      }
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const copyLogs = () => {
    navigator.clipboard.writeText(logs.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testBackendConnection = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

    console.log('🧪 [Network Test] Starting backend connectivity test...');
    console.log(`🧪 [Network Test] API URL: ${apiUrl}`);
    console.log(`🧪 [Network Test] WebSocket URL: ${wsUrl}`);

    // Test 1: API availability
    try {
      console.log('🧪 [Network Test] Testing API endpoint: /docs');
      const response = await fetch(`${apiUrl}/docs`);
      console.log(`✅ [Network Test] API is reachable! Status: ${response.status}`);
    } catch (error) {
      console.error(`❌ [Network Test] API is NOT reachable:`, error);
    }

    // Test 2: Token endpoint
    try {
      console.log('🧪 [Network Test] Testing token endpoint: /api/gps-token');
      const response = await fetch('/api/gps-token');
      const data = await response.json();
      console.log(`✅ [Network Test] Token endpoint response:`, data);
    } catch (error) {
      console.error(`❌ [Network Test] Token endpoint failed:`, error);
    }

    // Test 3: WebSocket connection (basic test)
    try {
      console.log('🧪 [Network Test] Testing WebSocket connection...');
      const testWs = new WebSocket(`${wsUrl}/gps/ws/admin?token=test`);

      testWs.onopen = () => {
        console.log('✅ [Network Test] WebSocket CAN connect (will fail auth, but connection works)');
        testWs.close();
      };

      testWs.onerror = (error) => {
        console.error('❌ [Network Test] WebSocket connection error:', error);
      };

      testWs.onclose = (event) => {
        console.log(`🧪 [Network Test] WebSocket closed - Code: ${event.code}, Reason: ${event.reason || 'No reason'}`);
      };

      // Timeout after 5 seconds
      setTimeout(() => {
        if (testWs.readyState === WebSocket.CONNECTING) {
          console.error('❌ [Network Test] WebSocket connection timeout');
          testWs.close();
        }
      }, 5000);
    } catch (error) {
      console.error('❌ [Network Test] WebSocket test failed:', error);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Network Debug Logs
            </CardTitle>
            <CardDescription className="text-xs">
              Real-time connection logs
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={testBackendConnection}
              className="text-xs"
            >
              Test Backend
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={copyLogs}
              className="text-xs"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLogs([])}
              className="text-xs"
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-black text-green-400 p-3 rounded font-mono text-xs h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">
              Waiting for logs... Click "Test Backend" to start.
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1 whitespace-pre-wrap break-all">
                {log}
              </div>
            ))
          )}
        </div>

        <div className="mt-3 text-xs text-muted-foreground space-y-1">
          <p><strong>Tip:</strong> Open browser DevTools (F12) → Console for full logs</p>
          <p><strong>Tip:</strong> Check Network tab → WS filter to see WebSocket traffic</p>
          <p><strong>Backend URL:</strong> {process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
