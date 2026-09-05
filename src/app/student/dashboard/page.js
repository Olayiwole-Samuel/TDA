"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StudentDashboard() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loadUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            setUser(user);
        };

        loadUser();
    }, []);

    return (
        <main className="min-h-screen bg-background px-5 py-10 sm:px-8">
            <div className="mx-auto max-w-6xl">
                <p className="text-sm font-medium text-purple-bright">
                    Student Portal
                </p>

                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em]">
                    Welcome back.
                </h1>

                <p className="mt-3 text-muted">
                    {user?.email || "Loading your account..."}
                </p>
            </div>  
        </main>
    );
}