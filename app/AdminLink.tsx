"use client";

import { usePathname } from "next/navigation";

export default function AdminLink() {
  const pathname = usePathname();

  if (pathname === "/admin") return null;

  return (
    <a
      href="/admin"
      className="absolute top-3 right-3 z-50 px-3 py-1.5 bg-white/80 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-lg hover:bg-white transition-colors shadow-sm"
    >
      Admin
    </a>
  );
}
