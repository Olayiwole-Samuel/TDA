export default function LearningModes() {
    return (
        <section className="px-6 py-28 sm:py-36">
            <div className="mx-auto max-w-6xl">
                <div className="grid overflow-hidden rounded-[32px] border border-border md:grid-cols-2">
                    <div className="bg-primary p-8 text-primary-foreground sm:p-12 lg:p-16">
                        <p className="text-sm font-medium uppercase tracking-[0.18em] opacity-60">
                            Physical learning
                        </p>

                        <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
                            Learn together.
                            <br />
                            Grow together.
                        </h2>

                        <p className="mt-6 max-w-md text-sm leading-7 opacity-70">
                            Attend physical classes, participate in the classroom experience
                            and have your attendance and class performance recorded as part
                            of your academic journey.
                        </p>
                    </div>

                    <div className="bg-surface-secondary p-8 sm:p-12 lg:p-16">
                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
                            Online learning
                        </p>

                        <h2 className="mt-6 text-3xl font-semibold tracking-tight sm:text-4xl">
                            Learn from
                            <br />
                            wherever you are.
                        </h2>

                        <p className="mt-6 max-w-md text-sm leading-7 text-muted">
                            Watch recorded classes, study the available resources and
                            complete assessments directly through your student dashboard.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}