"use client";

import React, { useEffect, useState } from "react";
import { adminAPI } from "../../lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { CheckCircle2, Loader2, User, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

interface Registration {
  id: number;
  status: string;
  first_name: string;
  last_name: string;
  student_email: string;
  route_name: string;
  start_time: string;
  end_time: string;
  days_of_week: string[];
}

const AdminApproveRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getRegistrationRequests();
      const mapped: Registration[] = data.map((r) => ({
        id: r.id,
        status: r.status,
        first_name: r.student.first_name,
        last_name: r.student.last_name,
        student_email: r.student.email ?? "",
        route_name: r.route.name,
        start_time: r.route.start_time,
        end_time: r.route.end_time,
        days_of_week: r.route.days_of_week,
      }));
      setRegistrations(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pending registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleApprove = async (id: number) => {
    setApprovingId(id);
    try {
      const res = await adminAPI.approveRegistration(id);
      toast.success(res.message || "Registration approved");
      setRegistrations((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error(err);
      toast.error("Approval failed");
    } finally {
      setApprovingId(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );

  if (registrations.length === 0)
    return (
      <Card className="p-6 text-center text-muted-foreground">
        No pending registrations 🎉
      </Card>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {registrations.map((reg) => (
        <Card
          key={reg.id}
          className="hover:shadow-md transition-all duration-200"
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5 text-primary" />
              {reg.first_name} {reg.last_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Email: {reg.student_email}</p>
            <p>Route: {reg.route_name}</p>
            <p>
              <Clock className="w-4 h-4 inline-block mr-1" /> {reg.start_time} -{" "}
              {reg.end_time}
            </p>
            <p>
              <MapPin className="w-4 h-4 inline-block mr-1" />
              Days:{" "}
              {Array.isArray(reg.days_of_week) && reg.days_of_week.length > 0
                ? reg.days_of_week.join(", ")
                : "N/A"}
            </p>

            <p>Status: {reg.status}</p>

            <Button
              className="w-full mt-3"
              onClick={() => handleApprove(reg.id)}
              disabled={approvingId === reg.id}
            >
              {approvingId === reg.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Approving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminApproveRegistrations;
