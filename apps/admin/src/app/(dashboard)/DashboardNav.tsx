'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardNavProps {
  isAdmin?: boolean;
}

const regularNavItems = [
  { href: '/create', label: '이벤트 생성하기', special: true},
  { href: '/event-home', label: '이벤트 홈'},
  { href: '/manage', label: '전체 이벤트 관리'},
  { href: '/stats', label: '이벤트 통계'},
];

const adminNavItems = [
  { href: '/dashboard', label: '대시보드' },

];

export default function DashboardNav({ isAdmin = false }: DashboardNavProps) {
  const pathname = usePathname();
  const navItems = isAdmin ? adminNavItems : regularNavItems;

  return (
    <nav className="min-h-[calc(100vh-73px)]" style={{ backgroundColor: '#F3F4F6', width: '240px' }}>
      <div className="flex flex-col">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/');
          const isSpecial = (item as any).special;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 text-sm font-medium transition-colors ${
                isSpecial ? 'justify-center' : ''
              } ${
                isActive && !isSpecial
                  ? ''
                  : 'hover:opacity-80'
              }`}
              style={{
                width: '240px',
                height: isSpecial ? '68px' : '60px',
                backgroundColor: isSpecial ? '#6C7885' : (isActive ? '#E7EAF1' : 'transparent'),
                color: isSpecial ? '#FFFFFF' : (isActive ? '#4D82F3' : '#32373D')
              }}
            >
              <span>{item.label}</span>
              {isSpecial && (
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.75 14C22.75 13.7679 22.8422 13.5454 23.0063 13.3813C23.1704 13.2172 23.3929 13.125 23.625 13.125C23.8571 13.125 24.0796 13.2172 24.2437 13.3813C24.4078 13.5454 24.5 13.7679 24.5 14V23.625C24.5 23.8571 24.4078 24.0796 24.2437 24.2437C24.0796 24.4078 23.8571 24.5 23.625 24.5H4.375C4.14294 24.5 3.92038 24.4078 3.75628 24.2437C3.59219 24.0796 3.5 23.8571 3.5 23.625V4.375C3.5 4.14294 3.59219 3.92038 3.75628 3.75628C3.92038 3.59219 4.14294 3.5 4.375 3.5H14C14.2321 3.5 14.4546 3.59219 14.6187 3.75628C14.7828 3.92038 14.875 4.14294 14.875 4.375C14.875 4.60706 14.7828 4.82962 14.6187 4.99372C14.4546 5.15781 14.2321 5.25 14 5.25H5.25V22.75H22.75V14Z" fill="white"/>
                  <path d="M12.8512 15.1567L14.2949 14.9502L23.1639 6.08291C23.2475 6.00219 23.3142 5.90564 23.36 5.79889C23.4059 5.69213 23.43 5.57732 23.431 5.46113C23.4321 5.34495 23.4099 5.22973 23.3659 5.1222C23.3219 5.01466 23.257 4.91697 23.1748 4.83481C23.0926 4.75266 22.9949 4.68768 22.8874 4.64369C22.7799 4.59969 22.6647 4.57755 22.5485 4.57856C22.4323 4.57957 22.3175 4.60371 22.2107 4.64957C22.104 4.69543 22.0074 4.76209 21.9267 4.84566L13.0559 13.7129L12.8494 15.1567H12.8512ZM24.4012 3.60666C24.6451 3.85043 24.8386 4.13989 24.9707 4.45848C25.1027 4.77707 25.1706 5.11855 25.1706 5.46341C25.1706 5.80827 25.1027 6.14975 24.9707 6.46834C24.8386 6.78693 24.6451 7.07638 24.4012 7.32016L15.3274 16.3939C15.1936 16.5282 15.0198 16.6154 14.8322 16.6424L11.9447 17.0554C11.8101 17.0747 11.6729 17.0624 11.5439 17.0195C11.4149 16.9766 11.2977 16.9041 11.2016 16.808C11.1055 16.7119 11.0331 16.5947 10.9901 16.4657C10.9472 16.3367 10.9349 16.1995 10.9542 16.0649L11.3672 13.1774C11.3937 12.99 11.4803 12.8162 11.6139 12.6822L20.6894 3.60841C21.1817 3.1163 21.8493 2.83984 22.5453 2.83984C23.2414 2.83984 23.9089 3.1163 24.4012 3.60841V3.60666Z" fill="white"/>
                </svg>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}



