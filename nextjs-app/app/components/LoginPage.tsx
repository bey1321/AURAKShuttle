"use client";

import { Bus, User, Lock } from "lucide-react";
import { Button, Input, Label, Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui";
import React, { useState } from "react";

interface LoginPageProps {
  onLogin: (username: string, role: "student" | "driver" | "admin") => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState<"student" | "driver" | "admin">("student");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      onLogin(username, selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-4">
            <Bus className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-primary">AURAK Campus Shuttle Tracker</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue</p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-input-background"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-input-background"
                    required
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Select Role</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant={selectedRole === "student" ? "default" : "outline"}
                    onClick={() => setSelectedRole("student")}
                    className="w-full"
                  >
                    Student
                  </Button>
                  <Button
                    type="button"
                    variant={selectedRole === "driver" ? "default" : "outline"}
                    onClick={() => setSelectedRole("driver")}
                    className="w-full"
                  >
                    Driver
                  </Button>
                  <Button
                    type="button"
                    variant={selectedRole === "admin" ? "default" : "outline"}
                    onClick={() => setSelectedRole("admin")}
                    className="w-full"
                  >
                    Admin
                  </Button>
                </div>
              </div>

              {/* Submit Button */}
              <Button type="submit" className="w-full">
                Sign In
              </Button>

              {/* Forgot Password */}
              <div className="text-center">
                <a href="#" className="text-sm text-primary hover:underline">
                  Forgot password?
                </a>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          American University of Ras Al Khaimah
        </p>
      </div>
    </div>
  );
}
