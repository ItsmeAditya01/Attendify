import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Trash2, Pencil } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function FacultyTimeTable() {
  const [form, setForm] = useState({
    id: "", // used for editing
    day: "",
    start_time: "",
    end_time: "",
    subject: "",
    semester: "",
    course: "",
    class: ""
  });
  const { toast } = useToast(); // make sure this is in your component
  const [lectureList, setLectureList] = useState<any[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [semesterOptions, setSemesterOptions] = useState<string[]>([]);
  const [courseOptions, setCourseOptions] = useState<string[]>([]);
  const [subjectOptions, setSubjectOptions] = useState<string[]>([]);
  const [authUID, setAuthUID] = useState<string>("");

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData?.user?.id;
      if (!uid) return;
      setAuthUID(uid);

      const { data: studentData } = await supabase
        .from("students")
        .select("class, semester, course");
      if (studentData) {
        setClassOptions([...new Set(studentData.map((s) => s.class))]);
        setSemesterOptions([
          ...new Set(studentData.map((s) => s.semester.toString()))
        ]);
        setCourseOptions([...new Set(studentData.map((s) => s.course))]);
      }

      const { data: subjectData } = await supabase.from("subjects").select("name");
      if (subjectData) setSubjectOptions(subjectData.map((s) => s.name));

      fetchLectures(uid);
    };

    init();
  }, []);

  const fetchLectures = async (faculty_id: string) => {
    const { data } = await supabase
      .from("timetable")
      .select("*")
      .eq("faculty_id", faculty_id)
      .order("day", { ascending: true })
      .order("start_time", { ascending: true });

    if (data) setLectureList(data);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    if (!authUID) return;

    const payload = {
      day: form.day,
      start_time: form.start_time,
      end_time: form.end_time,
      subject: form.subject,
      semester: form.semester,
      course: form.course,
      class: form.class,
      faculty_id: authUID
    };

    let result;
    if (form.id) {
      // Update
      result = await supabase.from("timetable").update(payload).eq("id", form.id);
    } else {
      // Insert
      result = await supabase.from("timetable").insert(payload);
    }

    if (!result.error) {
      alert(`✅ Lecture ${form.id ? "updated" : "scheduled"} successfully`);
      resetForm();
      fetchLectures(authUID);
    } else {
      alert("❌ Failed to save lecture");
      console.error(result.error);
    }
  
  };

  const resetForm = () => {
    setForm({
      id: "",
      day: "",
      start_time: "",
      end_time: "",
      subject: "",
      semester: "",
      course: "",
      class: ""
    });
  };

  const handleEdit = (lecture: any) => {
    setForm({
      id: lecture.id,
      day: lecture.day,
      start_time: lecture.start_time,
      end_time: lecture.end_time,
      subject: lecture.subject,
      semester: lecture.semester,
      course: lecture.course,
      class: lecture.class
    });
  };

  const handleDelete = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this lecture?");
    if (!confirmed) return;

    const { error } = await supabase.from("timetable").delete().eq("id", id);
    if (!error) {
      alert("🗑️ Lecture deleted.");
      fetchLectures(authUID);
    } else {
      alert("❌ Failed to delete.");
      console.error(error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">🗓️ Set Time Table</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select
          name="day"
          value={form.day}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="">Select Day</option>
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(
            (day) => (
              <option key={day} value={day}>
                {day}
              </option>
            )
          )}
        </select>

        <div className="flex gap-2">
          <input
            type="time"
            name="start_time"
            value={form.start_time}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
          <span className="text-sm self-center">to</span>
          <input
            type="time"
            name="end_time"
            value={form.end_time}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            required
          />
        </div>

        <select
          name="subject"
          value={form.subject}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="">Select Subject</option>
          {subjectOptions.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>

        <select
          name="semester"
          value={form.semester}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="">Select Semester</option>
          {semesterOptions.map((sem) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>

        <select
          name="course"
          value={form.course}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="">Select Course</option>
          {courseOptions.map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>

        <select
          name="class"
          value={form.class}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="">Select Class</option>
          {classOptions.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {form.id ? "Update Lecture" : "Save Lecture"}
      </button>

      {/* Lecture List */}
      {lectureList.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="text-lg font-semibold text-gray-700">📋 Your Scheduled Lectures</h3>
          {lectureList.map((lec) => (
            <div
              key={lec.id}
              className="border rounded p-3 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{lec.subject}</p>
                <p className="text-sm text-gray-600">
                  {lec.day} | {lec.start_time} - {lec.end_time} | {lec.class} | {lec.course} | Sem {lec.semester}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(lec)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(lec.id)}
                  className="text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
