// src/components/AuthForm.jsx
import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { AtSymbolIcon, LockClosedIcon, QueueListIcon } from "@heroicons/react/24/outline";

const AuthForm = ({ type }) => {
  const [mode, setMode] = useState(type); // login | register | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error"); // "success" | "error"
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for success message from email confirmation
    if (location.state?.message) {
      setMessage(location.state.message);
      setMessageType("success");
      // Clear the state to prevent the message from showing again on refresh
      navigate(location.pathname, { replace: true });
    }
    
    if (window.location.hash.includes('access_token')) {
      // Remove hash from URL so this effect doesn't run again on remount
      history.replaceState(null, '', window.location.pathname);

      // Redirect to reset-password page
      navigate('/reset-password');
    }
  }, [navigate, location]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("error");

    if (mode === "register") {
      if (!name.trim()) {
        setMessage("Name is required.");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setMessage("Passwords do not match.");
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/email-confirmed`,
          data: {
            display_name: name.trim()
          }
        }
      });
      
      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }
      
      if (data?.user && !data.session) {
        setMessage("Registration successful! Please check your email and click the verification link to complete your registration.");
        setMessageType("success");
        setLoading(false);
      } else {
        setMessage("Registered successfully!");
        setMessageType("success");
        setLoading(false);
        // If auto-confirmed (email confirmation disabled), redirect
        if (data.session) {
          navigate("/dashboard");
        }
      }
    } else if (mode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Email not confirmed')) {
          setMessage("Please verify your email address before signing in. Check your inbox for the verification link.");
        } else {
          setMessage(error.message);
        }
        setLoading(false);
        return;
      }
      setLoading(false);
      navigate("/dashboard");
    }
  };

  const handleResetPassword = async () => {
    setLoading(true);
    setMessage("");
    setMessageType("error");
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) {
      setMessage(error.message);
      setMessageType("error");
    } else {
      setMessage("Check your email for the reset link.");
      setMessageType("success");
    }
    setLoading(false);
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
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <QueueListIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-blue-600 tracking-wide">QSuite</span>
        </div>

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

        {/* Name (register only) */}
        {mode === "register" && (
          <>
            <label className="label"><span className="label-text">Full Name</span></label>
            <div className="input input-bordered w-full flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="text"
                placeholder="Full Name"
                className="grow"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
                setMessageType("error");
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
            <button
              type="button"
              className="btn btn-outline w-full mt-3"
              onClick={() => {
                setMode("login");
                setResetEmail("");
                setMessage("");
                setMessageType("error");
              }}
            >
              Back to Login
            </button>
          </>
        ) : (
          <button 
            type="submit" 
            className="btn btn-primary w-full mt-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              mode === "login" ? "Login" : "Register"
            )}
          </button>
        )}

        {/* Message */}
        {message && (
          <p className={`text-sm text-center mt-3 ${messageType === "success" ? "text-success" : "text-warning"}`}>
            {message}
          </p>
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
                setMessageType("error");
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
                setMessageType("error");
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
