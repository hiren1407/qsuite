import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "./services/supabaseClient";
import AuthForm from "./components/auth/AuthForm";
import ResetPassword from "./components/auth/ResetPassword";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import Files from "./components/files/Files";
import TestCases from "./components/testcases/TestCases";
import RunView from "./components/runview/RunView";

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
        console.log('Auth state changed:', event);
        
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
        element={!session ? <AuthForm type="login" /> : <Navigate to="/dashboard" replace />}
      />
      <Route
        path="/register"
        element={!session ? <AuthForm type="register" /> : <Navigate to="/dashboard" replace />}
      />
      <Route path="/forgot-password" element={<AuthForm type="forgot" />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route
        path="/dashboard"
        element={session ? <DashboardLayout /> : <Navigate to="/" replace />}
      >
        <Route index element={<Navigate to="test-cases" replace />} />
        <Route path="test-cases" element={<TestCases />} />
        <Route path="run-view" element={<RunView />} />
        <Route path="files" element={<Files />} />
        <Route path="queue" element={<div>Queue Page</div>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
