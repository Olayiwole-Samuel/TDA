"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import Button from "@/components/ui/Button";
import PasswordInput from "./PasswordInput";

const countries = [
    { name: "Nigeria", code: "NG", dialCode: "+234", flag: "🇳🇬" },
    { name: "United States", code: "US", dialCode: "+1", flag: "🇺🇸" },
    { name: "United Kingdom", code: "GB", dialCode: "+44", flag: "🇬🇧" },
    { name: "Canada", code: "CA", dialCode: "+1", flag: "🇨🇦" },
    { name: "Ghana", code: "GH", dialCode: "+233", flag: "🇬🇭" },
    { name: "South Africa", code: "ZA", dialCode: "+27", flag: "🇿🇦" },
    { name: "Australia", code: "AU", dialCode: "+61", flag: "🇦🇺" },
    { name: "Germany", code: "DE", dialCode: "+49", flag: "🇩🇪" },
    { name: "France", code: "FR", dialCode: "+33", flag: "🇫🇷" },
    {
        name: "United Arab Emirates",
        code: "AE",
        dialCode: "+971",
        flag: "🇦🇪",
    },
];

export default function RegisterForm() {
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        country: "Nigeria",
        phone: "",
        password: "",
        confirmPassword: "",
        terms: false,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");
    const [success, setSuccess] = useState(false);

    const selectedCountry =
        countries.find((country) => country.name === form.country) || countries[0];

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setErrors((current) => ({
            ...current,
            [field]: "",
        }));

        setServerError("");
    };

    const validatePhoneNumber = () => {
        if (!form.phone.trim()) {
            return "Please enter your phone number.";
        }

        try {
            const phoneNumber = parsePhoneNumberFromString(
                form.phone,
                selectedCountry.code
            );

            if (!phoneNumber || !phoneNumber.isValid()) {
                return `Please enter a valid ${selectedCountry.name} phone number.`;
            }

            return "";
        } catch {
            return `Please enter a valid ${selectedCountry.name} phone number.`;
        }
    };

    const validate = () => {
        const nextErrors = {};

        if (!form.fullName.trim()) {
            nextErrors.fullName = "Please enter your full name.";
        } else if (form.fullName.trim().length < 2) {
            nextErrors.fullName = "Please enter your full name.";
        }

        if (!form.email.trim()) {
            nextErrors.email = "Please enter your email address.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            nextErrors.email = "Please enter a valid email address.";
        }

        const phoneError = validatePhoneNumber();

        if (phoneError) {
            nextErrors.phone = phoneError;
        }

        if (!form.password) {
            nextErrors.password = "Please create a password.";
        } else if (form.password.length < 8) {
            nextErrors.password = "Password must be at least 8 characters.";
        }

        if (!form.confirmPassword) {
            nextErrors.confirmPassword = "Please confirm your password.";
        } else if (form.password !== form.confirmPassword) {
            nextErrors.confirmPassword = "Passwords do not match.";
        }

        if (!form.terms) {
            nextErrors.terms = "You must agree to the Academy terms.";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const getRedirectUrl = () => {
        const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

        if (configuredUrl) {
            return `${configuredUrl.replace(/\/$/, "")}/auth/callback`;
        }

        if (typeof window !== "undefined") {
            return `${window.location.origin}/auth/callback`;
        }

        return undefined;
    };

    const getFriendlyError = (message) => {
        const lowerMessage = message?.toLowerCase() || "";

        if (
            lowerMessage.includes("user already registered") ||
            lowerMessage.includes("already been registered")
        ) {
            return "An account with this email already exists. Please sign in instead.";
        }

        if (lowerMessage.includes("email rate limit exceeded")) {
            return "Too many verification emails have been requested. Please wait a while before trying again.";
        }

        if (lowerMessage.includes("password should be at least")) {
            return "Your password is too short. Please use at least 8 characters.";
        }

        if (lowerMessage.includes("invalid email")) {
            return "Please enter a valid email address.";
        }

        return (
            message || "We couldn't create your account. Please try again."
        );
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) return;

        setServerError("");
        setSuccess(false);

        if (!validate()) return;

        const phoneNumber = parsePhoneNumberFromString(
            form.phone,
            selectedCountry.code
        );

        if (!phoneNumber || !phoneNumber.isValid()) {
            setErrors((current) => ({
                ...current,
                phone: `Please enter a valid ${selectedCountry.name} phone number.`,
            }));

            return;
        }

        const email = form.email.trim().toLowerCase();
        const fullName = form.fullName.trim();
        const normalizedPhone = phoneNumber.number;

        try {
            setLoading(true);

            const redirectTo = getRedirectUrl();

            const { data, error } = await supabase.auth.signUp({
                email,
                password: form.password,

                options: {
                    ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),

                    data: {
                        full_name: fullName,
                        country: selectedCountry.code,
                        phone: normalizedPhone,
                    },
                },
            });

            if (error) {
                console.error("Supabase registration error:", error);

                setServerError(getFriendlyError(error.message));

                return;
            }

            /*
             * With email confirmation enabled,
             * Supabase normally returns:
             *
             * data.user  -> created user
             * data.session -> null
             *
             * That is expected.
             */

            if (!data?.user) {
                setServerError(
                    "Your account could not be created. Please try again."
                );

                return;
            }

            console.log("Registration successful:", {
                userId: data.user.id,
                email: data.user.email,
                emailConfirmed: data.user.email_confirmed_at,
                hasSession: Boolean(data.session),
            });

            setSuccess(true);

            window.location.href = "/verify-email";
        } catch (error) {
            console.error("Registration error:", error);

            setServerError(
                "Something went wrong while creating your account. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8 text-center">
                <p className="text-sm font-medium text-purple-bright">
                    Join the Academy
                </p>

                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                    Begin your journey.
                </h1>

                <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted">
                    Create your account and take the first step toward growing in
                    knowledge, character, faith and purpose.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                    <label
                        htmlFor="fullName"
                        className="mb-2 block text-sm font-medium"
                    >
                        Full name
                    </label>

                    <input
                        id="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={(event) => updateField("fullName", event.target.value)}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        disabled={loading}
                        className={`
              h-12 w-full rounded-2xl border
              bg-surface px-4 text-sm outline-none
              transition-all
              placeholder:text-muted-light
              focus:border-purple-bright
              focus:ring-4 focus:ring-purple-bright/10
              disabled:cursor-not-allowed disabled:opacity-60
              ${errors.fullName ? "border-danger" : "border-border"}
            `}
                    />

                    {errors.fullName && (
                        <p className="mt-2 text-xs text-danger">{errors.fullName}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium">
                        Email address
                    </label>

                    <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(event) => updateField("email", event.target.value)}
                        placeholder="you@example.com"
                        autoComplete="email"
                        disabled={loading}
                        className={`
              h-12 w-full rounded-2xl border
              bg-surface px-4 text-sm outline-none
              transition-all
              placeholder:text-muted-light
              focus:border-purple-bright
              focus:ring-4 focus:ring-purple-bright/10
              disabled:cursor-not-allowed disabled:opacity-60
              ${errors.email ? "border-danger" : "border-border"}
            `}
                    />

                    {errors.email && (
                        <p className="mt-2 text-xs text-danger">{errors.email}</p>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-[0.9fr_1.1fr]">
                    <div>
                        <label
                            htmlFor="country"
                            className="mb-2 block text-sm font-medium"
                        >
                            Country
                        </label>

                        <select
                            id="country"
                            value={form.country}
                            disabled={loading}
                            onChange={(event) => {
                                setForm((current) => ({
                                    ...current,
                                    country: event.target.value,
                                    phone: "",
                                }));

                                setErrors((current) => ({
                                    ...current,
                                    country: "",
                                    phone: "",
                                }));
                            }}
                            className="
                h-12 w-full appearance-none
                rounded-2xl border border-border
                bg-surface px-4 text-sm
                outline-none transition-all
                focus:border-purple-bright
                focus:ring-4
                focus:ring-purple-bright/10
                disabled:cursor-not-allowed disabled:opacity-60
              "
                        >
                            {countries.map((country) => (
                                <option key={country.code} value={country.name}>
                                    {country.flag} {country.name} ({country.dialCode})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="phone" className="mb-2 block text-sm font-medium">
                            Phone number
                        </label>

                        <div
                            className={`
                flex h-12 overflow-hidden
                rounded-2xl border
                bg-surface
                transition-all
                focus-within:border-purple-bright
                focus-within:ring-4
                focus-within:ring-purple-bright/10
                ${errors.phone ? "border-danger" : "border-border"}
              `}
                        >
                            <div className="flex items-center border-r border-border bg-surface-secondary px-3 text-sm font-medium text-muted">
                                {selectedCountry.dialCode}
                            </div>

                            <input
                                id="phone"
                                type="tel"
                                value={form.phone}
                                onChange={(event) => updateField("phone", event.target.value)}
                                placeholder="801 234 5678"
                                autoComplete="tel"
                                disabled={loading}
                                className="
                  min-w-0 flex-1
                  bg-transparent px-3
                  text-sm outline-none
                  placeholder:text-muted-light
                  disabled:cursor-not-allowed disabled:opacity-60
                "
                            />
                        </div>

                        {errors.phone && (
                            <p className="mt-2 text-xs text-danger">{errors.phone}</p>
                        )}
                    </div>
                </div>

                <PasswordInput
                    label="Password"
                    name="password"
                    value={form.password}
                    onChange={(event) => updateField("password", event.target.value)}
                    error={errors.password}
                />

                <PasswordInput
                    label="Confirm password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={(event) =>
                        updateField("confirmPassword", event.target.value)
                    }
                    placeholder="Re-enter your password"
                    error={errors.confirmPassword}
                />

                <div>
                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={form.terms}
                            onChange={(event) => updateField("terms", event.target.checked)}
                            disabled={loading}
                            className="mt-0.5 h-4 w-4 accent-purple-bright"
                        />

                        <span className="text-xs leading-5 text-muted">
                            I agree to the Academy terms and understand that my information
                            will be used to manage my Academy account.
                        </span>
                    </label>

                    {errors.terms && (
                        <p className="mt-2 text-xs text-danger">{errors.terms}</p>
                    )}
                </div>

                {serverError && (
                    <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm leading-5 text-danger">
                        {serverError}
                    </div>
                )}

                {success && (
                    <div className="rounded-2xl border border-success/20 bg-success/5 px-4 py-3 text-sm leading-5 text-success">
                        Your account has been created. Check your email to verify your
                        account.
                    </div>
                )}

                <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full"
                    disabled={loading}
                >
                    {loading ? "Creating account..." : "Create account"}
                </Button>
            </form>

            <p className="mt-7 text-center text-sm text-muted">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-medium text-purple-bright transition-colors hover:text-purple-highlight"
                >
                    Sign in
                </Link>
            </p>
        </div>
    );
}