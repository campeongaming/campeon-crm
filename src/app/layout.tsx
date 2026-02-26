import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AuthGuard } from "@/lib/auth-guard";

export const metadata: Metadata = {
    title: "BonusLab - Collaborative Bonus Management System",
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
