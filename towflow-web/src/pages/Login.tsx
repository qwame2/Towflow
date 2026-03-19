import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Truck, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import axios from "axios";

// Access API URL from .env
const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export default function Login() {
  const navigate = useNavigate();

  // State for form inputs
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // State for UI feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user types
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Call Backend API
      // Note: We need to create this specific route in the backend next
      const response = await axios.post(`${API_URL}/company/login`, {
        email: formData.email,
        password: formData.password,
      });

      if (response.data.success) {
        // 2. Save Token & User Info
        localStorage.setItem("company_token", response.data.token);
        localStorage.setItem(
          "company_user",
          JSON.stringify(response.data.company)
        );

        // 3. Redirect to Dashboard
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error("Login Error:", err);
      const msg =
        err.response?.data?.message || "Failed to sign in. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* LEFT SIDE: Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand flex-col justify-between p-12 text-white relative overflow-hidden">
        {/* Decorative Circle */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>

        <div className="z-10 flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Truck size={32} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">
            TowFlow Enterprise
          </span>
        </div>

        <div className="z-10 max-w-md">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">
            Manage your fleet with precision.
          </h1>
          <p className="text-lg text-emerald-100 opacity-90">
            Real-time tracking, automated dispatching, and comprehensive
            analytics for modern towing companies.
          </p>
        </div>

        <div className="z-10 text-sm text-emerald-200">
          © 2025 TowFlow Inc. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-2 text-slate-500">
              Please enter your details to sign in.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2 animate-pulse">
              <span className="font-bold">Error:</span> {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-colors bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400"
                  placeholder="admin@company.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <a
                  href="#"
                  className="text-sm font-semibold text-brand hover:text-brandDark"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-brand focus:border-brand transition-colors bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg shadow-brand/20 text-sm font-bold text-white bg-brand hover:bg-brandDark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center mt-6">
            <p className="text-sm text-slate-500">
              Don't have a company account?{" "}
              <Link
                to="/register"
                className="font-bold text-brand hover:text-brandDark transition-colors"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
