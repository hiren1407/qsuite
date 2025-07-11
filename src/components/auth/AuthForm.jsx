// src/components/AuthForm.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { AtSymbolIcon, LockClosedIcon } from "@heroicons/react/24/outline";

const AuthForm = ({ type }) => {
  const [mode, setMode] = useState(type); // login | register | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

   useEffect(() => {
  if (window.location.hash.includes('access_token')) {
    // Remove hash from URL so this effect doesn't run again on remount
    history.replaceState(null, '', window.location.pathname);

    // Redirect to reset-password page
    navigate('/reset-password');
  }
}, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setMessage("Loading...");

    if (mode === "register") {
      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        return;
      }
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) return setMessage(error.message);
      setMessage("Registered successfully! Check your email to verify.");
    } else if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setMessage(error.message);
      navigate("/dashboard");
    }
  };

  const handleResetPassword = async () => {
    setMessage("Sending...");
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail);
    if (error) setMessage(error.message);
    else setMessage("Check your email for the reset link.");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (mode === "login" || mode === "register") handleAuth(e);
        }}
        className="card w-full max-w-md bg-base-100 shadow-xl px-8 py-6"
      >
        {/* Branding */}
        <h1 className="text-4xl font-bold text-primary text-center mb-6">
          QSuite
        </h1>

        {/* Titles */}
        {mode === "login" && (
          <>
            <h2 className="text-2xl text-center font-semibold mb-1">Welcome Back</h2>
            <p className="text-md text-center text-gray-500 mb-6">Login to your account</p>
          </>
        )}
        {mode === "register" && (
          <>
            <h2 className="text-2xl text-center font-semibold mb-1">Create an account</h2>
            <p className="text-md text-center text-gray-500 mb-6">Join QSuite today</p>
          </>
        )}
        {mode === "forgot" && (
          <>
            <h2 className="text-2xl text-center font-semibold mb-1">Reset Password</h2>
            <p className="text-md text-center text-gray-500 mb-6">Enter your email to receive a reset link</p>
          </>
        )}

        {/* Email */}
        <label className="label"><span className="label-text">Email</span></label>
        <div className="input input-bordered w-full flex items-center gap-2 mb-6">
          <AtSymbolIcon className="w-5 h-5 opacity-70" />
          <input
            type="email"
            placeholder="Email"
            className="grow"
            value={mode === "forgot" ? resetEmail : email}
            onChange={(e) =>
              mode === "forgot"
                ? setResetEmail(e.target.value)
                : setEmail(e.target.value)
            }
            required
          />
        </div>

        {/* Password */}
        {(mode === "login" || mode === "register") && (
          <>
            <label className="label"><span className="label-text">Password</span></label>
            <div className="input input-bordered w-full flex items-center gap-2 mb-6">
              <LockClosedIcon className="w-5 h-5 opacity-70" />
              <input
                type="password"
                placeholder="Password"
                className="grow"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {/* Confirm Password */}
        {mode === "register" && (
          <>
            <label className="label"><span className="label-text">Confirm Password</span></label>
            <div className="input input-bordered w-full flex items-center gap-2 mb-6">
              <LockClosedIcon className="w-5 h-5 opacity-70" />
              <input
                type="password"
                placeholder="Confirm Password"
                className="grow"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </>
        )}

        {/* Forgot password link (login only) */}
        {mode === "login" && (
          <div className="text-right text-sm mb-3">
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                setMode("forgot");
                setMessage("");
              }}
            >
              Forgot Password?
            </button>
          </div>
        )}

        {/* Buttons */}
        {mode === "forgot" ? (
          <>
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={handleResetPassword}
            >
              Send Reset Link
            </button>
            <button
              type="button"
              className="btn btn-outline w-full mt-3"
              onClick={() => {
                setMode("login");
                setResetEmail("");
                setMessage("");
              }}
            >
              Back to Login
            </button>
          </>
        ) : (
          <button type="submit" className="btn btn-primary w-full mt-2">
            {mode === "login" ? "Login" : "Register"}
          </button>
        )}

        {/* Message */}
        {message && (
          <p className="text-sm text-warning text-center mt-3">{message}</p>
        )}

        {/* Bottom Links */}
        {mode === "login" && (
          <div className="text-sm text-center mt-6">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-primary hover:underline"
              onClick={() => {
                setMode("register");
                setMessage("");
              }}
            >
              Sign up
            </Link>
          </div>
        )}
        {mode === "register" && (
          <div className="text-sm text-center mt-6">
            Already have an account?{" "}
            <Link
              to="/"
              className="text-primary hover:underline"
              onClick={() => {
                setMode("login");
                setMessage("");
              }}
            >
              Log in
            </Link>
          </div>
        )}
      </form>
    </div>
  );
};

export default AuthForm;
