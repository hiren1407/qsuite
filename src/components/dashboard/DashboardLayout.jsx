import Header from "../Header";
import AiChat from "../ai/AiChat";
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";

const DashboardLayout = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleTestCaseGenerated = () => {
    // Refresh categories when new test cases are generated
    fetchCategories();
  };

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <Header />
      <main className="flex-grow p-6">
        <Outlet />
      </main>
      <AiChat 
        categories={categories}
        onTestCaseGenerated={handleTestCaseGenerated}
      />
    </div>
  );
};

export default DashboardLayout;
