
import AuthLayout from "@/components/auth/AuthLayout";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

export const metadata = {
    title: "Verify Your Email | Triumphant Discipleship Academy",
    description:
        "Verify your email address to activate your Triumphant Discipleship Academy account.",
};

export default function VerifyEmailPage() {
    return (
        <AuthLayout>
            <VerifyEmailForm />
        </AuthLayout>
    );
}

