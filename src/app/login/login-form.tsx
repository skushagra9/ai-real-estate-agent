"use client";

import { useState, useEffect } from "react";
import { getCsrfToken } from "next-auth/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Where to send the user after successful login (home then server redirects by role).
const DEFAULT_CALLBACK_URL = "/";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [callbackUrl, setCallbackUrl] = useState(DEFAULT_CALLBACK_URL);
  const searchParams = useSearchParams();

  useEffect(() => {
    getCsrfToken().then(setCsrfToken);
  }, []);
  // Absolute callback URL so NextAuth never falls back to Referer (current /login page).
  useEffect(() => {
    if (typeof window !== "undefined") setCallbackUrl(`${window.location.origin}${DEFAULT_CALLBACK_URL}`);
  }, []);

  const callbackError = searchParams.get("error");
  const displayError =
    callbackError === "CredentialsSignin"
      ? "Invalid email or password"
      : callbackError
        ? "Login failed. Check Vercel logs for [Auth] messages or try again."
        : "";

  // Native form POST so the browser does a full-page POST → server responds with
  // Set-Cookie + 302 in the same response → cookie is stored and sent on the next request.
  // Fixes prod where fetch()+redirect left the cookie not sent on the dashboard request.
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">LoanFlow</CardTitle>
        </CardHeader>
        <CardContent>
          {!csrfToken ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : (
          <form
            method="post"
            action="/api/auth/callback/credentials"
            className="space-y-4"
            encType="application/x-www-form-urlencoded"
          >
            <input type="hidden" name="csrfToken" value={csrfToken} />
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <input type="hidden" name="redirectTo" value={callbackUrl} />
            {displayError && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                {displayError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Sign In
            </Button>
          </form>
          )}
          <div className="mt-4 text-center text-sm text-gray-500">
            Referral partner?{" "}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">
              Create an account
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
