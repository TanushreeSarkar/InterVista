"use client";

import { Suspense, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/ui/logo";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { signInWithGoogle, signInWithGitHub } from "@/lib/oauthHelpers";

function SignInForm() {
  const { signIn, setUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | "">("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const sessionExpired = searchParams?.get("session") === "expired";
  const [error, setError] = useState(sessionExpired ? "Your session has expired. Please sign in again." : "");

  const from = searchParams?.get("from") || "/dashboard";

  const handleOAuth = async (provider: "google" | "github") => {
    try {
      setOauthLoading(provider);
      setError("");
      const result = (provider === "google" ? await signInWithGoogle() : await signInWithGitHub()) as { user?: any };
      if (result.user) {
        setUser(result.user);
        router.push(from);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to sign in with ${provider}`);
    } finally {
      setOauthLoading("");
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password, from);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="flex justify-center mb-4" aria-label="Back to home">
            <Logo size="lg" animated />
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to continue your interview practice</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/reset-password" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                OR
              </span>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => handleOAuth("google")} disabled={!!oauthLoading || loading}>
                {oauthLoading === "google" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Continue with Google
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleOAuth("github")} disabled={!!oauthLoading || loading}>
                {oauthLoading === "github" ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Continue with GitHub
              </Button>
            </div>
          </CardContent>
          <CardFooter className="flex-col space-y-2">
            <div className="text-sm text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}