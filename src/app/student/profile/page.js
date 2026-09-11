"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Globe2,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Save,
    LogOut,
    GraduationCap,
    CalendarDays,
    Camera,
    Lock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

function normalizeProfile(data) {
    if (!data) return null;

    if (Array.isArray(data)) {
        return data[0] || null;
    }

    if (data.profile) {
        return Array.isArray(data.profile)
            ? data.profile[0] || null
            : data.profile;
    }

    return data;
}

function normalizeOverview(data) {
    if (!data) return {};

    if (Array.isArray(data)) {
        return data[0] || {};
    }

    return data;
}

function getInitials(name) {
    if (!name?.trim()) return "T";

    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatDate(date) {
    if (!date) return "—";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "—";
    }

    return parsed.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function getDisplayValue(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }

    if (typeof value === "string" || typeof value === "number") {
        return String(value);
    }

    if (typeof value === "object") {
        return (
            value.name ||
            value.title ||
            value.label ||
            value.full_name ||
            value.email ||
            null
        );
    }

    return null;
}

function getAcademicLevel(overview) {
    const level =
        overview?.level ||
        overview?.current_level ||
        overview?.level_data ||
        overview?.current_level_data;

    if (typeof level === "string" || typeof level === "number") {
        return String(level);
    }

    if (level && typeof level === "object") {
        if (level.name) {
            return level.name;
        }

        if (level.level_number !== undefined) {
            return `${level.level_number} Level`;
        }
    }

    if (overview?.level_name) {
        return getDisplayValue(overview.level_name);
    }

    if (overview?.current_level_name) {
        return getDisplayValue(overview.current_level_name);
    }

    return null;
}

function getAcademicSession(overview) {
    const session =
        overview?.session ||
        overview?.academic_session ||
        overview?.current_session ||
        overview?.session_data;

    if (typeof session === "string" || typeof session === "number") {
        return String(session);
    }

    if (session && typeof session === "object") {
        if (session.name) {
            return session.name;
        }

        if (session.title) {
            return session.title;
        }
    }

    if (overview?.session_name) {
        return getDisplayValue(overview.session_name);
    }

    if (overview?.current_session_name) {
        return getDisplayValue(overview.current_session_name);
    }

    return null;
}

function getEnrollmentStatus(overview) {
    const enrollment =
        overview?.enrollment ||
        overview?.current_enrollment;

    if (enrollment && typeof enrollment === "object") {
        return (
            enrollment.status ||
            enrollment.enrollment_status ||
            null
        );
    }

    if (
        typeof enrollment === "string" ||
        typeof enrollment === "number"
    ) {
        return String(enrollment);
    }

    if (overview?.enrollment_status) {
        return getDisplayValue(overview.enrollment_status);
    }

    return null;
}

