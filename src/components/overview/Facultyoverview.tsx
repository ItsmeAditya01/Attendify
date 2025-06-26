// import { useEffect, useState } from "react";
// import { supabase } from "@/lib/supabase";
// import { useAuth } from "@/contexts/AuthContext";
// import {
//   Card, CardHeader, CardTitle, CardDescription, CardContent,
// } from "@/components/ui/card";
// import {
//   Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
// } from "@/components/ui/table";
// import { Input } from "@/components/ui/input";
// import {
//   Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
// } from "@/components/ui/select";

// interface Student {
//   id: string;
//   user_id: string;
//   name: string;
//   enrollment_number: string;
//   course: string;
//   class: string;
//   semester: number;
//   attendancePercent?: number;
// }

// interface Lecture {
//   id: number;
//   day: string;
//   start_time: string;
//   end_time: string;
//   subject: string;
//   semester: string;
//   course: string;
//   class: string;
// }

// export default function FacultyOverview() {
//   const { user } = useAuth();
//   const [facultyInfo, setFacultyInfo] = useState<any>(null);
//   const [lectures, setLectures] = useState<Lecture[]>([]);

//   const [students, setStudents] = useState<Student[]>([]);
//   const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterSemester, setFilterSemester] = useState("all");
//   const [filterCourse, setFilterCourse] = useState("all");
//   const [filterClass, setFilterClass] = useState("all");

//   const [showClasses, setShowClasses] = useState(false);
//   const [showStudents, setShowStudents] = useState(false);

//   // Fetch faculty info
//   useEffect(() => {
//     if (!user?.id) return;
//     const fetchFaculty = async () => {
//       const { data } = await supabase
//         .from("faculty")
//         .select("*")
//         .eq("user_id", user.id)
//         .single();
//       if (data) setFacultyInfo(data);
//     };
//     fetchFaculty();
//   }, [user]);

//   // Fetch timetable lectures scheduled by this faculty
//   useEffect(() => {
//     if (!facultyInfo?.user_id) return;
//     const fetchLectures = async () => {
//       const { data } = await supabase
//         .from("timetable")
//         .select("*")
//         .eq("faculty_id", facultyInfo.user_id);
//       if (data) setLectures(data);
//     };
//     fetchLectures();
//   }, [facultyInfo]);

//   // Fetch students and attendance
//   useEffect(() => {
//     const fetchStudents = async () => {
//   // 1. Fetch all students
//   const { data: studentList, error: studentError } = await supabase
//     .from("students")
//     .select("id, user_id, name, enrollment_number, class, course, semester");

//   if (studentError || !studentList) {
//     console.error("❌ Failed to fetch students:", studentError?.message);
//     return;
//   }

//   console.log("✅ Students fetched:", studentList.length);

//   // 2. Fetch all attendance records
//   const { data: attendanceRecords, error: attendanceError } = await supabase
//     .from("attendance")
//     .select("present_students_id, class, course, semester");

//   if (attendanceError || !attendanceRecords) {
//     console.error("❌ Failed to fetch attendance records:", attendanceError?.message);
//     return;
//   }

//   console.log("✅ Attendance records fetched:", attendanceRecords.length);

//   // 3. Compute dynamic attendance per student
//   const studentsWithAttendance = studentList.map((student) => {
//     // Filter lectures for the student’s class, course, semester
//     const relevantLectures = attendanceRecords.filter(
//       (a) =>
//         a.class === student.class &&
//         a.course === student.course &&
//         a.semester === student.semester &&
//         Array.isArray(a.present_students_id)
//     );

//     if (relevantLectures.length === 0) {
//       console.warn(`⚠️ No attendance records found for ${student.name} (${student.enrollment_number})`);
//     }

//     const totalLectures = relevantLectures.length;

//     const attendedLectures = relevantLectures.filter((a) =>
//       a.present_students_id.includes(student.id)
//     ).length;

//     const attendancePercent =
//       totalLectures > 0 ? Math.round((attendedLectures / totalLectures) * 100) : 0;

//     return {
//       ...student,
//       attendancePercent,
//     };
//   });

//   setStudents(studentsWithAttendance);
// };


//     fetchStudents();
//   }, []);

