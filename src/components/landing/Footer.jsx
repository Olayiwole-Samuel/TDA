import Image from "next/image";

export default function Footer() {
    return (
        <footer className="border-t border-border px-6 py-12">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0">
                            <Image
                                src="/images/logo.png"
                                alt="Discipleship Academy"
                                fill
                                className="object-contain"
                                sizes="40px"
                            />
                        </div>
                        <div className="flex flex-col items-center leading-none">
                        <span className="text-2xl font-extrabold tracking-[-0.04em]">
                            TDA
                        </span>

                        

                        <span className="max-w-[96px] text-center text-[7px] font-medium leading-[1.05] text-muted">
                            Triumphant Discipleship Academy
                        </span>
                    </div>
                    
                    </div>

                    <p className="text-sm text-muted">
                        A journey of knowledge, growth and purpose.
                    </p>
                </div>

                <div className="text-sm text-muted">
                    © {new Date().getFullYear()} Discipleship Academy. All rights reserved.
                </div>
            </div>
        </footer>
    );
}