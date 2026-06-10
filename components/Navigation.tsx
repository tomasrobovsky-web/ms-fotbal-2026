"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Zápasy", icon: "⚽" },
  { href: "/skupiny", label: "Skupiny", icon: "📊" },
  { href: "/zpravy", label: "Zprávy", icon: "📰" },
  { href: "/stadiony", label: "Stadiony", icon: "🏟️" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800 h-16 items-center px-6 gap-8">
        <span className="font-bold text-lg mr-4">MS 2026</span>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`text-sm font-medium transition-colors ${
              pathname === item.href
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-800 flex">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
              pathname === item.href
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
