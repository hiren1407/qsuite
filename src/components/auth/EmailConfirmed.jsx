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
    let authListener = null;
    
    const handleEmailConfirmation = async () => {
      try {
        // Set up auth listener to catch automatic confirmations
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          console.log('Auth state change in EmailConfirmed:', event, !!session);
          
          if (event === 'SIGNED_IN' && session && session.user) {
            console.log('User signed in during confirmation process');
            setConfirmed(true);
            setLoading(false);
            setError(null);
            
            // Clear the hash from URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // Auto-redirect after 3 seconds
            setTimeout(() => {
              navigate('/dashboard');
            }, 3000);
          }
        });
        
        authListener = subscription;

        // First, check if user already has a valid session (email already confirmed)
        const { data: initialSession, error: initialSessionError } = await supabase.auth.getSession();
        console.log('Initial session check:', { hasSession: !!initialSession.session, error: initialSessionError });
        
        if (initialSession.session && initialSession.session.user) {
          console.log('User already has valid session, email already confirmed');
          setConfirmed(true);
          setLoading(false);
          // Auto-redirect after 3 seconds
          setTimeout(() => {
            navigate('/dashboard/test-cases');
          }, 3000);
          return;
        }

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

        // If we have confirmation-related hash parameters, try to handle them
        if (fullHash && (accessToken || type === 'signup')) {
          console.log('Processing confirmation hash');
          
          try {
            // First, let's check the current session
            const { data: currentSession, error: sessionError } = await supabase.auth.getSession();
            console.log('Current session check:', { hasSession: !!currentSession.session, error: sessionError });
            
            // If we already have a valid session, the confirmation worked
            if (currentSession.session && currentSession.session.user) {
              console.log('Found existing valid session, confirmation successful');
              setConfirmed(true);
              // Clear the hash from URL
              window.history.replaceState({}, document.title, window.location.pathname);
              
              // Auto-redirect after 3 seconds
              setTimeout(() => {
                navigate('/dashboard');
              }, 3000);
              setLoading(false);
              return;
            }
            
            // If we have tokens, try to set the session
            if (accessToken && refreshToken) {
              console.log('Attempting to set session with tokens');
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
              });
              
              console.log('Session set result:', { data: !!data.session, error });
              
              if (error) {
                setError('There was an error confirming your email: ' + error.message);
              } else if (data.session && data.user) {
                console.log('Email confirmation successful via setSession');
                setConfirmed(true);
                // Clear the hash from URL
                window.history.replaceState({}, document.title, window.location.pathname);
                
                // Auto-redirect after 3 seconds
                setTimeout(() => {
                  navigate('/dashboard');
                }, 3000);
              } else {
                setError('Email confirmation failed. Please try again.');
              }
            } else {
              // Hash exists but no tokens, might be an older confirmation format
              console.log('Hash exists but no tokens found');
              
              // Wait a moment for potential auth state changes
              setTimeout(async () => {
                const { data: retrySession } = await supabase.auth.getSession();
                if (retrySession.session && retrySession.session.user) {
                  console.log('Session established after delay');
                  setConfirmed(true);
                  setLoading(false);
                  // Clear the hash from URL
                  window.history.replaceState({}, document.title, window.location.pathname);
                  
                  // Auto-redirect after 3 seconds
                  setTimeout(() => {
                    navigate('/dashboard');
                  }, 3000);
                } else {
                  setError('Email confirmation failed - no valid session established.');
                  setLoading(false);
                }
              }, 1000);
            }
          } catch (sessionError) {
            console.error('Session error:', sessionError);
            setError('Failed to establish session: ' + sessionError.message);
          }
        } else if (window.location.hash) {
          // There's a hash but it's not related to signup
          console.log('Non-signup hash detected');
          setError('Invalid confirmation link format.');
        } else {
          // No hash parameters found, but let's wait a moment to see if auth state changes
          console.log('No hash found, waiting for potential auth state changes...');
          
          // Give some time for potential automatic auth state changes
          setTimeout(async () => {
            const { data: retrySession } = await supabase.auth.getSession();
            if (retrySession.session && retrySession.session.user) {
              console.log('Session established after waiting');
              setConfirmed(true);
              setLoading(false);
              // Auto-redirect after 3 seconds
              setTimeout(() => {
                navigate('/dashboard');
              }, 3000);
            } else {
              // Check if user is already signed in but needs to refresh
              try {
                const { data: userData, error: userError } = await supabase.auth.getUser();
                if (userData.user && !userError) {
                  console.log('User found but no session, attempting refresh...');
                  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                  if (refreshData.session && !refreshError) {
                    setConfirmed(true);
                    setLoading(false);
                    setTimeout(() => {
                      navigate('/dashboard');
                    }, 3000);
                    return;
                  }
                }
              } catch (refreshErr) {
                console.log('Refresh attempt failed:', refreshErr);
              }
              
              setError('No confirmation data found. Please click the link from your email.');
              setLoading(false);
            }
          }, 2000); // Wait 2 seconds for auth state to settle
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred: ' + err.message);
      } finally {
        if (!confirmed) {
          setLoading(false);
        }
      }
    };

    handleEmailConfirmation();
    
    // Cleanup auth listener
    return () => {
      if (authListener) {
        authListener.unsubscribe();
      }
    };
  }, [navigate, confirmed]);

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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Confirmed!</h1>
          <p className="text-gray-600 mb-6">
            Your email has been successfully verified. You will be automatically redirected to your dashboard in a few seconds.
          </p>
          <div className="flex flex-col space-y-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary"
            >
              Go to Dashboard
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
