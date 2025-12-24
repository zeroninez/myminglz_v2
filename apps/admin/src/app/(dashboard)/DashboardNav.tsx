'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardNavProps {
  isAdmin?: boolean;
}

const regularNavItems = [
  { href: '/create', label: '생성'},
  { href: '/stats', label: '통계'},
  { href: '/manage', label: '관리'},
];

const adminNavItems = [
  { href: '/dashboard', label: '대시보드' },

];

export default function DashboardNav({ isAdmin = false }: DashboardNavProps) {
  const pathname = usePathname();
  const navItems = isAdmin ? adminNavItems : regularNavItems;

  return (
    <nav className="w-64 min-h-[calc(100vh-73px)]" style={{ backgroundColor: '#6C7885' }}>
      <div className="flex flex-col py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-white'
                  : 'text-white hover:opacity-80'
              }`}
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}



