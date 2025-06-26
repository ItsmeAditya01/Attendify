import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import dayjs from "dayjs";

export default function AttendanceForm() {
  const [filters, setFilters] = useState({ class: "", semester: "", course: "" });
  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [timeSlot, setTimeSlot] = useState("");

  useEffect(() => {
    if (filters.class && filters.semester && filters.course) {
      fetchStudents();
    }
  }, [filters]);

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("student")
      .select("id, name, enrollment_number")
      .eq("class", filters.class)
      .eq("semester", filters.semester)
      .eq("course", filters.course);

    if (!error) setStudents(data);
  };

  const toggleAttendance = (id: string) => {
    setPresent((prev) => {
      const updated = new Set(prev);
      updated.has(id) ? updated.delete(id) : updated.add(id);
      return updated;
    });
  };

  const handleSubmit = async () => {
    const date = dayjs().format("YYYY-MM-DD");
    const promises = students.map((s) =>
      supabase.from("attendance").insert({
        student_id: s.id,
        subject,
        class: filters.class,
        date,
        time_slot: timeSlot,
        present: present.has(s.id),
      })
    );
    await Promise.all(promises);
    alert("Attendance marked successfully.");
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <input onChange={(e) => setFilters({ ...filters, class: e.target.value })} placeholder="Class" />
        <input onChange={(e) => setFilters({ ...filters, semester: e.target.value })} placeholder="Semester" />
        <input onChange={(e) => setFilters({ ...filters, course: e.target.value })} placeholder="Course" />
      </div>

      {/* Students */}
      <div className="border p-2">
        {students.map((s) => (
          <div key={s.id}>
            <input type="checkbox" checked={present.has(s.id)} onChange={() => toggleAttendance(s.id)} />
            {s.name} ({s.enrollment_number})
          </div>
        ))}
      </div>

      {/* Subject, Time Slot */}
      <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
      <input value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} placeholder="Time Slot (e.g. 9-10)" />

      <button onClick={handleSubmit} className="bg-blue-500 px-4 py-2 text-white">Mark Attendance</button>
    </div>
  );
}
