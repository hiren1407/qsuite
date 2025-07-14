import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { supabase } from "../../services/supabaseClient";

const EmailConfirmed = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const fullHash = window.location.hash;

        // Clear the hash from URL so Supabase doesn't auto-login
        window.history.replaceState({}, document.title, window.location.pathname);

        if (!fullHash) {
          setError("No confirmation data found. Please click the link from your email.");
          setLoading(false);
          return;
        }

        const hashParams = new URLSearchParams(fullHash.substring(1));
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        const type = hashParams.get("type");
        const errorParam = hashParams.get("error");
        const errorDescription = hashParams.get("error_description");

        if (errorParam) {
          setError(errorDescription || "Email confirmation failed. Please try again.");
          setLoading(false);
          return;
        }

        if (type === "recovery") {
          // Password reset link
          setLoading(false);
          navigate("/reset-password", { replace: true });
          return;
        }

        if (!accessToken || !refreshToken) {
          setError("Invalid confirmation link.");
          setLoading(false);
          return;
        }

        // Sign out first to clear any session/cookies
        await supabase.auth.signOut();

        // Temporarily set the session to verify email
        const { error: sessionError, data } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError("Failed to confirm email: " + sessionError.message);
          setLoading(false);
          return;
        }

        if (!data?.session || !data.session.user) {
          setError("Email confirmation failed. Please try again.");
          setLoading(false);
          return;
        }

        // Now sign out immediately to clear cookies/session
        await supabase.auth.signOut();

        setConfirmed(true);
        setLoading(false);

        // Auto redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/", {
            state: { message: "Email verified successfully! Please log in." },
          });
        }, 3000);
      } catch (err) {
        console.error("Unexpected error during email confirmation:", err);
        setError("An unexpected error occurred: " + (err?.message || err));
        setLoading(false);
      }
    };

    handleEmailConfirmation();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl p-6">
          <div className="text-center">
            <span className="loading loading-spinner loading-lg"></span>
            <p className="mt-4 text-gray-600">Confirming your email...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Confirmation Failed</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link to="/" className="btn btn-primary">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Verified!</h1>
            <p className="text-gray-600 mb-6">
              Your email has been successfully verified. You can now log in with your credentials.
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={() =>
                  navigate("/", {
                    state: { message: "Email verified successfully! Please log in." },
                  })
                }
                className="btn btn-primary"
              >
                Go to Login
              </button>
              <Link to="/" className="btn btn-outline">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default fallback
  return null;
};

export default EmailConfirmed;
