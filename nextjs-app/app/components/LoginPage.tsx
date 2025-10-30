"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage({
  onLogin,
}: {
  onLogin: (username: string, role: string) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Mock login check
    if (email === "student1@test.com" && password === "1234") {
      onLogin("Student One", "student");
      router.push("/");
    } else if (email === "admin@test.com" && password === "1234") {
      onLogin("Admin User", "admin");
      router.push("/");
    } else if (email === "driver@test.com" && password === "1234") {
      onLogin("Driver User", "driver");
      router.push("/");
    } else {
      setMessage("Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Welcome Back
        </h2>

        <form className="space-y-4" onSubmit={handleLogin}>
          {message && (
            <p className="text-red-500 text-sm text-center">{message}</p>
          )}

          <div>
            <label className="block text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Demo credentials: <br />
          <span className="font-mono">student1@test.com / 1234</span>,{" "}
          <span className="font-mono">driver@test.com / 1234</span>,{" "}
          <span className="font-mono">admin@test.com / 1234</span>
        </p>
      </div>
    </div>
  );
}