//   // Filters
//   useEffect(() => {
//     // let result = [...students];
//     // if (filterSemester !== "all") result = result.filter(s => String(s.semester) === filterSemester);
//     // if (filterCourse !== "all") result = result.filter(s => s.course === filterCourse);
//     // if (filterClass !== "all") result = result.filter(s => s.class === filterClass);
//     // if (searchTerm)
//     //   result = result.filter(s =>
//     //     s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     //     s.enrollment_number.toLowerCase().includes(searchTerm.toLowerCase())
//     //   );
//     // setFilteredStudents(result);
//     const applyStudentFilters = () => {
//   if (!searchTerm.trim()) {
//     setFilteredStudents(students);
//     return;
//   }

//   const lower = searchTerm.toLowerCase();
//   const result = students.filter((s) =>
//     s.name.toLowerCase().includes(lower) ||
//     s.enrollment_number.toLowerCase().includes(lower) ||
//     s.class.toLowerCase().includes(lower) ||
//     s.course.toLowerCase().includes(lower) ||
//     String(s.semester).includes(lower)
//   );

//   setFilteredStudents(result);
// };

//   }, 
//   // [students, searchTerm, filterSemester, filterCourse, filterClass]
// );

//   // const getUnique = (key: keyof Student) => [...new Set(students.map(s => s[key]))];

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//       {/* Faculty Profile */}
//       <Card>
//         <CardHeader>
//           <CardTitle>👤 Profile</CardTitle>
//         </CardHeader>
//         <CardContent className="text-sm space-y-1">
//           <p><strong>Name:</strong> {facultyInfo?.name}</p>
//           <p><strong>Faculty ID:</strong> {facultyInfo?.faculty_id}</p>
//         </CardContent>
//       </Card>

//       {/* My Classes */}
//       <Card onClick={() => setShowClasses(!showClasses)} className="cursor-pointer md:col-span-2">
//         <CardHeader>
//           <CardTitle>📚 My Classes</CardTitle>
//           <CardDescription>Click to {showClasses ? "hide" : "view"} your lectures</CardDescription>
//         </CardHeader>
//         {showClasses && (
//           <CardContent>
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Day</TableHead>
//                   <TableHead>Time</TableHead>
//                   <TableHead>Subject</TableHead>
//                   <TableHead>Semester</TableHead>
//                   <TableHead>Course</TableHead>
//                   <TableHead>Class</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {lectures.map((lec) => (
//                   <TableRow key={lec.id}>
//                     <TableCell>{lec.day}</TableCell>
//                     <TableCell>{lec.start_time?.slice(0, 5)} - {lec.end_time?.slice(0, 5)}</TableCell>
//                     <TableCell>{lec.subject}</TableCell>
//                     <TableCell>{lec.semester}</TableCell>
//                     <TableCell>{lec.course}</TableCell>
//                     <TableCell>{lec.class}</TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </CardContent>
//         )}
//       </Card>

//       {/* Students Card */}
//       <Card className="md:col-span-3">
//         <CardHeader onClick={() => setShowStudents(!showStudents)} className="cursor-pointer">
//           <CardTitle>🧑‍🎓 Students</CardTitle>
//           <CardDescription>Click to {showStudents ? "hide" : "view"} student list with attendance</CardDescription>
//         </CardHeader>
//         {showStudents && (
//           <CardContent className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
//               <Input
//   placeholder="Search by name, enrollment, class, semester, course"
//   value={searchTerm}
//   onChange={(e) => setSearchTerm(e.target.value)}
//   className="mb-4"
// />

//             </div>

//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Name</TableHead>
//                   <TableHead>Enrollment</TableHead>
//                   <TableHead>Attendance %</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredStudents.map((s) => (
//                   <TableRow key={s.id}>
//                     <TableCell>{s.name}</TableCell>
//                     <TableCell>{s.enrollment_number}</TableCell>
//                     <TableCell>{s.attendancePercent !== undefined ? `${s.attendancePercent}%` : "N/A"}
// </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </CardContent>
//         )}
//       </Card>
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";

interface Student {
  id: string;
  user_id: string;
  name: string;
  enrollment_number: string;
  course: string;
  class: string;
  semester: number;
  attendancePercent?: number;
}

