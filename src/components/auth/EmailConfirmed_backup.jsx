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

        // Get the full hash for debugging
        const fullHash = window.location.hash;
        console.log('Full hash:', fullHash);
        
        // Check if user came from email confirmation link
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        console.log('Hash params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type, errorParam, errorDescription });

        // Check for errors in the URL first
        if (errorParam) {
          console.log('Error in URL params:', errorParam, errorDescription);
          setError(errorDescription || 'Email confirmation failed. Please try again.');
          setLoading(false);
          return;
        }

        // Handle different types of auth links
        if (fullHash && type === 'recovery') {
          console.log('Recovery/reset password link detected, redirecting to reset password page');
          // This is a password reset link, redirect to reset password page
          setLoading(false);
          navigate('/reset-password', { replace: true });
          return;
        }

        // If we have confirmation-related hash parameters, verify email without auto-login
        if (fullHash && (accessToken || type === 'signup')) {
          console.log('Processing email verification');
          
          try {
            // Verify the email by exchanging the code for session (but we'll sign out immediately)
            if (accessToken && refreshToken) {
              console.log('Verifying email with tokens');
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              console.log('Email verification result:', { success: !!data.session, error });
              
              if (error) {
                setError('There was an error confirming your email: ' + error.message);
                setLoading(false);
                return;
              } 
              
              if (data.session && data.user) {
                console.log('Email verification successful, signing out to redirect to login');
                
                // Email is now verified, sign out the user and redirect to login
                await supabase.auth.signOut();
                
                setConfirmed(true);
                setLoading(false);
                
                // Clear the hash from URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Auto-redirect to login after 3 seconds
                setTimeout(() => {
                  navigate('/', { 
                    state: { 
                      message: 'Email verified successfully! Please log in with your credentials.' 
                    } 
                  });
                }, 3000);
              } else {
                setError('Email confirmation failed. Please try again.');
                setLoading(false);
              }
            } else {
              setError('Invalid confirmation link format.');
              setLoading(false);
            }
          } catch (sessionError) {
            console.error('Session error:', sessionError);
            setError('Failed to verify email: ' + sessionError.message);
            setLoading(false);
          }
        } else if (window.location.hash) {
          // There's a hash but it's not related to signup
          console.log('Non-signup hash detected');
          setError('Invalid confirmation link format.');
          setLoading(false);
        } else {
          // No hash parameters found
          console.log('No confirmation data found');
          setError('No confirmation data found. Please click the link from your email.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred: ' + err.message);
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
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              onClick={() => navigate('/', { 
                state: { 
                  message: 'Email verified successfully! Please log in with your credentials.' 
                } 
              })}
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
};

export default EmailConfirmed;