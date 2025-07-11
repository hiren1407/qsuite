import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabaseClient";

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setMessage("Session invalid or expired. Please try again.");
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
