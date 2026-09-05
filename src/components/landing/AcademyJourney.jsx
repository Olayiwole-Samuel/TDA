"use client";

import { motion } from "motion/react";

const levels = [
    {
        number: "100",
        title: "Foundation",
        description:
            "Build a strong foundation and develop the understanding needed for the journey ahead.",
    },
    {
        number: "200",
        title: "Formation",
        description:
            "Go deeper into your learning while developing stronger personal and spiritual maturity.",
    },
    {
        number: "300",
        title: "Development",
        description:
            "Strengthen your understanding, contribution, leadership and practical application.",
    },
    {
        number: "400",
        title: "Preparation",
        description:
            "Bring your learning together and prepare to step forward with greater clarity and purpose.",
    },
];

export default function AcademyJourney() {
    return (
        <section id="journey" className="bg-surface-secondary px-6 py-28 sm:py-36">
            <div className="mx-auto max-w-6xl">
                <div className="max-w-2xl">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
                        The journey
                    </p>

                    <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
                        Four levels.
                        <br />
                        One continuous journey.
                    </h2>

                    <p className="mt-6 text-base leading-7 text-muted sm:text-lg">
                        Each level builds upon the one before it, allowing students to
                        progress through the Academy with purpose.
                    </p>
                </div>

                <div className="mt-16 divide-y divide-border border-y border-border">
                    {levels.map((level, index) => (
                        <motion.div
                            key={level.number}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.5, delay: index * 0.08 }}
                            className="grid gap-6 py-9 md:grid-cols-[120px_220px_1fr] md:items-center"
                        >
                            <span className="text-sm font-medium text-muted">
                                LEVEL {level.number}
                            </span>

                            <h3 className="text-2xl font-semibold tracking-tight">
                                {level.title}
                            </h3>

                            <p className="max-w-xl text-sm leading-6 text-muted md:justify-self-end">
                                {level.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}