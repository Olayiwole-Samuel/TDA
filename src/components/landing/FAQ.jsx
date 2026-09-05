"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const questions = [
    {
        question: "Who can join the Academy?",
        answer:
            "Anyone who wants to take part in the Academy can register during an open intake. The Academy is designed to support both physical and online students.",
    },
    {
        question: "Do I have to attend physical classes?",
        answer:
            "No. The Academy supports both physical and online learning. Online students can access recorded classes and complete their required assessments through the platform.",
    },
    {
        question: "How long does each level take?",
        answer:
            "Levels are structured around the topics and learning content rather than a fixed number of months. A level is completed when its required academic content has been completed and the level is formally concluded.",
    },
    {
        question: "What happens after I register?",
        answer:
            "After registration and email verification, you will receive access according to the current Academy intake. If registration for the current level has closed, you will be placed on the waiting list.",
    },
];

export default function FAQ() {
    const [active, setActive] = useState(null);

    return (
        <section id="faq" className="px-6 py-28 sm:py-36">
            <div className="mx-auto max-w-3xl">
                <div className="text-center">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
                        FAQ
                    </p>

                    <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                        Questions, answered.
                    </h2>
                </div>

                <div className="mt-14 border-t border-border">
                    {questions.map((item, index) => {
                        const isOpen = active === index;

                        return (
                            <div key={item.question} className="border-b border-border">
                                <button
                                    type="button"
                                    onClick={() => setActive(isOpen ? null : index)}
                                    className="flex w-full items-center justify-between gap-6 py-6 text-left"
                                >
                                    <span className="font-medium">{item.question}</span>

                                    <motion.span
                                        animate={{ rotate: isOpen ? 45 : 0 }}
                                        className="text-xl text-muted"
                                    >
                                        +
                                    </motion.span>
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="max-w-2xl pb-6 text-sm leading-7 text-muted">
                                                {item.answer}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}