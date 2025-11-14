import './globals.css';

export const metadata = {
  title: '관리자 페이지 - MyMinglz',
  description: 'MyMinglz 관리자 페이지',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}








