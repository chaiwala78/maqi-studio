import { useState } from "react";
import { KeyRound, Lock, LogIn, LogOut, Mail, ShieldCheck, UserCheck, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, loginWithEmailPassword, registerWithEmailPassword, loginWithGoogle, logoutUser, isUserAdmin } from "@/lib/firebase";
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

  async function handleGoogle() {
    setLoading(true);
    try {
      const u = await loginWithGoogle();
      toast.success(`Signed in via Google as: ${u.displayName || u.email}`);
      setIsOpen(false);
      onSuccess?.();
    } catch (err: any) {
      toast.error("Google sign-in failed: " + (err.message || "Unknown error"));
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
                  {currentUser.email ? currentUser.email[0].toUpperCase() : "A"}
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
          <Tabs defaultValue="password" className="w-full pt-1">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-secondary/50">
              <TabsTrigger value="password" className="text-xs gap-1.5">
                <Lock className="h-3 w-3" /> ID &amp; Password
              </TabsTrigger>
              <TabsTrigger value="google" className="text-xs gap-1.5">
                <Sparkles className="h-3 w-3" /> Google 1-Tap
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: ID & PASSWORD LOGIN */}
            <TabsContent value="password" className="space-y-3">
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3 text-primary" /> Admin ID / Email
                  </label>
                  <Input
                    type="email"
                    placeholder="e.g. admin@maqi.app or jojo219884@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-9 text-xs font-mono"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Lock className="h-3 w-3 text-primary" /> Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
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
            </TabsContent>

            {/* TAB 2: GOOGLE LOGIN */}
            <TabsContent value="google" className="space-y-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">
                One-tap sign in with your authorized admin Google account.
              </p>
              <Button
                variant="outline"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full gap-2 h-10 text-xs font-semibold border-primary/30 hover:bg-primary/10"
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
                Continue with Google
              </Button>
            </TabsContent>
          </Tabs>
        )}

        <div className="rounded-xl border border-border/40 bg-secondary/30 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Session is saved locally. You can log out anytime to clear access from another phone.</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
