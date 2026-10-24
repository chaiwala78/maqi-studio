import { useState } from "react";
import { KeyRound, Lock, LogIn, LogOut, Mail, ShieldCheck, UserCheck, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { auth, loginWithEmailPassword, registerWithEmailPassword, logoutUser, isUserAdmin, MASTER_ADMIN_PASSKEYS } from "@/lib/firebase";
import type { User } from "firebase/auth";

interface AdminAuthModalProps {
  currentUser: User | null;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AdminAuthModal({
  currentUser,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: AdminAuthModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [email, setEmail] = useState("admin@maqi.app");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter both ID/Email and Password.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        const u = await registerWithEmailPassword(email, password);
        toast.success(`Admin account created & signed in: ${u.email}! 🎉`);
      } else {
        const u = await loginWithEmailPassword(email, password);
        toast.success(`Welcome Admin: ${u.email}! 🔑`);
      }
      setIsOpen(false);
      onSuccess?.();
    } catch (err: any) {
      const code = err.code || "";
      const msg = err.message || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        toast.error("Invalid ID or Password. If you haven't set a password yet, click 'Register / Set Password'.");
      } else if (code === "auth/email-already-in-use") {
        toast.error("Account already exists! Please click 'Sign In' instead.");
        setIsRegisterMode(false);
      } else {
        toast.error("Login failed: " + msg);
      }
    } finally {
      setLoading(false);
    }
  }


  async function handleSignOut() {
    await logoutUser();
    toast("Logged out successfully");
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="glass sm:max-w-md border-border/60 bg-neutral-950/95 p-6 backdrop-blur-2xl">
        <DialogHeader className="text-left space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <KeyRound className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-bold">Admin Portal Access</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Sign in from any phone, computer, or friend&apos;s browser using your secure Admin ID &amp; Password.
          </DialogDescription>
        </DialogHeader>

        {currentUser ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold text-xs">
                  {(currentUser.email || "A").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate text-foreground">{currentUser.email}</p>
                  <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    {isUserAdmin(currentUser.email) ? "Verified Admin Access" : "Signed In"}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleSignOut} className="h-8 gap-1 text-xs shrink-0">
                <LogOut className="h-3 w-3" /> Logout
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full pt-1">
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3 text-primary" /> Admin ID / Email
                </label>
                <Input
                  type="text"
                  placeholder="admin@maqi.app or admin"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-xs font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3 text-primary" /> Password / Master Passkey
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password or passkey"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-9 text-xs pr-8 font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full gap-2 mt-2 h-9 text-xs font-semibold">
                <LogIn className="h-3.5 w-3.5" />
                {loading
                  ? "Authenticating..."
                  : isRegisterMode
                  ? "Register & Create Admin Password"
                  : "Sign In with ID & Password"}
              </Button>

              <div className="pt-1 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setIsRegisterMode(!isRegisterMode)}
                  className="text-primary hover:underline"
                >
                  {isRegisterMode ? "Already have a password? Sign In" : "First time? Set / Register Password"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="rounded-xl border border-border/40 bg-secondary/30 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Session is saved locally. You can log out anytime to clear access from another phone.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
