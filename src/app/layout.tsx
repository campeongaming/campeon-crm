import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/lib/auth-guard";

export const metadata: Metadata = {
    title: "BonusLab - Collaborative Bonus Management System",
    description: "Collaborative Bonus Management System",
    icons: {
        icon: "/Bonuslab_transparent.png",
        shortcut: "/Bonuslab_transparent.png",
        apple: "/Bonuslab_transparent.png",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <AuthGuard>
                        {children}
                    </AuthGuard>
                </AuthProvider>
            </body>
        </html>
    );
}
