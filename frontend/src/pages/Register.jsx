import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";

export function Register() {
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      await register(username, email, password);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8000/auth/google/login";
  };



  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ffe251]/[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#ffe251]/[0.01] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,226,81,0.03)_0%,transparent_65%)] pointer-events-none" />

      <div className="glass-card w-full max-w-md p-8 rounded-2xl border border-[#2A2A2A] shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#ffe251]/10 border border-[#ffe251]/20 text-[#ffe251] mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-9-3.75h.008v.008H12v-.008Zm0 3h.008v.008H12v-.008Zm0 3h.008v.008H12v-.008Zm0 3h.008v.008H12v-.008Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A4.125 4.125 0 0 1 11 18.5a4.125 4.125 0 0 1-4-3.872v-.109m8-1.391a4.125 4.125 0 0 0-7.533-2.493m7.533 2.493c0-.853-.186-1.662-.516-2.394m-7.017-1.1A4.125 4.125 0 0 0 3 13.5a4.125 4.125 0 0 0 4.121.952m-4.121-.952V13.5c0-.852.186-1.66.516-2.393m7.017-1.1A4.125 4.125 0 0 1 15 13.5v.003" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#e5e2e1]">Create Account</h1>
          <p className="text-sm text-gray-400 mt-1">Get started with Adaptive DSAI</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-900/50 text-red-200 text-sm flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Username</label>
            <input
              type="text"
              required
              className="w-full bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-[#e5e2e1] placeholder-gray-500 focus:outline-none focus:border-[#ffe251] transition-colors"
              placeholder="alex_carter"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-[#e5e2e1] placeholder-gray-500 focus:outline-none focus:border-[#ffe251] transition-colors"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-[#e5e2e1] placeholder-gray-500 focus:outline-none focus:border-[#ffe251] transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Confirm Password</label>
            <input
              type="password"
              required
              className="w-full bg-[#141414] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-[#e5e2e1] placeholder-gray-500 focus:outline-none focus:border-[#ffe251] transition-colors"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#ffe251] hover:bg-[#ebd048] text-[#0A0A0A] font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-[#ffe251]/10 flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2A2A2A]"></div>
          </div>
          <span className="relative bg-[#0F0F0F] px-3 text-xs text-gray-500 uppercase tracking-widest">Or sign up with</span>
        </div>

        <div>
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 border border-[#2A2A2A] hover:bg-white/[0.03] text-sm text-[#e5e2e1] py-3 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          Already have an account?{" "}
          <Link to="/login" className="text-[#ffe251] hover:underline font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
