export default function Assessment() {
    return (
        <section className="bg-surface-secondary px-6 py-28 sm:py-36">
            <div className="mx-auto max-w-6xl">
                <div className="grid gap-12 md:grid-cols-2 md:items-center">
                    <div>
                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
                            Assessment
                        </p>

                        <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                            Learning that
                            <br />
                            can be measured.
                        </h2>

                        <p className="mt-6 max-w-xl text-base leading-7 text-muted">
                            Your progress is more than simply completing a video. The
                            Academy combines assessments, class participation, attendance
                            where applicable and examinations to build a clearer picture of
                            your development.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {[
                            ["Class assessments", "Complete tests after learning sessions."],
                            ["Performance", "Track your engagement and participation."],
                            ["Examinations", "Complete scheduled level examinations."],
                            ["Progress", "Build a complete academic record over time."],
                        ].map(([title, text]) => (
                            <div
                                key={title}
                                className="border-b border-border py-5 first:border-t"
                            >
                                <div className="flex items-center justify-between gap-6">
                                    <h3 className="font-medium">{title}</h3>
                                    <span className="text-muted">↗</span>
                                </div>

                                <p className="mt-2 text-sm text-muted">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}