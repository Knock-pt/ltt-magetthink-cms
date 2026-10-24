import './globals.css';

export const metadata = {
  title: 'LTT Ma getThink — Digital Marketing & Creative Production',
  description: 'One-Stop Service Marketing & Creative Production Agency สำหรับธุรกิจโรงแรม รีสอร์ท อสังหาฯ และ F&B',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col font-['Plus_Jakarta_Sans','Noto_Sans_Thai',sans-serif]">
        {children}
      </body>
    </html>
  );
}
