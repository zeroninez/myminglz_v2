'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/create', label: '생성' },
  { href: '/stats', label: '통계' },
  { href: '/manage', label: '관리' },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-4 border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {item.label}
            {isActive && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-gray-900" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}



