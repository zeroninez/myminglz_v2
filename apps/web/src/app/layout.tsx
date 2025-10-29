import { Providers } from './providers';
import './globals.css';

export const metadata = {
  title: '쿠폰 테스트',
  description: '쿠폰 발급/사용 테스트 페이지',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}