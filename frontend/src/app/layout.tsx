import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal | Private Messenger",
  description: "Signal Web - Say hello to a different messaging experience. An unexpected focus on privacy, combined with all of the features you expect.",
  icons: {
    icon: "/images/signal-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var d = localStorage.getItem('signal_clone_data');
                if (d) {
                  var p = JSON.parse(d);
                  if (p && p.preferences && p.preferences.theme === 'light') {
                    document.documentElement.classList.remove('dark');
                  }
                }
              } catch(e) {}
            })();`,
          }}
        />
      </head>
      <body className="h-full overflow-hidden bg-white dark:bg-[#121212] text-neutral-900 dark:text-neutral-100" style={{ fontFamily: "Segoe UI, Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
