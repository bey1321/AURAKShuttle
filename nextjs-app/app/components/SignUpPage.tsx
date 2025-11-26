"use client";

import { useState } from "react";
import { z } from "zod";
import { Button } from "./ui";
import { authAPI } from "../lib/api"; 

interface SignUpPageProps {
  onSwitchToLogin: () => void;
}

// Zod validation schema
const signupSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .email("Invalid email format")
    .refine((email) => email.endsWith("@aurak.ac.ae"), {
      message: "Email must be an AURAK email address (@aurak.ac.ae)",
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function SignUpPage({ onSwitchToLogin }: SignUpPageProps) {
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setErrors({});
    
    // Validate with Zod
    const validationResult = signupSchema.safeParse({
      first_name,
      last_name,
      email,
      password,
    });

    if (!validationResult.success) {
      const fieldErrors: { [key: string]: string } = {};
      validationResult.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    
    setLoading(true);

    try {
      const payload = {
        email,
        password,
        first_name,
        last_name,
        role: "student",
      };
      
      console.log("Signup payload:", payload);
      
      const res = await authAPI.signup(payload);

      setMessage(res.message || "Signup successful! You can now log in.");
    } catch (err: any) {
  const errorMessage = err?.response?.detail || err.message;
  setMessage(errorMessage || "Signup failed");
}
finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          Create an Account
        </h2>

        {message && (
          <p
            className={`text-center mb-4 ${
              message.toLowerCase().includes("success")
                ? "text-green-600"
                : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">First Name</label>
            <input
              type="text"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.first_name ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
              }`}
              value={first_name}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            {errors.first_name && (
              <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Last Name</label>
            <input
              type="text"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.last_name ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
              }`}
              value={last_name}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            {errors.last_name && (
              <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Email</label>
            <input
              type="email"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.email ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.name@aurak.ac.ae"
              pattern=".*@aurak\.ac\.ae$"
              title="Email must end with @aurak.ac.ae"
              required
            />
            {errors.email ? (
              <p className="text-xs text-red-500 mt-1">{errors.email}</p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">Must use AURAK email address</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Password</label>
            <input
              type="password"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.password ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-500"
              }`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {errors.password && (
              <p className="text-xs text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            variant="destructive"
            className="w-full py-2 transition disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </Button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-600 font-semibold hover:underline"
          >
            Log in
          </button>
        </p>
      </div>
    </div>
  );
}
