"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { supabase } from "@/lib/supabase";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState(
    "Please wait while we confirm your email address."
  );

  useEffect(() => {
    let mounted = true;

    const finishVerification = () => {
      if (!mounted) return;

      setStatus("success");
      setMessage("Your email has been verified successfully.");

      setTimeout(() => {
        if (mounted) {
          router.replace("/login");
        }
      }, 1800);
    };

    const handleCallback = async () => {
      try {
        const error = searchParams.get("error");
        const errorCode = searchParams.get("error_code");
        const errorDescription = searchParams.get("error_description");

        const tokenHash = searchParams.get("token_hash");
        const type = searchParams.get("type");
        const code = searchParams.get("code");

        /*
         * Handle Supabase errors returned in the query string.
         */
        if (error || errorCode) {
          console.error("Supabase callback error:", {
            error,
            errorCode,
            errorDescription,
          });

          /*
           * If Supabase reports an expired OTP, check whether
           * the user has already been verified before showing
           * an error.
           */
          if (
            errorCode === "otp_expired" ||
            error === "access_denied"
          ) {
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (user?.email_confirmed_at) {
              finishVerification();
              return;
            }
          }

          if (!mounted) return;

          setStatus("error");

          setMessage(
            errorDescription
              ? decodeURIComponent(errorDescription.replace(/\+/g, " "))
              : "This verification link is invalid or has expired. Please request a new verification email."
          );

          return;
        }

        /*
         * Handle token-hash verification.
         *
         * This is used when Supabase sends:
         * ?token_hash=...&type=email
         */
        if (tokenHash && type) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
          });

          if (verifyError) {
            console.error("Token verification error:", verifyError);

            /*
             * The email may already have been confirmed
             * even if the token is no longer usable.
             */
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (user?.email_confirmed_at) {
              finishVerification();
              return;
            }

            if (!mounted) return;

            setStatus("error");
            setMessage(
              verifyError.message ||
                "We couldn't verify your email address."
            );

            return;
          }

          finishVerification();
          return;
        }

        /*
         * Handle Supabase PKCE authorization-code flow.
         *
         * This is used when the callback contains:
         * ?code=...
         */
        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error("Code exchange error:", exchangeError);

            /*
             * Check whether the account was nevertheless
             * already confirmed.
             */
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (user?.email_confirmed_at) {
              finishVerification();
              return;
            }

            if (!mounted) return;

            setStatus("error");
            setMessage(
              exchangeError.message ||
                "We couldn't complete your email verification."
            );

            return;
          }

          finishVerification();
          return;
        }

        /*
         * Handle the normal Supabase confirmation flow where
         * the browser/session may already contain the verified
         * user.
         */
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          if (session.user.email_confirmed_at) {
            finishVerification();
            return;
          }
        }

        /*
         * Final fallback: ask Supabase directly for the user.
         */
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user?.email_confirmed_at) {
          finishVerification();
          return;
        }

        if (!mounted) return;

        setStatus("error");
        setMessage(
          "This verification link is invalid, incomplete, or has expired. Please request a new verification email."
        );
      } catch (error) {
        console.error(
          "Unexpected authentication callback error:",
          error
        );

        /*
         * One final verification check before showing an error.
         */
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user?.email_confirmed_at) {
            finishVerification();
            return;
          }
        } catch (checkError) {
          console.error("Final verification check failed:", checkError);
        }

        if (!mounted) return;

        setStatus("error");
        setMessage(
          "Something went wrong while verifying your email. Please request a new verification email."
        );
      }
    };

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  return (
    <div className="text-center">
      {status === "verifying" && (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-purple-primary/15 bg-purple-light/15 dark:border-purple-light/15 dark:bg-purple-primary/20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-light/30 border-t-purple-bright" />
          </div>

          <p className="mt-7 text-sm font-medium text-purple-bright">
            Verifying
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            Confirming your email.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted">
            {message}
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-success/20 bg-success/10 text-2xl text-success">
            ✓
          </div>

          <p className="mt-7 text-sm font-medium text-success">Verified</p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            You're all set.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted">
            {message} Redirecting you to sign in...
          </p>
        </>
      )}

      {status === "error" && (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-danger/20 bg-danger/10 text-2xl text-danger">
            !
          </div>

          <p className="mt-7 text-sm font-medium text-danger">
            Verification failed
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
            We couldn't verify you.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted">
            {message}
          </p>

          <button
            type="button"
            onClick={() => router.replace("/verify-email")}
            className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Back to verification
          </button>
        </>
      )}
    </div>
  );
}

function CallbackLoading() {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-purple-primary/15 bg-purple-light/15 dark:border-purple-light/15 dark:bg-purple-primary/20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-light/30 border-t-purple-bright" />
      </div>

      <p className="mt-7 text-sm font-medium text-purple-bright">Verifying</p>

      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
        Please wait.
      </h1>

      <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted">
        Preparing your verification.
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <AuthLayout>
      <Suspense fallback={<CallbackLoading />}>
        <CallbackContent />
      </Suspense>
    </AuthLayout>
  );
}