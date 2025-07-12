import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./services/supabaseClient";
import AuthForm from "./components/auth/AuthForm";
import ResetPassword from "./components/auth/ResetPassword";
import EmailConfirmed from "./components/auth/EmailConfirmed";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Files from "./components/files/Files";
import TestCases from "./components/testcases/TestCases";
import RunView from "./components/runview/RunView";
import Queue from "./components/queue/Queue";

const App = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let authSubscription = null;

    // Fetch initial session with async/await
    async function fetchSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error);
          if (isMounted) {
            setLoading(false);
          }
          return;
        }
        if (isMounted) {
          setSession(data.session);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in fetchSession:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    // Set up auth listener
    function setupAuthListener() {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
        console.log('Auth state changed:', event, 'Session:', !!newSession);
        
        // Check current location
        const currentPath = window.location.pathname;
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const type = hashParams.get('type');
        const errorParam = hashParams.get('error');
        
        console.log('Current path:', currentPath, 'Type:', type, 'Error:', errorParam);
        
        // Handle email confirmation
        if (event === 'SIGNED_IN' && newSession) {
          // If there's an error in the confirmation, don't update session
          if ((type === 'signup' || type === 'recovery') && errorParam) {
            console.log('Auth confirmation error detected, not updating session');
            return;
          }
          
          if (type === 'signup') {
            // This is email confirmation, let the route handle the redirect
            console.log('Email confirmation detected, updating session');
            if (isMounted) {
              setSession(newSession);
            }
            return;
          }
          
          if (type === 'recovery') {
            // This is password recovery, let the route handle the redirect
            console.log('Password recovery detected, updating session');
            if (isMounted) {
              setSession(newSession);
            }
            return;
          }
        }
        
        // Update state only if mounted
        if (isMounted) {
          setSession(newSession);
        }
      });
      
      authSubscription = subscription;
      return subscription;
    }

    // Initialize
    fetchSession();
    setupAuthListener();

    // Cleanup subscription and mounted flag
    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);


  if (loading) {
    return <div className="p-6 text-center">Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={(() => {
          // Check if this is a recovery/reset password link
          if (typeof window !== 'undefined') {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const type = hashParams.get('type');
            
            console.log('Root route - Hash params:', { hash: window.location.hash, type, session: !!session });
            
            if (type === 'recovery') {
              console.log('Root route - Redirecting to reset-password');
              return <Navigate to="/reset-password" replace />;
            }
            
            if (type === 'signup') {
              console.log('Root route - Redirecting to email-confirmed');
              return <Navigate to="/email-confirmed" replace />;
            }
          }
          
          // Default behavior
          console.log('Root route - Default behavior, session:', !!session);
          return !session ? <AuthForm type="login" /> : <Navigate to="/dashboard" replace />;
        })()}
      />
      <Route
        path="/register"
        element={(() => {
          // Check if this is a recovery/reset password link
          if (typeof window !== 'undefined') {
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const type = hashParams.get('type');
            
            if (type === 'recovery') {
              return <Navigate to="/reset-password" replace />;
            }
            
            if (type === 'signup') {
              return <Navigate to="/email-confirmed" replace />;
            }
          }
          
          // Default behavior
          return !session ? <AuthForm type="register" /> : <Navigate to="/dashboard" replace />;
        })()}
      />
      <Route path="/forgot-password" element={<AuthForm type="forgot" />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/email-confirmed" element={<EmailConfirmed />} />

      <Route
        path="/dashboard"
        element={session ? <DashboardLayout /> : <Navigate to="/" replace />}
      >
        <Route index element={<Navigate to="test-cases" replace />} />
        <Route path="test-cases" element={<TestCases />} />
        <Route path="run-view" element={<RunView />} />
        <Route path="files" element={<Files />} />
        <Route path="queue" element={<Queue />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
