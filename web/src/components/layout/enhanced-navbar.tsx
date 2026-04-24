"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Menu, X, Moon, Sun, ChevronDown, User, Settings, LogOut, Zap, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";
import { usePathname } from "next/navigation";

export function EnhancedNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const pathname = usePathname();

  const isHomePage = pathname === "/";

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? "bg-background/95 backdrop-blur-lg border-b border-border shadow-lg"
          : "bg-transparent"
        }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo — always links home */}
          <Link href="/" aria-label="InterVista Home">
            <Logo size="md" showText animated />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {/* Home link if not on home page */}
            {!isHomePage && (
              <Button variant="ghost" asChild>
                <Link href="/">
                  <Home className="w-4 h-4 mr-1" />
                  Home
                </Link>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1">
                  Features <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/#features" className="cursor-pointer">
                    <Zap className="w-4 h-4 mr-2" />
                    AI-Powered Feedback
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/#features" className="cursor-pointer">
                    Real-time Analytics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/#features" className="cursor-pointer">
                    Voice Analysis
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" asChild>
              <Link href="/#how-it-works">How It Works</Link>
            </Button>

            <Button variant="ghost" asChild>
              <Link href="/#pricing">Pricing</Link>
            </Button>

            {/* Dashboard — only show when authenticated */}
            {isAuthenticated && (
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="relative"
                aria-label="Toggle theme"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            )}

            {/* Auth-dependent content */}
            {isLoading ? (
              /* Loading shimmer — neutral state during auth check */
              <div className="flex items-center space-x-2">
                <Skeleton className="h-9 w-20 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            ) : isAuthenticated ? (
              /* Authenticated: Profile dropdown + Sign Out */
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="User menu">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user?.name || "User"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="cursor-pointer">
                        <Zap className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button asChild className="shadow-lg">
                  <Link href="/dashboard">
                    <Zap className="w-4 h-4 mr-2" />
                    Start Practice
                  </Link>
                </Button>
              </>
            ) : (
              /* Guest: Sign In + Get Started */
              <>
                <Button variant="ghost" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg border-0">
                  <Link href="/sign-up">
                    <Zap className="w-4 h-4 mr-2" />
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background/95 backdrop-blur-lg border-t border-border"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {!isHomePage && (
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Link>
                </Button>
              )}
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/#how-it-works">How It Works</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link href="/#pricing">Pricing</Link>
              </Button>

              {isLoading ? (
                <div className="pt-4 space-y-2">
                  <Skeleton className="h-10 w-full rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ) : isAuthenticated ? (
                <>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/profile">Profile</Link>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link href="/settings">Settings</Link>
                  </Button>
                  <div className="pt-4 space-y-2">
                    <Button className="w-full" asChild>
                      <Link href="/dashboard">Start Practice</Link>
                    </Button>
                    <Button variant="outline" className="w-full text-destructive" onClick={() => signOut()}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <div className="pt-4 space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/sign-in">Sign In</Link>
                  </Button>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0" asChild>
                    <Link href="/sign-up">
                      <Zap className="w-4 h-4 mr-2" />
                      Get Started
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}