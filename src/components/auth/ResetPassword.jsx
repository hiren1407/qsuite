import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleSession = async () => {
      try {
        // Check if we came from a reset password email link
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const errorParam = hashParams.get('error');

        console.log('Reset password hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type, errorParam });

        // Check for errors in the URL first
        if (errorParam) {
          setMessage('There was an error with the reset link: ' + hashParams.get('error_description'));
          return;
        }

        // If we have recovery tokens, set the session
        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('Setting session with recovery tokens');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (error) {
            console.error('Error setting session:', error);
            setMessage('Invalid or expired reset link. Please request a new one.');
          } else if (data.session) {
            console.log('Session established for password reset');
            // Clear the hash from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            setMessage('You can now set your new password.');
          } else {
            setMessage('Failed to establish session. Please try again.');
          }
        } else {
          // Check if we already have a session
          const { data, error } = await supabase.auth.getSession();
          if (error || !data.session) {
            setMessage("Reset link required. Please check your email for the reset link.");
          } else {
            setMessage('You can now set your new password.');
          }
        }
      } catch (error) {
        console.error('Error in handleSession:', error);
        setMessage('An unexpected error occurred. Please try again.');
      }
    };
    
    handleSession();
  }, []);

  const handleReset = async () => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return setMessage(error.message);
    setMessage("Password updated! Redirecting to login...");
    setTimeout(() => navigate("/"), 2000);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Set New Password</h1>
        <input
          type="password"
          className="input input-bordered w-full mb-4"
          placeholder="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button className="btn btn-primary w-full" onClick={handleReset}>
          Update Password
        </button>
        {message && <p className="text-sm text-center text-warning mt-3">{message}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;
