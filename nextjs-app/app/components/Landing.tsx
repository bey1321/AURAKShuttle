"use client";

import React, { useState } from "react";
import Image from "next/image";
import { authAPI } from "../lib/api";
import { Button } from "./ui";
import App from "../App";

export default function Landing() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<"student" | "driver" | "admin" | null>(null);
  const [userName, setUserName] = useState("");
  const [showSignUp, setShowSignUp] = useState(false);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  // Signup form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [signupMsg, setSignupMsg] = useState("");

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError("");
    setLoading(true);
    try {
      const res = await authAPI.login(email, password);
      const role = (res as any).role as "student" | "driver" | "admin";
      setUserName(email);
      setUserRole(role);
      setIsLoggedIn(true);
    } catch (err: any) {
      setLoginError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupMsg("");
    setLoading(true);
    try {
      const res = await authAPI.signup({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      setSignupMsg(res.message || "Signup successful! You can now log in.");
      setShowSignUp(false);
    } catch (err: any) {
      setSignupMsg(err.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoggedIn) {
    return (
      <App initialLoggedIn={true} initialUserRole={userRole} initialUserName={userName} />
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* Background image - replace `/hero-bg.jpg` with your provided image in `public/` */}
      <Image src="/HomepageBackground.avif" alt="hero" fill className="object-cover" priority />
      <div className="absolute inset-0 bg-black/45" />

      {/* Logo top-left */}
      <div className="absolute top-6 left-8 z-30 flex items-center gap-3">
        <Image src="/favicon.png" alt="logo" width={48} height={48} />
        <div className="text-white text-xl font-semibold tracking-wide">AURAK Shuttle</div>
      </div>

      {/* Main content - center horizontally with large left hero and right card */}
      <div className="relative z-20 h-full w-full max-w-[1400px] mx-auto px-8 lg:px-12 flex items-center justify-between">

        {/* Left hero */}
        <div className="text-white max-w-2xl">
          <p className="uppercase tracking-widest text-lg mb-6 text-red">HOW TO GET FROM</p>
          <h1 className="text-[88px] font-extrabold leading-[0.95] mb-6 drop-shadow-lg">Sharjah to American<br />University of Sharjah</h1>
          <p className="text-lg text-white/90 tracking-wide">By bus, taxi, car or foot</p>
        </div>

        {/* Right card */}
        <div className="w-[460px] bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Find Transport to American University of Sharjah</h2>

          {!showSignUp ? (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && <div className="text-red-600 text-sm">{loginError}</div>}

              <div>
                <label className="text-xs text-gray-500">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full mt-1 px-4 py-3 border rounded-md bg-gray-50"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full mt-1 px-4 py-3 border rounded-md bg-gray-50"
                />
              </div>

              <Button type="submit" className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white">
                {loading ? "Logging in..." : "Sign in"}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Don't have an account? <button type="button" onClick={() => setShowSignUp(true)} className="text-pink-600 font-semibold">Sign up</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              {signupMsg && <div className="text-sm text-gray-700">{signupMsg}</div>}

              <div>
                <label className="text-xs text-gray-500">First name</label>
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full mt-1 px-4 py-3 border rounded-md bg-gray-50" required />
              </div>
              <div>
                <label className="text-xs text-gray-500">Last name</label>
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full mt-1 px-4 py-3 border rounded-md bg-gray-50" required />
              </div>
              <div>
                <label className="text-xs text-gray-500">Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="w-full mt-1 px-4 py-3 border rounded-md bg-gray-50" required />
              </div>
              <div>
                <label className="text-xs text-gray-500">Password</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="w-full mt-1 px-4 py-3 border rounded-md bg-gray-50" required />
              </div>

              <Button type="submit" className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white">{loading ? "Signing up..." : "Create account"}</Button>

              <div className="text-center text-sm text-gray-600">
                Already have an account? <button type="button" onClick={() => setShowSignUp(false)} className="text-pink-600 font-semibold">Log in</button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
