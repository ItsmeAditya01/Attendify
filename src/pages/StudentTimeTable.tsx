import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";

export default function StudentTimeTable() {
  const [timetable, setTimetable] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState({ class: "", course: "", semester: "" });

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  useEffect(() => {
    const fetchTimeTable = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();

      const { data: studentData } = await supabase
        .from("students")
        .select("class, course, semester")
        .eq("user_id", user.id)
        .single();

      if (!studentData) return;

      setStudentInfo(studentData);

      const { data: lectures } = await supabase
        .from("timetable")
        .select("*")
        .eq("class", studentData.class)
        .eq("course", studentData.course)
        .eq("semester", studentData.semester)
        .order("start_time", { ascending: true }); // ✅ sort by start_time

      setTimetable(lectures || []);
    };

    fetchTimeTable();
  }, []);

  // Get unique time slots based on start_time
  const timeSlots = Array.from(
    new Set(
      timetable.map((t) => `${t.start_time}-${t.end_time}`)
    )
  ).sort((a, b) => {
    const aStart = a.split("-")[0];
    const bStart = b.split("-")[0];
    return aStart.localeCompare(bStart);
  });

  return (
    // <div className="p-4 overflow-x-auto w-full">
    //   <h2 className="text-xl font-bold mb-4">📅 Class Timetable</h2>
    //   <table className="w-full border text-left text-sm">
  <div className="w-full overflow-x-auto rounded-md border bg-white">
  <h2 className="text-xl font-bold mb-4">📅 Class Timetable</h2>
  <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border px-2 py-1">Time</th>
            {days.map((day) => (
              <th key={day} className="border px-2 py-1">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map((slot) => {
            const [start, end] = slot.split("-");
            return (
              <tr key={slot}>
                <td className="border px-2 py-1">
                  {dayjs(`1970-01-01T${start}`).format("h:mm A")} - {dayjs(`1970-01-01T${end}`).format("h:mm A")}
                </td>
                {days.map((day) => {
                  const lecture = timetable.find(
                    (t) =>
                      t.day === day &&
                      `${t.start_time}-${t.end_time}` === slot
                  );
                  return (
                    <td key={day} className="border px-2 py-1">
                      {lecture ? lecture.subject : "-"}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
