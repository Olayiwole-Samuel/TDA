
import AuthLayout from "@/components/auth/AuthLayout";
import RegisterForm from "@/components/auth/RegisterForm";

export const metadata = {
    title: "Create an Account | Triumphant Discipleship Academy",
    description:
        "Create your Triumphant Discipleship Academy account and begin your learning journey.",
};

export default function RegisterPage() {
    return (
        <AuthLayout>
            <RegisterForm />
        </AuthLayout>
    );
}

