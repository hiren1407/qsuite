import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient"; // adjust path if needed
import { 
  QueueListIcon, 
  PlayIcon, 
  FolderIcon, 
  Bars3Icon,
  UserIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";

const Header = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email);
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="navbar bg-white px-8 shadow-md border-b border-gray-200">
      <div className="flex-1 flex items-center space-x-6">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
            <QueueListIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-primary tracking-wide">QSuite</span>
        </div>

        {/* Navigation Section */}
        <div className="flex items-center space-x-1">
          <NavLink
            to="/dashboard/test-cases"
            className={({ isActive }) =>
              isActive 
                ? "btn btn-sm bg-blue-400 text-white border-none font-medium" 
                : "btn btn-sm btn-ghost text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium"
            }
          >
            <Bars3Icon className="w-4 h-4 mr-1 opacity-70" />
            <span className="text-sm">Test Cases</span>
          </NavLink>
          
          <NavLink
            to="/dashboard/run-view"
            className={({ isActive }) =>
              isActive 
                ? "btn btn-sm bg-blue-400 text-white border-none font-medium" 
                : "btn btn-sm btn-ghost text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium"
            }
          >
            <PlayIcon className="w-4 h-4 mr-1 opacity-70" />
            <span className="text-sm">Run & View</span>
          </NavLink>
          
          <NavLink
            to="/dashboard/files"
            className={({ isActive }) =>
              isActive 
                ? "btn btn-sm bg-blue-400 text-white border-none font-medium" 
                : "btn btn-sm btn-ghost text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium"
            }
          >
            <FolderIcon className="w-4 h-4 mr-1 opacity-70" />
            <span className="text-sm">Files</span>
          </NavLink>
          
          <NavLink
            to="/dashboard/queue"
            className={({ isActive }) =>
              isActive 
                ? "btn btn-sm bg-blue-400 text-white border-none font-medium" 
                : "btn btn-sm btn-ghost text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium"
            }
          >
            <QueueListIcon className="w-4 h-4 mr-1 opacity-70" />
            <span className="text-sm">Queue</span>
          </NavLink>
        </div>
      </div>
      
      {/* User Email Dropdown - Right Side */}
      <div className="flex items-center">
        <div className="dropdown dropdown-end">
          <div 
            tabIndex={0} 
            role="button" 
            className="btn btn-sm bg-gray-100 hover:bg-blue-50 border border-gray-300 text-gray-600 hover:text-blue-600 font-medium"
          >
            <UserIcon className="w-4 h-4 mr-1 opacity-70" />
            <span className="text-sm">{userEmail || "Loading..."}</span>
            <ChevronDownIcon className="w-3 h-3 ml-1 opacity-60" />
          </div>
          <ul 
            tabIndex={0} 
            className="dropdown-content menu bg-white rounded-lg shadow-lg border border-gray-200 w-52 p-2 mt-2"
          >
            <li>
              <button 
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2 opacity-70" />
                <span className="text-sm">Logout</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;
