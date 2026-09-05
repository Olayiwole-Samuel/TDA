import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export const metadata = {
    title: "Sign In | Triumphant Discipleship Academy",
    description:
        "Sign in to your Triumphant Discipleship Academy account.",
};

export default function LoginPage() {
    return (
        <AuthLayout>
            <LoginForm />
        </AuthLayout>
    );
}