"use client";

import React, { useEffect, useState } from "react";
import { adminAPI } from "../../lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { CheckCircle2, Loader2, User } from "lucide-react";
import { toast } from "sonner";

interface Registration {
  id: number;
  student_name: string;
  route_name: string;
  status: string;
}

const AdminApproveRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const fetchRegistrations = async () => {
    try {
      const data = await adminAPI.getPendingRegistrations();
      setRegistrations(data.registrations);
    } catch {
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
    } catch {
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
              {reg.student_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Route: {reg.route_name}</p>
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
