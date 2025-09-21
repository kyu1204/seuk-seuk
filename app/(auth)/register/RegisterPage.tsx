"use client";

import type React from "react";

import { useState } from "react";
import Link from "next/link";
import { FileSignature, Github, KeyRound, Mail, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/language-context";

export default function RegisterPage() {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate registration process
    setTimeout(() => {
      setIsLoading(false);
      // In a real app, you would redirect to login or dashboard after successful registration
      window.location.href = "/login";
    }, 500);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - Pattern background */}
      <div className="hidden md:block md:w-1/2 relative bg-primary/5 overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5"></div>
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <FileSignature className="h-20 w-20 text-primary mx-auto mb-6" />
            <h1 className="text-4xl font-bold mb-4 gradient-text">
              {t("register.joinUs")}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t("register.joinMessage")}
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Registration form */}
      <div className="w-full md:w-1/2 flex flex-col">
        <div className="flex justify-end p-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              {t("register.backToHome")}
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" size="sm" className="ml-2">
              {t("register.login")}
            </Button>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold tracking-tight">
                {t("register.title")}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("register.subtitle")}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("register.name")}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("register.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("register.password")}</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {t("register.confirmPassword")}
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading
                  ? t("register.registering")
                  : t("register.createAccount")}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    {t("register.orContinueWith")}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Button variant="outline" type="button" className="w-full">
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <Button variant="outline" type="button" className="w-full">
                  <Github className="mr-2 h-4 w-4" />
                  Github
                </Button>
                <Button variant="outline" type="button" className="w-full">
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <rect width="24" height="24" rx="12" fill="#FEE500" />
                    <path
                      d="M12 5.5C8.41 5.5 5.5 7.865 5.5 10.8C5.5 12.7 6.62 14.3875 8.32 15.3375C8.15 15.9125 7.64 17.8 7.59 18.0375C7.53 18.35 7.75 18.35 7.89 18.25C8 18.175 10.21 16.6625 10.83 16.2375C11.21 16.3 11.6 16.325 12 16.325C15.59 16.325 18.5 13.96 18.5 11.025C18.5 8.09 15.59 5.5 12 5.5Z"
                      fill="#392020"
                    />
                  </svg>
                  {t("register.kakaoTalk")}
                </Button>
              </div>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {t("register.alreadyHaveAccount")}
                </span>{" "}
                <Link href="/login" className="text-primary hover:underline">
                  {t("register.login")}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
