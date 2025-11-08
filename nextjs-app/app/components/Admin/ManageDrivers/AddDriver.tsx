"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Label,
  Input,
  Button,
} from "../../ui";
import { driverSchema, DriverInput } from "./DriverSchema";
import { z } from "zod";

interface AddDriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void; // refetch drivers
}

export function AddDriver({
  open,
  onOpenChange,
  onAdded,
}: AddDriverDialogProps) {
  const [driver, setDriver] = useState<DriverInput>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async () => {
    try {
      setError("");
      setLoading(true);

      // ✅ Validate input with Zod
      const validated = driverSchema.parse(driver);

      const res = await fetch("http://localhost:8000/admin/create/driver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      // ✅ Try to parse the response safely
      let data: any;
      try {
        data = await res.json();
      } catch {
        data = {};
      }

      // ✅ Handle API errors
      if (!res.ok) {
        if (Array.isArray(data.detail)) {
          // FastAPI validation errors
          const messages = data.detail
            .map((d: any) => d.msg || d.error || JSON.stringify(d))
            .join(", ");
          setError(messages || "Validation error.");
        } else if (typeof data.detail === "string") {
          setError(data.detail);
        } else if (typeof data.detail === "object") {
          setError(
            data.detail.error ||
              data.detail.msg ||
              JSON.stringify(data.detail, null, 2)
          );
        } else {
          setError("Failed to add driver. Please try again.");
        }
        return;
      }

      onAdded();
      setDriver({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
      });
      onOpenChange(false);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors.map((e) => e.message).join("\n"));
      } else if (err instanceof TypeError) {
        // e.g. server unreachable, network error
        setError("Network error — please check your connection.");
      } else {
        console.error(err);
        setError("Unexpected error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Driver</DialogTitle>
          <DialogDescription>Create a new driver account.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div>
            <Label>First Name</Label>
            <Input
              value={driver.first_name}
              onChange={(e) =>
                setDriver({ ...driver, first_name: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input
              value={driver.last_name}
              onChange={(e) =>
                setDriver({ ...driver, last_name: e.target.value })
              }
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={driver.email}
              onChange={(e) => setDriver({ ...driver, email: e.target.value })}
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={driver.password}
              onChange={(e) =>
                setDriver({ ...driver, password: e.target.value })
              }
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleAdd} disabled={loading}>
              {loading ? "Adding..." : "Add Driver"}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
