import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  adminAuth,
  firebaseConfigured,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "@/services/firebase-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockKeyhole, LogOut } from "lucide-react";

export function AdminAuthGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!adminAuth) {
      setChecking(false);
      return;
    }
    return onAuthStateChanged(adminAuth, (nextUser) => {
      setUser(nextUser);
      setChecking(false);
    });
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!adminAuth) return;
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(adminAuth, email.trim(), password);
    } catch {
      setError("Login failed. Check your email/password and Firebase Authentication settings.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Checking admin session…</div>;
  }

  if (!firebaseConfigured || !adminAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
          <LockKeyhole className="mb-4 h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl font-semibold">MaQi Admin setup required</h1>
          <p className="mt-2 text-sm text-muted-foreground">Add the Firebase public client settings as Vercel environment variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID and VITE_FIREBASE_APP_ID. No configuration secrets belong in this page.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <form onSubmit={login} className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6">
          <LockKeyhole className="h-6 w-6 text-primary" />
          <div><h1 className="font-display text-2xl font-semibold">MaQi Admin</h1><p className="mt-1 text-sm text-muted-foreground">Sign in with an authorized administrator account.</p></div>
          <label className="block text-sm">Email<Input autoComplete="username" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" /></label>
          <label className="block text-sm">Password<Input autoComplete="current-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1" /></label>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        <span className="max-w-[65vw] truncate">{user.email}</span>
        <Button variant="ghost" size="sm" onClick={() => void signOut(adminAuth)}><LogOut className="mr-1 h-3.5 w-3.5" /> Sign out</Button>
      </div>
      {children}
    </>
  );
}
