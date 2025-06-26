

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import dayjs from "dayjs";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Card } from "@/components/ui/card";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

export default function StudentAttendance() {
  const [currentAttendance, setCurrentAttendance] = useState(0);
  const [monthlyAttendance, setMonthlyAttendance] = useState<{ [month: string]: number }>({});
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const fetchAttendance = async () => {
  //     setLoading(true);

  //     const { data: { user } } = await supabase.auth.getUser();
  //     if (!user) return;

  //     const { data: studentRecord } = await supabase
  //       .from("students")
  //       .select("id")
  //       .eq("user_id", user.id)
  //       .single();

  //     if (!studentRecord) return;

  //     const studentId = studentRecord.id;

  //     const { data: attendanceData } = await supabase
  //       .from("attendance")
  //       .select("date, present_students_id");

  //     if (!attendanceData) return;

  //     const presentRecords = attendanceData.filter(row =>
  //       row.present_students_id.includes(studentId)
  //     );

  //     const allLecturesByMonth: { [month: string]: number } = {};
  //     const attendedByMonth: { [month: string]: number } = {};

  //     for (const record of attendanceData) {
  //       const month = dayjs(record.date).format("MMMM");
  //       allLecturesByMonth[month] = (allLecturesByMonth[month] || 0) + 1;
  //     }

  //     for (const record of presentRecords) {
  //       const month = dayjs(record.date).format("MMMM");
  //       attendedByMonth[month] = (attendedByMonth[month] || 0) + 1;
  //     }

  //     const months = Array.from({ length: 12 }, (_, i) =>
  //       dayjs().month(i).format("MMMM")
  //     );

  //     const monthData: { [month: string]: number } = {};
  //     let total = 0, attended = 0;

  //     for (const month of months) {
  //       const totalLectures = allLecturesByMonth[month] || 0;
  //       const attendedLectures = attendedByMonth[month] || 0;
  //       const percent = totalLectures > 0 ? Math.round((attendedLectures / totalLectures) * 100) : 0;
  //       monthData[month] = percent;
  //       total += totalLectures;
  //       attended += attendedLectures;
  //     }

  //     setMonthlyAttendance(monthData);
  //     setCurrentAttendance(total > 0 ? Math.round((attended / total) * 100) : 0);
  //     setLoading(false);
  //   };

  //   fetchAttendance();
  // }, []);
  
useEffect(() => {
  const fetchAttendance = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Step 1: Get student data (class, course, semester)
    const { data: studentRecord } = await supabase
      .from("students")
      .select("id, class, course, semester")
      .eq("user_id", user.id)
      .single();

    if (!studentRecord) return;

    const { id: studentId, class: studentClass, course: studentCourse, semester: studentSemester } = studentRecord;

    // Step 2: Fetch only applicable attendance records
    const { data: attendanceData } = await supabase
      .from("attendance")
      .select("date, present_students_id, class, course, semester")
      .eq("class", studentClass)
      .eq("course", studentCourse)
      .eq("semester", studentSemester);

    if (!attendanceData) return;

    const presentRecords = attendanceData.filter(row =>
      row.present_students_id.includes(studentId)
    );

    // Step 3: Monthly attendance grouping
    const allLecturesByMonth: { [month: string]: number } = {};
    const attendedByMonth: { [month: string]: number } = {};

    for (const record of attendanceData) {
      const month = dayjs(record.date).format("MMMM");
      allLecturesByMonth[month] = (allLecturesByMonth[month] || 0) + 1;
    }

    for (const record of presentRecords) {
      const month = dayjs(record.date).format("MMMM");
      attendedByMonth[month] = (attendedByMonth[month] || 0) + 1;
    }

    const months = Array.from({ length: 12 }, (_, i) =>
      dayjs().month(i).format("MMMM")
    );

    const monthData: { [month: string]: number } = {};
    let total = 0, attended = 0;

    for (const month of months) {
      const totalLectures = allLecturesByMonth[month] || 0;
      const attendedLectures = attendedByMonth[month] || 0;
      const percent = totalLectures > 0 ? Math.round((attendedLectures / totalLectures) * 100) : 0;
      monthData[month] = percent;
      total += totalLectures;
      attended += attendedLectures;
    }

    // ✅ Step 4: Set current attendance from calculated values
    setCurrentAttendance(total > 0 ? Math.round((attended / total) * 100) : 0);

    // ✅ Step 5: Set monthly attendance data for bar chart
    setMonthlyAttendance(monthData);
    setLoading(false);
  };

  fetchAttendance();
}, []);





  const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format("MMMM"));

  const chartData = {
    labels: months,
    datasets: [
      {
        label: "Attendance %",
        data: months.map((month) => monthlyAttendance[month] ?? 0),
        backgroundColor: months.map((month) => {
          const percent = monthlyAttendance[month] ?? 0;
          if (percent >= 50) return "rgba(34,197,94,1)"; // Green
          // if (percent >= 50) return "rgba(234,179,8,0.8)"; // Yellow
          // return "rgba(239,68,68,0.8)"; // Red
          else if (percent < 50) return "rgba(239,68,68,1)";
        }),
        borderRadius: 4,
        barThickness: 40,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#333",
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y}% attendance`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: "#555",
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: number) => `${value}%`,
          color: "#555",
        },
        grid: {
          color: "#e5e7eb",
        },
      },
    },
  };

  return (
    <div className="space-y-6 p-4 animate-fade-in">
    {/* <div className="space-y-6 p-4"> */}
      <h2 className="text-xl font-bold">📊 Student Attendance Overview</h2>

      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* <Card className="p-4"> */}
        <Card className="flex-1 p-4">
          {/* <h2 className="text-xl font-bold mb-2">Current Attendance</h2> */}
          <h2 className="text-lg font-semibold mb-2">Current Attendance</h2>
          <p className="text-3xl text-blue-600 font-semibold">{currentAttendance}%</p>
          {/* <p className="text-2xl text-blue-600 font-semibold">{currentAttendance}%</p> */}
        </Card>

        {/* <Card className="p-4"> */}
          <Card className="flex-1 p-4 overflow-x-auto">
          {/* <h2 className="text-xl font-bold mb-2">Monthly Attendance</h2> */}
          <h2 className="text-lg font-semibold mb-2">Monthly Attendance</h2>
          <table className="min-w-full text-left test-sm">
          {/* <table className="w-full text-left"> */}
            <thead>
              <tr>
                <th>Month</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
  {months
    .filter((month) => (monthlyAttendance[month] ?? 0) > 0)
    .map((month) => (
      <tr key={month}>
        <td>{month}</td>
        <td>{monthlyAttendance[month] ?? 0}%</td>
      </tr>
    ))}
</tbody>
          </table>
        </Card>
      </div>

      <Card className="p-4 h-[420px]">
        {/* <h2 className="text-xl font-bold mb-4">📈 Attendance Trend (Last 12 Months)</h2> */}
        <h2 className="text-lg font-semibold mb-4">📈 Attendance Trend (Last 12 Months)</h2>
        <div className="w-full h-full">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </Card>
    </div>
  );
}
