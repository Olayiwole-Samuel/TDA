export default function AcademyIntro() {
    return (
        <section id="academy" className="px-6 py-28 sm:py-36">
            <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
                <div>
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted">
                        The Academy
                    </p>

                    <h2 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                        More than classes.
                        <br />
                        A formation journey.
                    </h2>
                </div>

                <div className="space-y-6">
                    <p className="text-xl leading-8 text-foreground sm:text-2xl sm:leading-9">
                        Discipleship is not simply about learning more. It is about
                        becoming more intentional about who you are, what you believe, and
                        how you live.
                    </p>

                    <p className="max-w-2xl text-base leading-7 text-muted">
                        The Academy provides a structured environment where students move
                        through progressive levels of learning, engage with teaching,
                        complete assessments, and develop through both classroom and
                        personal growth.
                    </p>
                </div>
            </div>
        </section>
    );
}