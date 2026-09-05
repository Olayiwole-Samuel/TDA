"use client";

import { motion } from "motion/react";

const variants = {
    primary: {
        background: "linear-gradient(135deg, #5500A6, #7F2AE8)",
        color: "#ffffff",
        boxShadow: "0 8px 24px rgba(85, 0, 166, 0.25)",
    },

    secondary: {
        background: "#ffffff",
        color: "#5500A6",
        border: "1px solid rgba(85, 0, 166, 0.15)",
    },

    purple: {
        background: "#D8B4FF",
        color: "#3A006C",
    },

    ghost: {
        background: "transparent",
        color: "var(--foreground)",
    },
};

export default function Button({
    children,
    variant = "primary",
    size = "md",
    className = "",
    ...props
}) {
    const sizes = {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-7 text-base",
    };

    return (
        <motion.button
            whileHover={{
                scale: 1.02,
                y: -1,
            }}
            whileTap={{
                scale: 0.98,
                y: 0,
            }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
            }}
            className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 ${sizes[size]} ${className}`}
            style={variants[variant]}
            {...props}
        >
            {children}
        </motion.button>
    );
}