interface Lecture {
  id: number;
  day: string;
  start_time: string;
  end_time: string;
  subject: string;
  semester: string;
  course: string;
  class: string;
}

export default function FacultyOverview() {
  const { user } = useAuth();
  const [facultyInfo, setFacultyInfo] = useState<any>(null);

  const [showClasses, setShowClasses] = useState(false);
  const [showStudents, setShowStudents] = useState(false);

  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (user) fetchFacultyInfo();
  }, [user]);

  useEffect(() => {
    if (facultyInfo) fetchLectures();
  }, [facultyInfo]);

  useEffect(() => {
    fetchStudentsWithAttendance();
  }, []);

  useEffect(() => {
    applySearchFilter();
  }, [students, searchTerm]);

  const fetchFacultyInfo = async () => {
    const { data, error } = await supabase
      .from("faculty")
      .select("id, name, faculty_id, user_id")
      .eq("user_id", user?.id)
      .single();

    if (!error && data) setFacultyInfo(data);
  };

  const fetchLectures = async () => {
    const { data } = await supabase
      .from("timetable")
      .select("*")
      .eq("faculty_id", facultyInfo.user_id);

    if (data) setLectures(data);
  };

  const fetchStudentsWithAttendance = async () => {
    const { data: studentList } = await supabase
      .from("students")
      .select("id, user_id, name, enrollment_number, class, course, semester");

    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("present_students_id");

    if (!studentList || !attendanceData) return;

    const studentsWithPercent = studentList.map((student) => {
      const totalLectures = attendanceData.length;
      const attendedLectures = attendanceData.filter((record) =>
        record.present_students_id?.includes(student.id)
      ).length;

      const attendancePercent =
        totalLectures > 0 ? Math.round((attendedLectures / totalLectures) * 100) : 0;

      return { ...student, attendancePercent };
    });

    console.log("✅ Students fetched:", studentsWithPercent.length);
    setStudents(studentsWithPercent);
  };

  const applySearchFilter = () => {
    if (!searchTerm.trim()) {
      setFilteredStudents(students);
      return;
    }

    const query = searchTerm.toLowerCase();
    const results = students.filter((s) =>
      s.name.toLowerCase().includes(query) ||
      s.enrollment_number.toLowerCase().includes(query) 
      // s.class.toLowerCase().includes(query) ||
      // s.course.toLowerCase().includes(query) 
      // String(s.semester).includes(query)
    );

    setFilteredStudents(results);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p><strong>Name:</strong> {facultyInfo?.name}</p>
          <p><strong>Faculty ID:</strong> {facultyInfo?.faculty_id}</p>
        </CardContent>
      </Card>

      {/* My Classes Card */}
      <Card onClick={() => setShowClasses(!showClasses)} className="cursor-pointer md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">My Classes</CardTitle>
          <CardDescription>
            Click to {showClasses ? "hide" : "view"} your scheduled lectures
          </CardDescription>
        </CardHeader>
        {showClasses && (
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Day</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Semester</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Class</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lectures.map((lec) => (
                  <TableRow key={lec.id}>
                    <TableCell>{lec.day}</TableCell>
                    <TableCell>{lec.start_time?.slice(0, 5)} - {lec.end_time?.slice(0, 5)}</TableCell>
                    <TableCell>{lec.subject}</TableCell>
                    <TableCell>{lec.semester}</TableCell>
                    <TableCell>{lec.course}</TableCell>
                    <TableCell>{lec.class}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>

      {/* Students Card */}
      <Card className="md:col-span-3">
        <CardHeader className="cursor-pointer" onClick={() => setShowStudents(!showStudents)}>
          <CardTitle className="text-lg">Students</CardTitle>
          <CardDescription>
            Click to {showStudents ? "hide" : "view"} student list
          </CardDescription>
        </CardHeader>

        {showStudents && (
          <CardContent className="space-y-4">
            <Input
              placeholder="Search by name or enrollment number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-1/2"
            />

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Enrollment</TableHead>
                  <TableHead>Attendance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.name}</TableCell>
                    <TableCell>{s.enrollment_number}</TableCell>
                    <TableCell>{s.attendancePercent ?? "N/A"}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
