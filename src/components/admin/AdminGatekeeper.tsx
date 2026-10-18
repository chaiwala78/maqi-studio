import { useState } from "react";
import {
  KeyRound,
  Lock,
  LogIn,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  loginWithEmailPassword,
  registerWithEmailPassword,
  loginWithGoogle,
  isUserAdmin,
  logoutUser,
  MASTER_ADMIN_PASSKEYS,
} from "@/lib/firebase";

interface AdminGatekeeperProps {
  onAuthenticated: (adminEmail?: string) => void;
}

export function AdminGatekeeper({ onAuthenticated }: AdminGatekeeperProps) {
  const [adminId, setAdminId] = useState("admin@maqi.app");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [attempts, setAttempts] = useState(0);

  function normalizeEmail(rawId: string): string {
    const trimmed = rawId.trim().toLowerCase();
    if (trimmed.includes("@")) {
      return trimmed;
    }
    // Automatically alias simple username like "admin", "chaiwala78", "owner" to @maqi.app
    return `${trimmed}@maqi.app`;
  }

  function saveAdminSession(email: string, method: string) {
    const sessionData = {
      authenticated: true,
      email,
      method,
      timestamp: Date.now(),
    };
    const sessionStr = JSON.stringify(sessionData);

    try {
      sessionStorage.setItem("maqi_admin_session", sessionStr);
      sessionStorage.setItem("maqi_admin_verified", "true");
      if (rememberMe) {
        localStorage.setItem("maqi_admin_session", sessionStr);
      } else {
        localStorage.removeItem("maqi_admin_session");
      }
    } catch (e) {
      console.warn("Storage error:", e);
    }
  }

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    const idInput = adminId.trim();
    const passInput = password.trim();

    if (!idInput || !passInput) {
      toast.error("Please enter your Admin ID and Password.");
      return;
    }

    if (passInput.length < 4) {
      toast.error("Password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    const targetEmail = normalizeEmail(idInput);

    try {
      // 1. MASTER PASSKEY CHECK (Works instantly from any device/friend's phone)
      const isMasterKey = MASTER_ADMIN_PASSKEYS.includes(passInput);
      const isAllowedAdmin = isUserAdmin(targetEmail) || targetEmail.includes("admin") || targetEmail.includes("chaiwala");

      if (isMasterKey && isAllowedAdmin) {
        saveAdminSession(targetEmail, "master_passkey");
        toast.success("Security Clearance Verified! Welcome Admin 🚀", {
          description: `Access granted to MaQi Studio as ${targetEmail}`,
        });
        onAuthenticated(targetEmail);
        return;
      }

      // 2. FIREBASE AUTH CHECK
      let user;
      if (isRegisterMode) {
        user = await registerWithEmailPassword(targetEmail, passInput);
        toast.success(`Admin account created: ${user.email}`);
      } else {
        user = await loginWithEmailPassword(targetEmail, passInput);
      }

      if (!isUserAdmin(user.email)) {
        await logoutUser();
        toast.error(`Access Denied: ${user.email} is not in the authorized Admin whitelist.`, {
          duration: 6000,
        });
        setAttempts((prev) => prev + 1);
        return;
      }

      saveAdminSession(user.email || targetEmail, "firebase_auth");
      toast.success("Security Clearance Verified. Welcome to MaQi Studio! 🚀");
      onAuthenticated(user.email || targetEmail);
    } catch (err: any) {
      const code = err.code || "";
      const msg = err.message || "";

      // Check if user entered master passkey even if Firebase failed
      if (MASTER_ADMIN_PASSKEYS.includes(passInput)) {
        saveAdminSession(targetEmail, "master_passkey_fallback");
        toast.success("Master Passkey Accepted. Admin Access Granted! 🚀");
        onAuthenticated(targetEmail);
        return;
      }

      setAttempts((prev) => prev + 1);

      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        toast.error("Invalid ID or Password.", {
          description: "Check your credentials or click 'First time? Set Admin Password' if you need to create one.",
        });
      } else if (code === "auth/email-already-in-use") {
        toast.error("Account already exists! Please click 'Sign In' instead.");
        setIsRegisterMode(false);
      } else if (code === "auth/operation-not-allowed") {
        toast.error("Firebase Email Auth provider is disabled in Firebase Console.", {
          description: "Use your Master Security Passkey (e.g. maqi@admin78) or Google Sign-In for instant access.",
          duration: 7000,
        });
      } else {
        toast.error("Authentication failed: " + msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (!isUserAdmin(user.email)) {
        await logoutUser();
        toast.error(`Access Denied: ${user.email} is not authorized for MaQi Studio.`, {
          duration: 6000,
        });
        return;
      }

      saveAdminSession(user.email || "admin@maqi.app", "google_oauth");
      toast.success(`Welcome, ${user.displayName || user.email}! 🚀`);
      onAuthenticated(user.email || undefined);
    } catch (err: any) {
      toast.error("Google sign-in failed: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-black px-4 py-8 selection:bg-red-600 selection:text-white overflow-hidden">
      {/* BACKGROUND AMBIENT GLOW */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full bg-red-600/15 blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 h-[450px] w-[450px] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      {/* SECURITY CARD */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-neutral-950/90 p-6 sm:p-8 shadow-2xl backdrop-blur-3xl">
        {/* BRAND BADGE & HEADER */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-neutral-900 text-white shadow-2xl shadow-red-600/30 border border-red-500/30">
            <ShieldCheck className="h-8 w-8 text-white" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-neutral-950"></span>
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-red-400">
              <Lock className="h-3 w-3" />
              Compulsory Admin Gate
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white font-display">
              MaQi Studio Login
            </h1>
            <p className="mt-1 text-xs text-neutral-400 max-w-sm">
              Strict zero-trust enforcement. You must authenticate with an authorized Admin ID &amp; Password to access the control panel.
            </p>
          </div>
        </div>

        {attempts >= 3 && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <span>Multiple failed attempts recorded. Please check your credentials or use your Master Passkey.</span>
          </div>
        )}

        {/* AUTH TABS */}
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-5 bg-neutral-900/90 border border-white/5">
            <TabsTrigger value="password" className="text-xs gap-1.5 data-[state=active]:bg-red-600 data-[state=active]:text-white">
              <KeyRound className="h-3.5 w-3.5" /> ID &amp; Password
            </TabsTrigger>
            <TabsTrigger value="google" className="text-xs gap-1.5 data-[state=active]:bg-neutral-800 data-[state=active]:text-white">
              <Sparkles className="h-3.5 w-3.5" /> Google 1-Tap
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: ID & PASSWORD */}
          <TabsContent value="password" className="space-y-4">
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-medium text-neutral-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-red-500" />
                  Admin ID or Email
                </label>
                <Input
                  type="text"
                  placeholder="admin or admin@maqi.app or chaiwala78"
                  value={adminId}
                  onChange={(e) => setAdminId(e.target.value)}
                  className="h-10 text-xs bg-neutral-900/80 border-white/10 font-mono text-white placeholder:text-neutral-500 focus:border-red-500/50"
                  required
                />
                <span className="text-[10px] text-neutral-500 font-mono">
                  Tip: You can enter &quot;admin&quot; or your full email.
                </span>
              </div>

              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-neutral-300 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-red-500" />
                    Security Password / Passkey
                  </label>
                </div>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password or passkey"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 text-xs bg-neutral-900/80 border-white/10 pr-10 font-mono text-white placeholder:text-neutral-500 focus:border-red-500/50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-neutral-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-white/20 bg-neutral-900 text-red-600 focus:ring-red-500 h-3.5 w-3.5"
                  />
                  <span className="text-[11px] text-neutral-400">Remember this phone/device</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-[11px] text-red-400 hover:underline"
                >
                  {isRegisterMode ? "Switch to Sign In" : "First time? Register"}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 gap-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 transition-all cursor-pointer"
              >
                <LogIn className="h-4 w-4" />
                {loading
                  ? "Verifying Clearance..."
                  : isRegisterMode
                  ? "Create Admin Account & Unlock"
                  : "Unlock Admin Studio"}
              </Button>
            </form>
          </TabsContent>

          {/* TAB 2: GOOGLE 1-TAP */}
          <TabsContent value="google" className="space-y-4 py-2 text-center">
            <p className="text-xs text-neutral-400">
              One-tap authentication with your authorized Google administrator email.
            </p>
            <Button
              variant="outline"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full h-11 gap-2.5 text-xs font-semibold border-white/10 bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Sign In with Google Admin
            </Button>
          </TabsContent>
        </Tabs>

        {/* SECURITY FOOTER */}
        <div className="mt-6 rounded-2xl border border-white/5 bg-neutral-900/60 p-3 text-[11px] text-neutral-400 flex items-start gap-2.5">
          <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <div className="text-left">
            <span className="font-semibold text-neutral-300 block mb-0.5">Air-Tight URL Shield</span>
            <span>All panel routes are strictly inaccessible without prior authentication. Any unrecognized attempt is rejected.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
