"use client";

import { motion } from "motion/react";
import Button from "@/components/ui/Button";

export default function Hero() {
    return (
        <section className="relative flex min-h-screen items-center overflow-hidden px-6 pb-20 pt-32">
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute left-1/2 top-1/4 h-80 w-80 -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
            </div>

            <div className="mx-auto w-full max-w-6xl">
                <div className="mx-auto max-w-4xl text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-muted shadow-sm">
                            A journey of growth, knowledge & purpose
                        </span>

                        <h1 className="mt-8 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl md:text-8xl">
                            Become who you were
                            <br />
                            <span className="text-muted">called to become.</span>
                        </h1>

                        <p className="mx-auto mt-7 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">
                            The Discipleship Academy is a structured learning journey
                            designed to develop your understanding, character, faith, and
                            purpose.
                        </p>

                        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                            <Button size="lg">Begin your journey</Button>

                            <Button variant="secondary" size="lg">
                                Discover the Academy
                            </Button>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="mx-auto mt-20 max-w-5xl"
                >
                    <div className="relative overflow-hidden rounded-[32px] border border-border bg-surface shadow-lg">
                        <div className="grid min-h-[280px] grid-cols-1 md:grid-cols-3">
                            <div className="flex flex-col justify-between border-b border-border p-7 md:border-b-0 md:border-r">
                                <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                                    Journey
                                </span>

                                <div>
                                    <p className="text-4xl font-semibold tracking-tight">
                                        100–400
                                    </p>
                                    <p className="mt-2 text-sm text-muted">
                                        Four levels of intentional growth.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col justify-between border-b border-border p-7 md:border-b-0 md:border-r">
                                <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                                    Learning
                                </span>

                                <div>
                                    <p className="text-4xl font-semibold tracking-tight">
                                        Learn
                                    </p>
                                    <p className="mt-2 text-sm text-muted">
                                        Classes, recordings, resources and assessments.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col justify-between p-7">
                                <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
                                    Experience
                                </span>

                                <div>
                                    <p className="text-4xl font-semibold tracking-tight">
                                        Grow
                                    </p>
                                    <p className="mt-2 text-sm text-muted">
                                        Track your progress throughout the journey.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}