"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bot, CheckCircle2, LoaderCircle, LockKeyhole, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { HeaderActions } from "@/components/header-actions";
import { login } from "@/lib/api";
import { useRedirectIfAuthenticated } from "@/lib/use-auth-guard";
import { getDefaultRouteForRole, setStoredAuthSession } from "@/store/auth";

export default function LoginPage() {
  const router = useRouter();
  const [authKey, setAuthKey] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isCheckingAuth } = useRedirectIfAuthenticated();

  const handleLogin = async () => {
    const normalizedAuthKey = authKey.trim();
    if (!normalizedAuthKey) {
      toast.error("Please enter key");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await login(normalizedAuthKey);
      await setStoredAuthSession({
        key: normalizedAuthKey,
        role: data.role,
        subjectId: data.subject_id,
        name: data.name,
      });
      router.replace(getDefaultRouteForRole(data.role));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="grid min-h-[calc(100vh-1rem)] w-full place-items-center px-4 py-6">
        <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative mx-auto grid min-h-[calc(100dvh-2.5rem)] w-full max-w-[1360px] overflow-hidden rounded-3xl border border-slate-200/70 bg-card/70 shadow-[0_32px_100px_-52px_rgba(30,41,59,0.48)] backdrop-blur-xl lg:min-h-[calc(100dvh-3.5rem)] lg:grid-cols-[1.05fr_0.95fr] dark:border-border/10 dark:bg-slate-950/55">
      <HeaderActions className="absolute top-4 right-4 z-20" />

      <section className="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(99,102,241,0.45),transparent_34%),radial-gradient(circle_at_90%_80%,rgba(6,182,212,0.25),transparent_34%)]" />
        <div className="absolute inset-0 opacity-[0.13] [background-image:linear-gradient(rgba(255,255,255,.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.18)_1px,transparent_1px)] [background-size:48px_48px]" />

        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-card/10 ring-1 ring-white/15 backdrop-blur">
            <Bot className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-bold tracking-tight">GPT Console</p>
            <p className="text-xs text-slate-400">AI gateway workspace</p>
          </div>
        </div>

        <div className="relative max-w-xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/10 bg-card/[0.06] px-3 py-1.5 text-xs font-semibold text-indigo-200 backdrop-blur">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Unified AI operations
          </div>
          <div className="space-y-4">
            <h1 className="max-w-lg text-4xl leading-[1.12] font-bold tracking-[-0.035em] xl:text-5xl">
              Your AI gateway, under control.
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-300">
              Manage accounts, generate images, inspect requests, and keep every upstream connection healthy from one focused workspace.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Zap, label: "Fast routing" },
              { icon: ShieldCheck, label: "Secure access" },
              { icon: CheckCircle2, label: "Live status" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-xl border border-border/10 bg-card/[0.055] p-3.5 backdrop-blur">
                <Icon className="mb-3 size-4 text-indigo-300" aria-hidden="true" />
                <p className="text-xs font-semibold text-slate-200">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-500">Private workspace · Protected by access key</p>
      </section>

      <section className="flex min-h-[680px] items-center justify-center px-5 py-16 sm:px-10 lg:min-h-0 lg:px-14 xl:px-20">
        <div className="w-full max-w-md">
          <div className="mb-9 lg:hidden">
            <div className="mb-8 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-white shadow-lg shadow-indigo-500/20">
                <Bot className="size-5" aria-hidden="true" />
              </span>
              <div><p className="font-bold tracking-tight">GPT Console</p><p className="text-xs text-slate-500">AI gateway workspace</p></div>
            </div>
          </div>

          <Card className="border-0 bg-transparent shadow-none backdrop-blur-none">
            <CardContent className="space-y-7 p-0 sm:p-0">
              <div className="space-y-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/12 dark:text-indigo-300">
                  <LockKeyhole className="size-5" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-[-0.025em] text-slate-950 dark:text-white">Welcome back</h2>
                  <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">Sign in with your access key to continue to the workspace.</p>
                </div>
              </div>

              <div className="space-y-2.5">
                <label htmlFor="auth-key" className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Access key</label>
                <Input
                  id="auth-key"
                  type="password"
                  autoComplete="current-password"
                  value={authKey}
                  onChange={(event) => setAuthKey(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") void handleLogin(); }}
                  placeholder="Enter your access key"
                  className="h-12"
                />
                <p className="text-xs leading-5 text-slate-400 dark:text-slate-500">Use the administrator key or a user key created for you.</p>
              </div>

              <Button className="h-12 w-full" onClick={() => void handleLogin()} disabled={isSubmitting}>
                {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <LockKeyhole className="size-4" />}
                {isSubmitting ? "Signing in..." : "Sign in securely"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
