import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "BonusLab - Collaborative Bonus Management System",
    description: "Collaborative Bonus Management System",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
