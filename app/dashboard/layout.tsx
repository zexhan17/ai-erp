"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
    }

    const navLinks = [
        { href: "/dashboard/chat", label: "Chat" },
        { href: "/dashboard/products", label: "Products" },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <span className="font-bold text-gray-900 text-lg">AI-ERP</span>
                        <nav className="flex gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pathname === link.href
                                            ? "bg-blue-50 text-blue-700"
                                            : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </header>
            <main className="flex-1 flex flex-col">{children}</main>
        </div>
    );
}
