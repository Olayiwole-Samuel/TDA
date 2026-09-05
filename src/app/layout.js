import "./globals.css";
import ThemeProvider from "@/components/providers/ThemeProvider";

export const metadata = {
    title: "Discipleship Academy",
    description:
        "A structured learning journey designed to help students grow in knowledge, character, faith, and purpose.",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body>
                <ThemeProvider>{children}</ThemeProvider>
            </body>
        </html>
    );
}