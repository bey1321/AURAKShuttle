"use client";

import React, { useEffect, useState } from "react";
import { userAPI, adminAPI } from "../../lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Loader2, CheckCircle2, MapPin, Clock, Calendar, Hourglass } from "lucide-react";
import { toast } from "sonner";

interface Terminal {
  terminal: {
    id: number;
    terminalName: string;
    city: string;
  };
}

interface Route {
  id: number;
  name: string;
  status: string;
  type: string;
  start_time: string;
  end_time: string;
  start_terminal: {
    id: number;
    terminalName: string;
    city: string;
  };
  terminals: Terminal[];
  days_of_week: string[] | null;
}

interface Registration {
  id: number;
  student_id: number;
  route_id: number;
  status: "requested" | "approved";
}

export default function UserRouteRegistration() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const routesData = await adminAPI.getRoutes(); // fetch all routes
        setRoutes(routesData);

        const regData = await userAPI.getMyRegistrations?.(); // fetch current user's registrations
        if (regData) setRegistrations(regData);
      } catch {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const PageHeader = () => (
    <div className="mb-8 px-6 pt-6">
      <h1 className="text-3xl font-bold mb-2">Request a Trip</h1>
      <p className="text-base text-muted-foreground">Browse available routes and request registration for a trip.</p>
    </div>
  );

  const handleRegister = async (route_id: number) => {
    setSelectedRoute(route_id);
    try {
      const res = await userAPI.registerRouteRequest(route_id);

      // Check if the backend response was successful
      if (res && res.message) {
        // Handle different response statuses from backend
        if (res.status === 'approved') {
          // User is already registered and approved
          toast.info("Already Registered", {
            duration: 5000,
            description: res.message,
          });
          // Update local state to show approved status
          setRegistrations((prev) => {
            const existing = prev.find(r => r.route_id === route_id);
            if (!existing) {
              return [...prev, { id: Date.now(), student_id: 0, route_id, status: "approved" }];
            }
            return prev;
          });
        } else if (res.status === 'pending') {
          // User already has a pending request
          toast.warning("Pending Request", {
            duration: 5000,
            description: res.message,
          });
          // Don't add duplicate - request already exists
        } else if (res.status === 'rejected') {
          // Previous request was rejected
          toast.error("Previous Request Rejected", {
            duration: 6000,
            description: res.message,
          });
        } else {
          // New registration request created successfully
          toast.success("Request Submitted Successfully!", {
            duration: 5000,
            description: res.message,
          });

          // Only update registrations locally after successful backend response
          setRegistrations((prev) => [
            ...prev,
            { id: res.registration_id || Date.now(), student_id: 0, route_id, status: "requested" }
          ]);
        }
      } else {
        // Handle unexpected response format
        throw new Error("Unexpected response from server");
      }
    } catch (error: any) {
      // Show user-friendly error message
      const errorMessage = error?.response?.data?.detail ||
                          error?.response?.data?.message ||
                          error?.message ||
                          "Unable to process your registration request. Please try again later.";

      toast.error("Registration Failed", {
        duration: 5000,
        description: errorMessage,
      });

      console.error("Registration error:", error);
    } finally {
      setSelectedRoute(null);
    }
  };

  if (loading)
    return (
      <div>
        <PageHeader />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );

  if (!routes.length)
    return (
      <div>
        <PageHeader />
        <div className="text-center text-muted-foreground py-20">No routes available</div>
      </div>
    );

  return (
    <div>
      <PageHeader />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {routes.map((route) => {
        const registration = registrations.find((r) => r.route_id === route.id);
        const isRequested = registration?.status === "requested";
        const isRegistering = selectedRoute === route.id;

        return (
          <Card key={route.id} className="hover:shadow-md transition-all duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="w-5 h-5 text-primary" />
                {route.name}
              </CardTitle>
              <p className="text-xs text-muted-foreground capitalize">
                {route.type} • {route.status}
              </p>
            </CardHeader>

            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">From:</span> {route.start_terminal.terminalName} ({route.start_terminal.city})
              </p>

              <p className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {route.start_time} → {route.end_time}
              </p>

              {route.days_of_week ? (
                <p className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {route.days_of_week.join(", ")}
                </p>
              ) : (
                <p className="italic text-xs text-muted-foreground">Days not specified</p>
              )}

              <div>
                <p className="text-foreground font-medium">Stops:</p>
                <ul className="list-disc list-inside text-xs">
                  {route.terminals.map((stop, index) => (
                    <li key={index}>{stop.terminal?.terminalName || "Unnamed Terminal"}</li>
                  ))}
                </ul>
              </div>

              <Button
                className={`w-full mt-3 ${isRequested ? "bg-yellow-200 text-yellow-800 cursor-not-allowed" : ""}`}
                onClick={() => handleRegister(route.id)}
                disabled={isRequested || isRegistering}
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...
                  </>
                ) : isRequested ? (
                  <>
                    <Hourglass className="w-4 h-4 mr-2" /> Requested
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Register
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
    </div>
  );
}
