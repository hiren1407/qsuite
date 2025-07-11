import Header from "../Header";
import { Outlet } from "react-router-dom";

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      <Header />
      <main className="flex-grow p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
