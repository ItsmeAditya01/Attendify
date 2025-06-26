import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function TimetableForm() {
  const [formData, setFormData] = useState({
    day: "",
    time: "",
    subject: "",
    semester: "",
    course: "",
    class: ""
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async () => {
    const user = await supabase.auth.getUser();
    const facultyId = user.data.user.id;

    const { error } = await supabase.from("timetable").insert({
      ...formData,
      faculty_id: facultyId,
    });

    if (!error) {
      alert("Timetable entry saved.");
      setFormData({ day: "", time: "", subject: "", semester: "", course: "", class: "" });
    } else {
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input name="day" value={formData.day} onChange={handleChange} placeholder="Day (e.g., Monday)" />
        <input name="time" value={formData.time} onChange={handleChange} placeholder="Time (e.g., 9-10)" />
        <input name="subject" value={formData.subject} onChange={handleChange} placeholder="Subject" />
        <input name="semester" value={formData.semester} onChange={handleChange} placeholder="Semester" />
        <input name="course" value={formData.course} onChange={handleChange} placeholder="Course" />
        <input name="class" value={formData.class} onChange={handleChange} placeholder="Class (A/B/C)" />
      </div>
      <button onClick={handleSubmit} className="bg-blue-500 px-4 py-2 text-white">Save</button>
    </div>
  );
}
