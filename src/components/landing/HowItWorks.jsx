"use client";

import { motion } from "motion/react";

const steps = [
    {
        number: "01",
        title: "Register",
        text: "Create your account and join the current Academy intake.",
    },
    {
        number: "02",
        title: "Learn",
        text: "Attend physical classes or learn online through recorded sessions.",
    },
    {
        number: "03",
        title: "Engage",
        text: "Complete class activities, assessments and required learning.",
    },
    {
        number: "04",
        title: "Progress",
        text: "Track your performance as you move through each level.",
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="px-6 py-28 sm:py-36">
            <div className="mx-auto max-w-6xl">
                <div className="text-center">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
                        How it works
                    </p>

                    <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em] sm:text-6xl">
                        Simple enough to follow.
                        <br />
                        Meaningful enough to matter.
                    </h2>
                </div>

                <div className="mt-16 grid gap-px overflow-hidden rounded-[28px] border border-border bg-border md:grid-cols-4">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.number}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.45, delay: index * 0.08 }}
                            className="bg-surface p-7 sm:p-8"
                        >
                            <span className="text-sm font-medium text-muted">
                                {step.number}
                            </span>

                            <h3 className="mt-16 text-xl font-semibold">{step.title}</h3>

                            <p className="mt-3 text-sm leading-6 text-muted">
                                {step.text}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}