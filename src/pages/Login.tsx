import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ekincareLogoSrc from "@/images/ekincare-logo.png";
import { Eye, EyeOff, Lock, User, Shield, ArrowRight, AlertCircle } from "lucide-react";

const VALID_USER = "ekincare@bussiness";
const VALID_PASS = "ekincare@orm#19*";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    if (username === VALID_USER && password === VALID_PASS) {
      sessionStorage.setItem("ek_auth", "1");
      navigate("/");
    } else {
      setError("Invalid credentials. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white">
      {/* Soft gradient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[-8%] left-[-8%] w-[500px] h-[500px] rounded-full blur-[130px] animate-pulse"
          style={{ background: "rgba(99,102,241,0.10)" }}
        />
        <div
          className="absolute bottom-[-8%] right-[-5%] w-[450px] h-[450px] rounded-full blur-[120px] animate-pulse"
          style={{ background: "rgba(139,92,246,0.10)", animationDelay: "1s" }}
        />
        <div
          className="absolute top-[35%] right-[18%] w-[280px] h-[280px] rounded-full blur-[100px] animate-pulse"
          style={{ background: "rgba(14,165,233,0.08)", animationDelay: "2s" }}
        />
      </div>

      {/* Subtle dot grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: "radial-gradient(circle, #6366f1 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Top badge */}
        <div className="flex justify-center mb-6">
          <div
            className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium backdrop-blur-sm"
            style={{
              background: "rgba(99,102,241,0.08)",
              border: "1px solid rgba(99,102,241,0.18)",
              color: "#6366f1",
            }}
          >
            <Shield className="h-3.5 w-3.5" />
            Secure ORM Dashboard Access
          </div>
        </div>

        {/* White card */}
        <div
          className="rounded-3xl p-8 shadow-2xl"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(99,102,241,0.12)",
            boxShadow:
              "0 8px 40px rgba(99,102,241,0.10), 0 2px 16px rgba(0,0,0,0.06)",
          }}
        >
          {/* Logo — larger */}
          <div className="flex flex-col items-center mb-8">
            <img
              src={ekincareLogoSrc}
              alt="eKincare"
              className="object-contain mb-5"
              style={{ height: "80px" }}
            />
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "#1e1b4b" }}
            >
              Welcome back
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
              Sign in to your ORM Analytics dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#6366f1" }}
              >
                Username
              </label>
              <div className="relative">
                <User
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "#a5b4fc" }}
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm transition-all focus:outline-none"
                  style={{
                    background: "#f5f6ff",
                    border: "1.5px solid #e0e2f7",
                    color: "#1e1b4b",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1.5px solid #6366f1";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(99,102,241,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1.5px solid #e0e2f7";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#6366f1" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "#a5b4fc" }}
                />
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl pl-10 pr-11 py-3 text-sm transition-all focus:outline-none"
                  style={{
                    background: "#f5f6ff",
                    border: "1.5px solid #e0e2f7",
                    color: "#1e1b4b",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.border = "1.5px solid #6366f1";
                    e.currentTarget.style.boxShadow =
                      "0 0 0 3px rgba(99,102,241,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.border = "1.5px solid #e0e2f7";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "#a5b4fc" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#6366f1")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#a5b4fc")
                  }
                >
                  {showPass ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                }}
              >
                <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#ef4444" }} />
                <p className="text-xs" style={{ color: "#dc2626" }}>
                  {error}
                </p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 relative overflow-hidden rounded-xl py-3 text-sm font-semibold text-white transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Signing in…
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign In{" "}
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            className="mt-6 pt-5 text-center"
            style={{ borderTop: "1px solid #e0e2f7" }}
          >
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              © 2026 eKincare · ORM Analytics Platform · Internal Use Only
            </p>
          </div>
        </div>

        {/* Security note */}
        <p className="text-center text-xs mt-4" style={{ color: "#9ca3af" }}>
          🔒 256-bit encrypted · Session secured
        </p>
      </div>
    </div>
  );
}
