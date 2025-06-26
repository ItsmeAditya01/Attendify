import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

export default function FacultyAttendance() {
  const [date, setDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [semester, setSemester] = useState("");
  const [course, setCourse] = useState("");
  const [className, setClassName] = useState("");
  const [lectures, setLectures] = useState<any[]>([]);
  const [selectedLecture, setSelectedLecture] = useState<any>(null);
  const [lectureError, setLectureError] = useState<string | null>(null);

  const [students, setStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, "present" | "absent">>({});

  const [semesters, setSemesters] = useState<string[]>([]);
  const [courses, setCourses] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  // Fetch dropdown options
  useEffect(() => {
    const fetchOptions = async () => {
      const { data } = await supabase.from("students").select("semester, course, class");
      if (data) {
        setSemesters([...new Set(data.map(s => s.semester.toString()))]);
        setCourses([...new Set(data.map(s => s.course))]);
        setClasses([...new Set(data.map(s => s.class))]);
      }
    };
    fetchOptions();
  }, []);

  // Fetch lectures when filters change
  // useEffect(() => {
  //   if (semester && course && className && date) {
  //     const fetchLectures = async () => {
  //       const day = dayjs(date).format("dddd"); // e.g., Monday
  //       const { data } = await supabase
  //         .from("timetable")
  //         .select("*")
  //         .eq("semester", semester)
  //         .eq("course", course)
  //         .eq("class", className)
  //         .eq("day", day);

  //       if (data) setLectures(data);
  //     };
  //     fetchLectures();
  //   }
  // }, [semester, course, className, date]); 
  useEffect(() => {
  if (semester && course && className && date) {
    const fetchLectures = async () => {
      const day = dayjs(date).format("dddd"); // e.g., Monday
      const { data, error } = await supabase
        .from("timetable")
        .select("*")
        .eq("semester", semester)
        .eq("course", course)
        .eq("class", className)
        .eq("day", day);

      if (error) {
        console.error("Lecture fetch error:", error.message);
        setLectures([]);
        setLectureError("❌ Failed to fetch lectures.");
        return;
      }

      if (!data || data.length === 0) {
        setLectures([]);
        setLectureError("⚠️ No lectures scheduled for this class on selected date.");
      } else {
        setLectures(data);
        setLectureError(null); // Clear old errors
      }
    };
    fetchLectures();
  }
}, [semester, course, className, date]);


  // Fetch students for the selected class
  useEffect(() => {
    if (semester && course && className) {
      const fetchStudents = async () => {
        const { data } = await supabase
          .from("students")
          .select("id, name, enrollment_number")
          .eq("semester", semester)
          .eq("course", course)
          .eq("class", className);

        if (data) setStudents(data);
      };
      fetchStudents();
    }
  }, [semester, course, className]);

  const toggleAttendance = (studentId: string, status: "present" | "absent") => {
    setAttendanceMap(prev => ({ ...prev, [studentId]: status }));
  };

  const markAttendance = async () => {
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();
    if (authError || !user || !selectedLecture) {
      alert("❌ Failed to get user or lecture info.");
      return;
    }

    const presentStudents = Object.entries(attendanceMap)
      .filter(([_, status]) => status === "present")
      .map(([id]) => id);

    const { error } = await supabase.from("attendance").insert({
      date,
      start_time: selectedLecture.start_time,
      end_time: selectedLecture.end_time,
      subject: selectedLecture.subject,
      class: className,
      course,
      semester,
      present_students_id: presentStudents,
      faculty_id: user.id
    });

    if (!error) {
      alert("✅ Attendance marked!");
      setAttendanceMap({});
      setSelectedLecture(null);
    } else {
      alert("❌ Failed to mark attendance.");
      console.error(error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">📝 Faculty Attendance</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <select value={semester} onChange={(e) => setSemester(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">Select Semester</option>
          {semesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
        </select>
        <select value={course} onChange={(e) => setCourse(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">Select Course</option>
          {courses.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={className} onChange={(e) => setClassName(e.target.value)} className="border px-2 py-1 rounded">
          <option value="">Select Class</option>
          {classes.map(cls => <option key={cls} value={cls}>{cls}</option>)}
        </select>
      </div>
{lectureError && (
  <p className="text-sm text-red-600 font-medium">{lectureError}</p>
)}

      {/* Show lectures */}
      {lectures.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-700">Select Lecture</h3>
          {/* {lectures.map(lec => (
            <button
              key={lec.id}
              onClick={() => setSelectedLecture(lec)}
              className={`p-2 border rounded w-full text-left ${
                selectedLecture?.id === lec.id ? "bg-blue-100 border-blue-600" : ""
              }`}
            >
              {lec.subject} ({lec.start_time} - {lec.end_time})
            </button>
          ))} */}
          {lectureError ? (
  <p className="text-sm text-red-600">{lectureError}</p>
) : (
  lectures.map(lec => (
    <button
      key={lec.id}
      onClick={() => setSelectedLecture(lec)}
      className={`p-2 border rounded w-full text-left ${
        selectedLecture?.id === lec.id ? "bg-blue-100 border-blue-600" : ""
      }`}
    >
      {lec.subject} ({lec.start_time} - {lec.end_time})
    </button>
  ))
)}

        </div>
      )}

      {/* Show students */}
      {!lectureError && selectedLecture && students.length > 0 && (
        <div className="mt-4 space-y-2 border p-3 rounded">
          <h3 className="font-semibold mb-2">Students in SEM-{semester} Class: {course}-{className}</h3>
          {students.map(s => (
            <div key={s.id} className="flex items-center justify-between border-b py-1">
              <span>{s.enrollment_number} - {s.name}</span>
              <div className="space-x-2">
                <button
                  onClick={() => toggleAttendance(s.id, "present")}
                  className={`px-3 py-1 rounded ${attendanceMap[s.id] === "present" ? "bg-green-600 text-white" : "bg-gray-200"}`}
                >
                  Present
                </button>
                <button
                  onClick={() => toggleAttendance(s.id, "absent")}
                  className={`px-3 py-1 rounded ${attendanceMap[s.id] === "absent" ? "bg-red-600 text-white" : "bg-gray-200"}`}
                >
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show submit button */}
      {!lectureError && selectedLecture && Object.keys(attendanceMap).length > 0 && (
        <button
          onClick={markAttendance}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Mark Attendance
        </button>
      )}
    </div>
  );
}
