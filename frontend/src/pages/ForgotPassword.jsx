import React, { useState } from "react";
import { Link } from "react-router-dom";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate sending recovery email
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1200);
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#e5e2e1]">Reset Password</h1>
          <p className="text-sm text-gray-400 mt-1">Recover access to your DSAI workspace</p>
        </div>

        {submitted ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[#ffe251]/5 border border-[#ffe251]/20 text-gray-300 text-sm flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-[#ffe251] shrink-0 mt-0.5 animate-pulse">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <div>
                <span className="font-semibold text-[#ffe251] block mb-1">Recovery link sent!</span>
                If <strong className="text-[#e5e2e1]">{email}</strong> exists in our records, a secure password recovery link has been sent to it. Please check your inbox and spam folder.
              </div>
            </div>

            <Link
              to="/login"
              className="w-full bg-[#ffe251] hover:bg-[#ebd048] text-[#0A0A0A] font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-[#ffe251]/10 flex items-center justify-center"
            >
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#ffe251] hover:bg-[#ebd048] text-[#0A0A0A] font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-[#ffe251]/10 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin"></div>
              ) : (
                "Send Recovery Link"
              )}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-xs text-[#ffe251] hover:underline font-semibold">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
