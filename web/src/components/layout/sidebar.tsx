"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { LayoutDashboard, Mic, CreditCard, PieChart, Users } from "lucide-react";

const navItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Mock Interviews",
        href: "/dashboard/mock-interviews",
        icon: Mic,
    },
    {
        title: "Custom Interviews",
        href: "/dashboard/custom",
        icon: Users,
    },
    {
        title: "Results",
        href: "/dashboard/results",
        icon: PieChart,
    },
    {
        title: "Billing",
        href: "/dashboard/billing",
        icon: CreditCard,
        badge: "Free Trial"
    },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="hidden border-r bg-gray-50/50 lg:block dark:bg-gray-800/40 w-64 fixed h-full left-0 top-0 overflow-y-auto z-10">
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-[60px] items-center border-b px-6">
                    <Link className="flex items-center gap-2 font-semibold" href="/dashboard">
                        <Logo size="sm" />
                        <span className="">InterVista</span>
                    </Link>
                </div>
                <div className="flex-1 overflow-auto py-2">
                    <nav className="grid items-start px-4 text-sm font-medium">
                        {navItems.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                                    (pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href)))
                                        ? "bg-primary/20 text-primary dark:bg-gray-800 dark:text-gray-50"
                                        : "text-gray-500 dark:text-gray-400"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.title}
                                {item.badge && (
                                    <span className="ml-auto flex h-6 w-full max-w-[80px] shrink-0 items-center justify-center rounded-full bg-primary/20 px-2.5 text-xs font-medium text-primary group-hover:bg-primary/30">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>
                <div className="mt-auto p-4">
                    {/* User Profile Stub */}
                    <div className="flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm">
                        <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                            U
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">User Profile</span>
                            <span className="text-xs text-muted-foreground">Free Plan</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
