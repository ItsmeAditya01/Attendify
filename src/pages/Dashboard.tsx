
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import FacultyAttendance from "./FacultyAttendance";
import FacultyTimeTable from "./FacultyTimeTable";
import StudentAttendance from "./StudentAttendance";
import StudentTimeTable from "./StudentTimeTable";
import Reports from "../pages/Reports";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/Sidebar";
import StudentOverview from "../components/overview/Studentoverview";
import FacultyOverview from "../components/overview/Facultyoverview";
import { UserManagement } from "@/components/UserManagement";
import { LogOut, Menu, Settings } from "lucide-react";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get("role") || "student";

  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!role) {
      navigate("/");
    }
  }, [role, navigate]);

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        role={role}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? "ml-64" : "ml-16"
        }`}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              // className="md:hidden"
              className=""
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 capitalize">
                {role} Dashboard
              </h1>
              <p className="text-sm text-gray-500">Welcome back to Attendify</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon">
              {/* <Settings className="h-5 w-5 text-gray-600" /> */}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 w-full">
          {activeSection === "overview" && (
            <>
              {role === "student" && <StudentOverview />}
              {role === "faculty" && <FacultyOverview />}
            </>
          )}

          {/* Student Tabs */}
          {role === "student" && activeSection === "student-attendance" && <StudentAttendance />}
          {role === "student" && activeSection === "student-timetable" && <StudentTimeTable />}

          {/* Faculty Tabs */}
          {role === "faculty" && activeSection === "faculty-attendance" && <FacultyAttendance />}
          {role === "faculty" && activeSection === "faculty-timetable" && <FacultyTimeTable />}

          {/* Admin Tabs */}
          {role === "admin" && activeSection === "users" && <UserManagement />}
          {role === "admin" && activeSection === "reports" && <Reports />}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
