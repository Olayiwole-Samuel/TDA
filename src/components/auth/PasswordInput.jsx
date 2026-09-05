"use client";

import { useState } from "react";

export default function PasswordInput({
    label,
    name,
    value,
    onChange,
    placeholder = "Enter your password",
    error,
}) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div>
            <label
                htmlFor={name}
                className="mb-2 block text-sm font-medium"
            >
                {label}
            </label>

            <div className="relative">
                <input
                    id={name}
                    name={name}
                    type={showPassword ? "text" : "password"}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete={
                        name === "password"
                            ? "new-password"
                            : "new-password"
                    }
                    className={`h-12 w-full rounded-2xl border bg-surface px-4 pr-12 text-sm outline-none transition-all placeholder:text-muted-light focus:border-purple-bright focus:ring-4 focus:ring-purple-bright/10 ${error ? "border-danger" : "border-border"}`}
                />

                <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                        showPassword
                            ? "Hide password"
                            : "Show password"
                    }
                    className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-sm text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
                >
                    {showPassword ? "Hide" : "Show"}
                </button>
            </div>

            {error && (
                <p className="mt-2 text-xs text-danger">
                    {error}
                </p>
            )}
        </div>
    );
}

