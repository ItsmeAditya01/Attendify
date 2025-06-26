// import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils";
// import {
//   LayoutDashboard,
//   ClipboardList,
//   Users,
//   BarChart3,
//   GraduationCap,
//   BookOpen
// } from "lucide-react";

// interface SidebarProps {
//   role: string;
//   activeSection: string;
//   onSectionChange: (section: string) => void;
//   isOpen: boolean;
//   onToggle: () => void;
// }

// export function Sidebar({ role, activeSection, onSectionChange, isOpen }: SidebarProps) {
//   const getMenuItems = () => {
//     const commonItems = [
//       { id: "overview", label: "Overview", icon: LayoutDashboard }
//     ];

//     const roleTabs: Record<string, { id: string; label: string; icon: any }[]> = {
//       student: [
//         { id: "student-timetable", label: "Time Table", icon: BookOpen },
//         { id: "student-attendance", label: "Attendance", icon: ClipboardList }
//       ],
//       faculty: [
//         { id: "faculty-timetable", label: "Time Table", icon: BookOpen },
//         { id: "faculty-attendance", label: "Attendance", icon: ClipboardList }
//       ],
//       admin: [
//         { id: "users", label: "User Management", icon: Users },
//         { id: "reports", label: "Reports", icon: BarChart3 }
//       ]
//     };

//     return [...commonItems, ...(roleTabs[role] || [])];
//   };

//   return (
//     <div
//       className={cn(
//         "fixed left-0 top-0 z-40 h-full bg-white border-r border-gray-200 transition-all duration-300",
//         isOpen ? "w-64" : "w-16"
//       )}
//     >
//       <div className="flex flex-col h-full">
//         {/* Header */}
//         <div className="p-4 border-b border-gray-200">
//           <div className="flex items-center space-x-3">
//             <div className="bg-blue-600 p-2 rounded-lg">
//               <GraduationCap className="h-6 w-6 text-white" />
//             </div>
//             {isOpen && (
//               <div>
//                 <h2 className="text-xl font-bold text-blue-900">Attendify</h2>
//                 <p className="text-xs text-gray-500 capitalize">{role} Portal</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 p-4 space-y-2">
//           {getMenuItems().map((item) => (
//             <Button
//               key={item.id}
//               variant={activeSection === item.id ? "default" : "ghost"}
//               className={cn(
//                 "w-full justify-start text-left",
//                 activeSection === item.id
//                   ? "bg-blue-600 text-white hover:bg-blue-700"
//                   : "text-gray-700 hover:bg-blue-50",
//                 !isOpen && "px-2"
//               )}
//               onClick={() => onSectionChange(item.id)}
//             >
//               <item.icon className={cn("h-5 w-5", isOpen ? "mr-3" : "mx-auto")} />
//               {isOpen && <span>{item.label}</span>}
//             </Button>
//           ))}
//         </nav>
//       </div>
//     </div>
//   );
// }
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  BarChart3,
  GraduationCap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  role: string;
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ role, activeSection, onSectionChange, isOpen, onToggle }: SidebarProps) {
  const getMenuItems = () => {
    const commonItems = [
      { id: "overview", label: "Overview", icon: LayoutDashboard }
    ];

    const roleTabs: Record<string, { id: string; label: string; icon: any }[]> = {
      student: [
        { id: "student-timetable", label: "Time Table", icon: BookOpen },
        { id: "student-attendance", label: "Attendance", icon: ClipboardList }
      ],
      faculty: [
        { id: "faculty-timetable", label: "Time Table", icon: BookOpen },
        { id: "faculty-attendance", label: "Attendance", icon: ClipboardList }
      ],
      admin: [
        { id: "users", label: "User Management", icon: Users },
        { id: "reports", label: "Reports", icon: BarChart3 }
      ]
    };

    // return [...commonItems, ...(roleTabs[role] || [])];
return [...(role !== "admin" ? commonItems : []), ...(roleTabs[role] || [])];
  };

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-40 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
        isOpen ? "w-64" : "w-16"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          {isOpen && (
            <div>
              <h2 className="text-xl font-bold text-blue-900">Attendify</h2>
              <p className="text-xs text-gray-500 capitalize">{role} Portal</p>
            </div>
          )}
        </div>
        {/* Toggle Button */}
        {/* <Button
          size="icon"
          variant="ghost"
          onClick={onToggle}
          className="ml-auto"
        >
          {isOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </Button> */}
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
        {getMenuItems().map((item) => (
          <Button
            key={item.id}
            variant={activeSection === item.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start text-left transition-colors duration-200",
              activeSection === item.id
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-gray-700 hover:bg-blue-50",
              !isOpen && "px-2"
            )}
            onClick={() => onSectionChange(item.id)}
          >
            <item.icon className={cn("h-5 w-5", isOpen ? "mr-3" : "mx-auto")} />
            {isOpen && <span>{item.label}</span>}
          </Button>
        ))}
      </nav>
    </div>
  );
}
