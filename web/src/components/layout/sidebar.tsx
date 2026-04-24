"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Grid, 
  Video, 
  BarChart2, 
  PlayCircle, 
  Settings, 
  LogOut,
  X,
  Home,
  Sparkles 
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/contexts/subscription-context";

const navItems = [
    {
        title: "Home",
        href: "/",
        icon: Home,
    },
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: Grid,
    },
    {
        title: "My Interviews",
        href: "/dashboard/history",
        icon: Video,
    },
    {
        title: "Progress",
        href: "/dashboard/results",
        icon: BarChart2,
    },
    {
        title: "Practice Rooms",
        href: "/dashboard/custom",
        icon: PlayCircle,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
];

interface SidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
  onSignOutClick?: () => void;
}

export function Sidebar({ mobileOpen = false, setMobileOpen, onSignOutClick }: SidebarProps) {
    const pathname = usePathname();
    const { user } = useAuth();
    const { isPremium } = useSubscription();

    return (
      <>
        {/* Mobile Overlay */}
        {mobileOpen && (
           <div 
             className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm transition-opacity" 
             onClick={() => setMobileOpen?.(false)}
           />
        )}
        
        {/* Sidebar Container */}
        <div className={cn(
             "fixed top-0 left-0 h-full w-64 border-r border-gray-200 bg-white dark:bg-[#0D0D14] dark:border-[#1E1E2E] z-50 transition-transform duration-300 md:translate-x-0 font-['Inter',sans-serif] flex flex-col",
             mobileOpen ? "translate-x-0" : "-translate-x-full"
           )}
        >
            {/* Header: Logo */}
            <div className="flex h-16 items-center px-6 border-b border-gray-200 dark:border-[#1E1E2E] shrink-0 justify-between">
                <Link className="flex items-center gap-2 font-semibold" href="/">
                    {/* SVG Icon Logo */}
                    <div className="text-indigo-600 dark:text-[#6366F1]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                            <line x1="12" x2="12" y1="19" y2="22"/>
                            <path d="M10 5L8 3"/>
                            <path d="M14 5l2-2"/>
                            <path d="m3 9 2-2"/>
                            <path d="m21 9-2-2"/>
                        </svg>
                    </div>
                    <span className="font-['DM_Sans',sans-serif] font-bold text-gray-900 dark:text-[#F4F4F5] text-lg">
                      InterVista
                    </span>
                </Link>
                {/* Mobile Close */}
                <button 
                  className="md:hidden text-gray-500 hover:text-gray-900 dark:text-[#A1A1AA] dark:hover:text-white"
                  onClick={() => setMobileOpen?.(false)}
                >
                  <X className="w-5 h-5" />
                </button>
            </div>

            {/* Navigation items */}
            <div className="flex-1 overflow-y-auto py-6 px-3 flex flex-col gap-1 custom-scrollbar">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 text-sm font-medium",
                                isActive 
                                    ? "bg-indigo-50 text-indigo-700 dark:bg-[#6366F1]/10 dark:text-[#F4F4F5]" 
                                    : "text-gray-600 hover:bg-gray-100 dark:text-[#A1A1AA] dark:hover:bg-[#1E1E2E] dark:hover:text-[#F4F4F5]"
                            )}
                            onClick={() => setMobileOpen?.(false)}
                        >
                            {/* Accent bar line on active */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-3/4 bg-indigo-600 dark:bg-[#6366F1] rounded-r-full" />
                            )}
                            <item.icon className={cn(
                              "h-[18px] w-[18px]",
                              isActive ? "text-indigo-600 dark:text-[#6366F1]" : "text-gray-400 group-hover:text-gray-600 dark:text-[#A1A1AA] dark:group-hover:text-[#F4F4F5]"
                            )} />
                            {item.title}
                        </Link>
                    )
                })}
            </div>

            {/* Bottom section */}
            <div className="p-4 shrink-0 border-t border-gray-200 dark:border-[#1E1E2E]">
                {/* Upgrade CTA for free users */}
                {!isPremium && (
                  <Link
                    href="/pricing"
                    className="flex items-center gap-2 px-3 py-2.5 mb-3 rounded-lg bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-all group"
                    onClick={() => setMobileOpen?.(false)}
                  >
                    <Sparkles className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
                    <span className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">Upgrade to Premium</span>
                  </Link>
                )}

                {/* User Section */}
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-9 w-9 rounded-full bg-indigo-100 text-indigo-600 dark:bg-[#6366F1]/20 dark:text-[#6366F1] flex items-center justify-center font-bold text-sm shrink-0">
                        {user?.name?.charAt(0) || "T"}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-[#F4F4F5] truncate">
                            {user?.name || "Tanu"}
                        </span>
                        <span className={`text-xs font-semibold ${
                          isPremium 
                            ? "text-indigo-400" 
                            : "text-gray-500 dark:text-zinc-500"
                        }`}>
                           {isPremium ? "Premium ✨" : "Free Plan"}
                        </span>
                    </div>
                </div>
                
                <button 
                  onClick={onSignOutClick}
                  className="w-full flex items-center gap-2 group px-2 py-2 text-sm font-medium text-gray-600 hover:text-red-600 dark:text-[#A1A1AA] dark:hover:text-red-400 transition-colors duration-150 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                    <LogOut className="h-[18px] w-[18px] group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-150" />
                    Sign Out
                </button>
            </div>
        </div>
      </>
    );
}
