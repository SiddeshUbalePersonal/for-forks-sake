import type { Metadata } from 'next';
import { Inter, Fira_Code } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira-code' });

export const metadata: Metadata = {
    title: "For Fork's Sake | Learn Git Visually",
    description: "Don't guess what git rebase does. See it. A visual, interactive playground for mastering version control.",
    openGraph: {
        title: "For Fork's Sake | Learn Git Visually",
        description: "Don't guess what git rebase does. See it. A visual, interactive playground for mastering version control.",
        type: 'website',
        // images: ['/og-image.png'], // Placeholder for future asset
    },
    twitter: {
        card: 'summary_large_image',
        title: "For Fork's Sake",
        description: "Master Git with visuals, not just commands.",
    }
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.variable} ${firaCode.variable} antialiased h-screen w-screen overflow-hidden bg-background text-foreground`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Analytics />
                </ThemeProvider>
            </body>
        </html>
    );
}
