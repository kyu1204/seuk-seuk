"use client";

import Header from "@/components/header";
import { useState, useEffect } from "react";
import { ChevronUp } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  showScrollToTop?: boolean;
}

export default function Layout({ children, showScrollToTop = true }: LayoutProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!showScrollToTop) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [showScrollToTop]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>

      {/* Scroll to top button */}
      {showScrollToTop && scrolled && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 p-3 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all z-50"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}