export default function StudentProfilePage() {
    const router = useRouter();

    const [profile, setProfile] = useState(null);
    const [overview, setOverview] = useState(null);

    const [form, setForm] = useState({
        fullName: "",
        phone: "",
        country: "",
        avatarUrl: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        setLoading(true);
        setError("");

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            if (!user) {
                router.replace("/login");
                return;
            }

            const [profileResponse, overviewResponse] =
                await Promise.all([
                    supabase.rpc("get_my_profile"),
                    supabase.rpc("get_my_academic_overview"),
                ]);

            if (profileResponse.error) {
                throw profileResponse.error;
            }

            if (overviewResponse.error) {
                throw overviewResponse.error;
            }

            const profileData = normalizeProfile(
                profileResponse.data
            );

            const overviewData = normalizeOverview(
                overviewResponse.data
            );

            if (!profileData) {
                throw new Error(
                    "Your profile could not be loaded."
                );
            }

            setProfile(profileData);
            setOverview(overviewData);

            setForm({
                fullName: profileData.full_name || "",
                phone: profileData.phone || "",
                country: profileData.country || "",
                avatarUrl: profileData.avatar_url || "",
            });
        } catch (err) {
            console.error("Profile loading error:", err);

            setError(
                err?.message ||
                    "Something went wrong while loading your profile."
            );
        } finally {
            setLoading(false);
        }
    }

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        if (error) {
            setError("");
        }

        if (success) {
            setSuccess("");
        }
    }

    async function handleSave(event) {
        event.preventDefault();

        if (!form.fullName.trim()) {
            setError("Please enter your full name.");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const { data, error: updateError } =
                await supabase.rpc("update_my_profile", {
                    p_full_name: form.fullName.trim(),
                    p_phone: form.phone.trim() || null,
                    p_country: form.country.trim() || null,
                    p_avatar_url:
                        form.avatarUrl.trim() || null,
                });

            if (updateError) {
                throw updateError;
            }

            const updatedProfile = normalizeProfile(data);

            if (updatedProfile) {
                setProfile(updatedProfile);

                setForm({
                    fullName:
                        updatedProfile.full_name || "",
                    phone:
                        updatedProfile.phone || "",
                    country:
                        updatedProfile.country || "",
                    avatarUrl:
                        updatedProfile.avatar_url || "",
                });
            } else {
                await loadProfile();
            }

            setSuccess(
                "Your profile has been updated successfully."
            );

            setTimeout(() => {
                setSuccess("");
            }, 4000);
        } catch (err) {
            console.error("Profile update error:", err);

            setError(
                err?.message ||
                    "Something went wrong while updating your profile."
            );
        } finally {
            setSaving(false);
        }
    }

    async function handleSignOut() {
        setSigningOut(true);
        setError("");

        try {
            const { error: signOutError } =
                await supabase.auth.signOut();

            if (signOutError) {
                throw signOutError;
            }

            router.replace("/login");
        } catch (err) {
            console.error("Sign out error:", err);

            setError(
                err?.message ||
                    "Unable to sign out. Please try again."
            );

            setSigningOut(false);
        }
    }

    const initials = useMemo(
        () => getInitials(form.fullName),
        [form.fullName]
    );

    const academicLevel = getAcademicLevel(overview);
    const academicSession = getAcademicSession(overview);
    const enrollmentStatus = getEnrollmentStatus(overview);

    const isActive =
        profile?.is_active === undefined
            ? true
            : Boolean(profile.is_active);

    if (loading) {
        return (
            <main className="min-h-screen bg-background text-foreground">
                <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-6">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface shadow-sm">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>

                        <div>
                            <p className="text-sm font-semibold">
                                Loading your profile
                            </p>

                            <p className="mt-1 text-sm text-muted">
                                Please wait a moment.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background text-foreground">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                >
                    <Link
                        href="/student/dashboard"
                        className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-primary"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Dashboard
                    </Link>

                    <div className="mb-8">
                        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                            Account
                        </p>

                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                            Your profile
                        </h1>

                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                            Manage your personal information and view
                            your academy account details.
                        </p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-4"
                        >
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />

                            <div>
                                <p className="text-sm font-semibold text-danger">
                                    Something went wrong
                                </p>

                                <p className="mt-1 text-sm leading-5 text-muted">
                                    {error}
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {success && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 flex items-start gap-3 rounded-2xl border border-success/20 bg-success/5 px-4 py-4"
                        >
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />

                            <div>
                                <p className="text-sm font-semibold text-success">
                                    Profile updated
                                </p>

                                <p className="mt-1 text-sm leading-5 text-muted">
                                    Your changes have been saved.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                        <div className="space-y-6">
                            <motion.section
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.45,
                                    delay: 0.05,
                                }}
                                className="overflow-hidden rounded-[28px] border border-border bg-surface shadow-sm"
                            >
                                <div className="border-b border-border px-5 py-5 sm:px-7">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <User className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <h2 className="text-base font-semibold">
                                                Personal information
                                            </h2>

                                            <p className="mt-0.5 text-sm text-muted">
                                                Keep your academy
                                                information up to date.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <form
                                    onSubmit={handleSave}
                                    className="p-5 sm:p-7"
                                >
                                    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center">
                                        <div className="relative">
                                            {form.avatarUrl ? (
                                                <>
                                                    <img
                                                        src={
                                                            form.avatarUrl
                                                        }
                                                        alt={
                                                            form.fullName ||
                                                            "Profile"
                                                        }
                                                        className="h-24 w-24 rounded-[28px] border border-border object-cover shadow-sm"
                                                        onError={(
                                                            event
                                                        ) => {
                                                            event.currentTarget.style.display =
                                                                "none";

                                                            const fallback =
                                                                event.currentTarget
                                                                    .nextElementSibling;

                                                            if (
                                                                fallback
                                                            ) {
                                                                fallback.style.display =
                                                                    "flex";
                                                            }
                                                        }}
                                                    />

                                                    <div
                                                        className="hidden h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-purple-deep via-primary to-accent text-2xl font-bold text-white shadow-lg"
                                                    >
                                                        {initials}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-purple-deep via-primary to-accent text-2xl font-bold text-white shadow-lg">
                                                    {initials}
                                                </div>
                                            )}

                                            <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-primary shadow-sm">
                                                <Camera className="h-4 w-4" />
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold">
                                                {form.fullName ||
                                                    "TDA Student"}
                                            </h3>

                                            <p className="mt-1 text-sm text-muted">
                                                {profile?.email ||
                                                    "No email available"}
                                            </p>

                                            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                                                <GraduationCap className="h-3.5 w-3.5" />
                                                Student
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <label
                                                htmlFor="fullName"
                                                className="mb-2 block text-sm font-semibold"
                                            >
                                                Full name
                                            </label>

                                            <div className="relative">
                                                <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

                                                <input
                                                    id="fullName"
                                                    name="fullName"
                                                    type="text"
                                                    value={
                                                        form.fullName
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="Enter your full name"
                                                    className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label
                                                htmlFor="email"
                                                className="mb-2 block text-sm font-semibold"
                                            >
                                                Email address
                                            </label>

                                            <div className="relative">
                                                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

                                                <input
                                                    id="email"
                                                    type="email"
                                                    value={
                                                        profile?.email ||
                                                        ""
                                                    }
                                                    readOnly
                                                    className="h-12 w-full cursor-not-allowed rounded-2xl border border-border bg-surface-secondary pl-11 pr-4 text-sm text-muted outline-none"
                                                />
                                            </div>

                                            <p className="mt-2 text-xs text-muted">
                                                Your email is connected to
                                                your academy account and
                                                cannot be changed here.
                                            </p>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="phone"
                                                className="mb-2 block text-sm font-semibold"
                                            >
                                                Phone number
                                            </label>

                                            <div className="relative">
                                                <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

                                                <input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    value={
                                                        form.phone
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="+234 800 000 0000"
                                                    className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="country"
                                                className="mb-2 block text-sm font-semibold"
                                            >
                                                Country
                                            </label>

                                            <div className="relative">
                                                <Globe2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

                                                <input
                                                    id="country"
                                                    name="country"
                                                    type="text"
                                                    value={
                                                        form.country
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="Nigeria"
                                                    className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                                                />
                                            </div>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <label
                                                htmlFor="avatarUrl"
                                                className="mb-2 block text-sm font-semibold"
                                            >
                                                Profile photo URL
                                            </label>

                                            <div className="relative">
                                                <Camera className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />

                                                <input
                                                    id="avatarUrl"
                                                    name="avatarUrl"
                                                    type="url"
                                                    value={
                                                        form.avatarUrl
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder="https://example.com/profile-photo.jpg"
                                                    className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                                                />
                                            </div>

                                            <p className="mt-2 text-xs text-muted">
                                                Use a publicly accessible
                                                image URL.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-xs leading-5 text-muted">
                                            Changes to your profile are
                                            saved securely to your TDA
                                            account.
                                        </p>

                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    Save changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </motion.section>

                            <motion.section
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.45,
                                    delay: 0.1,
                                }}
                                className="rounded-[28px] border border-border bg-surface shadow-sm"
                            >
                                <div className="border-b border-border px-5 py-5 sm:px-7">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                            <ShieldCheck className="h-5 w-5" />
                                        </div>

                                        <div>
                                            <h2 className="text-base font-semibold">
                                                Security
                                            </h2>

                                            <p className="mt-0.5 text-sm text-muted">
                                                Manage access to your
                                                academy account.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="divide-y divide-border">
                                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                                        <div className="flex gap-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-muted">
                                                <Lock className="h-4 w-4" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold">
                                                    Password
                                                </p>

                                                <p className="mt-1 max-w-lg text-sm leading-5 text-muted">
                                                    Reset your password
                                                    through the secure
                                                    account recovery
                                                    process.
                                                </p>
                                            </div>
                                        </div>

                                        <Link
                                            href="/forgot-password"
                                            className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-semibold transition hover:border-primary hover:bg-primary/5 hover:text-primary"
                                        >
                                            Reset password
                                        </Link>
                                    </div>

                                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                                        <div className="flex gap-4">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                                                <ShieldCheck className="h-4 w-4" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-semibold">
                                                    Account status
                                                </p>

                                                <p className="mt-1 text-sm text-muted">
                                                    Your academy account
                                                    is currently{" "}
                                                    <span className="font-medium text-foreground">
                                                        {isActive
                                                            ? "active"
                                                            : "inactive"}
                                                    </span>
                                                    .
                                                </p>
                                            </div>
                                        </div>

                                        <span
                                            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                                isActive
                                                    ? "bg-success/10 text-success"
                                                    : "bg-danger/10 text-danger"
                                            }`}
                                        >
                                            <span
                                                className={`h-1.5 w-1.5 rounded-full ${
                                                    isActive
                                                        ? "bg-success"
                                                        : "bg-danger"
                                                }`}
                                            />
                                            {isActive
                                                ? "Active"
                                                : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                            </motion.section>

                            <motion.section
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.45,
                                    delay: 0.15,
                                }}
                                className="rounded-[28px] border border-danger/15 bg-surface shadow-sm"
                            >
                                <div className="p-5 sm:p-7">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold">
                                                Sign out
                                            </p>

                                            <p className="mt-1 max-w-lg text-sm leading-5 text-muted">
                                                Sign out of your TDA
                                                account on this device.
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={
                                                handleSignOut
                                            }
                                            disabled={signingOut}
                                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-danger/20 px-5 text-sm font-semibold text-danger transition hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {signingOut ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Signing out...
                                                </>
                                            ) : (
                                                <>
                                                    <LogOut className="h-4 w-4" />
                                                    Sign out
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.section>
                        </div>

                        <motion.aside
                            initial={{ opacity: 0, x: 18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: 0.45,
                                delay: 0.12,
                            }}
                            className="space-y-6"
                        >
                            <section className="overflow-hidden rounded-[28px] border border-border bg-surface shadow-sm">
                                <div className="relative overflow-hidden bg-gradient-to-br from-purple-deep via-primary to-accent px-6 py-7 text-white">
                                    <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/10 blur-2xl" />

                                    <div className="relative">
                                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                                            <GraduationCap className="h-6 w-6" />
                                        </div>

                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-purple-light">
                                            Academy
                                        </p>

                                        <h2 className="mt-2 text-xl font-semibold">
                                            Your academic journey
                                        </h2>

                                        <p className="mt-2 text-sm leading-6 text-purple-light">
                                            Your academic information is
                                            managed by the academy and
                                            displayed here from your
                                            account records.
                                        </p>
                                    </div>
                                </div>

                                <div className="divide-y divide-border">
                                    <div className="flex items-center gap-4 px-5 py-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <GraduationCap className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-muted">
                                                Current level
                                            </p>

                                            <p className="mt-1 truncate text-sm font-semibold">
                                                {academicLevel ||
                                                    "Not available"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 px-5 py-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            <CalendarDays className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-muted">
                                                Academic session
                                            </p>

                                            <p className="mt-1 truncate text-sm font-semibold">
                                                {academicSession ||
                                                    "Not available"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 px-5 py-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                                            <CheckCircle2 className="h-4 w-4" />
                                        </div>

                                        <div className="min-w-0">
                                            <p className="text-xs font-medium text-muted">
                                                Enrollment
                                            </p>

                                            <p className="mt-1 truncate text-sm font-semibold capitalize">
                                                {enrollmentStatus ||
                                                    "Not available"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="rounded-[28px] border border-border bg-surface p-5 shadow-sm">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <ShieldCheck className="h-4 w-4" />
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold">
                                            Account information
                                        </h3>

                                        <p className="mt-1 text-sm leading-5 text-muted">
                                            Your email and student role
                                            are controlled by your TDA
                                            account. Personal details
                                            can be updated from the
                                            profile form.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 rounded-2xl bg-surface-secondary p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-medium text-muted">
                                            Member since
                                        </span>

                                        <span className="text-right text-xs font-semibold">
                                            {formatDate(
                                                profile?.created_at
                                            )}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between gap-3">
                                        <span className="text-xs font-medium text-muted">
                                            Role
                                        </span>

                                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold capitalize text-primary">
                                            {profile?.role ||
                                                "student"}
                                        </span>
                                    </div>
                                </div>
                            </section>
                        </motion.aside>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
