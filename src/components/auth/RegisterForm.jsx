
"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
    parsePhoneNumberFromString,
} from "libphonenumber-js";
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
    { name: "United Arab Emirates", code: "AE", dialCode: "+971", flag: "🇦🇪" },
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

    const selectedCountry =
        countries.find(
            (country) => country.name === form.country
        ) || countries[0];

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setErrors((current) => ({
            ...current,
            [field]: "",
        }));
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

            if (!phoneNumber) {
                return `Please enter a valid ${selectedCountry.name} phone number.`;
            }

            if (!phoneNumber.isValid()) {
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
            nextErrors.fullName =
                "Please enter your full name.";
        }

        if (!form.email.trim()) {
            nextErrors.email =
                "Please enter your email address.";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
        ) {
            nextErrors.email =
                "Please enter a valid email address.";
        }

        const phoneError = validatePhoneNumber();

        if (phoneError) {
            nextErrors.phone = phoneError;
        }

        if (!form.password) {
            nextErrors.password =
                "Please create a password.";
        } else if (form.password.length < 8) {
            nextErrors.password =
                "Password must be at least 8 characters.";
        }

        if (!form.confirmPassword) {
            nextErrors.confirmPassword =
                "Please confirm your password.";
        } else if (
            form.password !== form.confirmPassword
        ) {
            nextErrors.confirmPassword =
                "Passwords do not match.";
        }

        if (!form.terms) {
            nextErrors.terms =
                "You must agree to the Academy terms.";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        setServerError("");

        if (!validate()) return;

        const phoneNumber = parsePhoneNumberFromString(
            form.phone,
            selectedCountry.code
        );

        if (!phoneNumber) {
            setServerError(
                "We couldn't process your phone number. Please check it and try again."
            );
            return;
        }

        const normalizedPhone = phoneNumber.number;

        try {
            setLoading(true);

            const { data, error } = await supabase.auth.signUp({
                email: form.email.trim().toLowerCase(),
                password: form.password,

                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        full_name: form.fullName.trim(),
                        country: selectedCountry.code,
                        phone: normalizedPhone,
                    },
                },
            });

            if (error) {
                setServerError(error.message);
                return;
            }

            console.log("Account created:", data);

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
                    Create your account and take the first step
                    toward growing in knowledge, character, faith
                    and purpose.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-5"
                noValidate
            >
                {/* Full name */}
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
                        onChange={(event) =>
                            updateField(
                                "fullName",
                                event.target.value
                            )
                        }
                        placeholder="Enter your full name"
                        autoComplete="name"
                        className={`
                            h-12 w-full rounded-2xl border
                            bg-surface px-4 text-sm outline-none
                            transition-all
                            placeholder:text-muted-light
                            focus:border-purple-bright
                            focus:ring-4 focus:ring-purple-bright/10
                            ${errors.fullName
                                ? "border-danger"
                                : "border-border"
                            }
                        `}
                    />

                    {errors.fullName && (
                        <p className="mt-2 text-xs text-danger">
                            {errors.fullName}
                        </p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium"
                    >
                        Email address
                    </label>

                    <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                            updateField(
                                "email",
                                event.target.value
                            )
                        }
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={`
                            h-12 w-full rounded-2xl border
                            bg-surface px-4 text-sm outline-none
                            transition-all
                            placeholder:text-muted-light
                            focus:border-purple-bright
                            focus:ring-4 focus:ring-purple-bright/10
                            ${errors.email
                                ? "border-danger"
                                : "border-border"
                            }
                        `}
                    />

                    {errors.email && (
                        <p className="mt-2 text-xs text-danger">
                            {errors.email}
                        </p>
                    )}
                </div>

                {/* Country + phone */}
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
                            onChange={(event) => {
                                updateField(
                                    "country",
                                    event.target.value
                                );

                                updateField("phone", "");
                            }}
                            className="
                                h-12 w-full appearance-none
                                rounded-2xl border border-border
                                bg-surface px-4 text-sm
                                outline-none transition-all
                                focus:border-purple-bright
                                focus:ring-4
                                focus:ring-purple-bright/10
                            "
                        >
                            {countries.map((country) => (
                                <option
                                    key={country.code}
                                    value={country.name}
                                >
                                    {country.flag}{" "}
                                    {country.name}{" "}
                                    ({country.dialCode})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="phone"
                            className="mb-2 block text-sm font-medium"
                        >
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
                                ${errors.phone
                                    ? "border-danger"
                                    : "border-border"
                                }
                            `}
                        >
                            <div className="flex items-center border-r border-border bg-surface-secondary px-3 text-sm font-medium text-muted">
                                {selectedCountry.dialCode}
                            </div>

                            <input
                                id="phone"
                                type="tel"
                                value={form.phone}
                                onChange={(event) =>
                                    updateField(
                                        "phone",
                                        event.target.value
                                    )
                                }
                                placeholder="801 234 5678"
                                autoComplete="tel"
                                className="
                                    min-w-0 flex-1
                                    bg-transparent px-3
                                    text-sm outline-none
                                    placeholder:text-muted-light
                                "
                            />
                        </div>

                        {errors.phone && (
                            <p className="mt-2 text-xs text-danger">
                                {errors.phone}
                            </p>
                        )}
                    </div>
                </div>

                {/* Password */}
                <PasswordInput
                    label="Password"
                    name="password"
                    value={form.password}
                    onChange={(event) =>
                        updateField(
                            "password",
                            event.target.value
                        )
                    }
                    error={errors.password}
                />

                {/* Confirm password */}
                <PasswordInput
                    label="Confirm password"
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={(event) =>
                        updateField(
                            "confirmPassword",
                            event.target.value
                        )
                    }
                    placeholder="Re-enter your password"
                    error={errors.confirmPassword}
                />

                {/* Terms */}
                <div>
                    <label className="flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={form.terms}
                            onChange={(event) =>
                                updateField(
                                    "terms",
                                    event.target.checked
                                )
                            }
                            className="mt-0.5 h-4 w-4 accent-purple-bright"
                        />

                        <span className="text-xs leading-5 text-muted">
                            I agree to the Academy terms and
                            understand that my information will be
                            used to manage my Academy account.
                        </span>
                    </label>

                    {errors.terms && (
                        <p className="mt-2 text-xs text-danger">
                            {errors.terms}
                        </p>
                    )}
                </div>

                {serverError && (
                    <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                        {serverError}
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

