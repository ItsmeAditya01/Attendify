import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface Student {
id: string;
name: string;
enrollment_number: string;
class: string;
course: string;
semester: number;
}

interface AttendanceRecord {
present_students_id: string[];
class: string;
course: string;
semester: number;
}

interface Group {
label: string;
class: string;
course: string;
semester: number;
}

export default function Reports() {
const [students, setStudents] = useState<Student[]>([]);
const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
const [groups, setGroups] = useState<Group[]>([]);

useEffect(() => {
const fetchData = async () => {
const { data: studentList } = await supabase
.from("students")
.select("id, name, enrollment_number, class, course, semester");

  const { data: attendanceRecords } = await supabase
    .from("attendance")
    .select("present_students_id, class, course, semester");

  if (!studentList || !attendanceRecords) return;

  setStudents(studentList);
  setAttendanceData(attendanceRecords);

  const uniqueGroups = Array.from(
    new Set(
      studentList.map(s => `${s.class}|${s.course}|${s.semester}`)
    )
  ).map(entry => {
    const [cls, course, sem] = entry.split("|");
    return {
      label: `${course}-${cls} | Semester ${sem}`,
      class: cls,
      course,
      semester: Number(sem),
    };
  });

  setGroups(uniqueGroups);
};

fetchData();
}, []);

const getStudentsForGroup = (group: Group) => {
return students.filter(
s =>
s.class === group.class &&
s.course === group.course &&
s.semester === group.semester
);
};

const calculateAttendance = (studentId: string, group: Group) => {
const groupRecords = attendanceData.filter(
record =>
record.class === group.class &&
record.course === group.course &&
record.semester === group.semester
);

const total = groupRecords.length;
const attended = groupRecords.filter(record =>
  record.present_students_id.includes(studentId)
).length;

return total > 0 ? Math.round((attended / total) * 100) : 0;
};

// const exportToExcel = (studentsList: Student[], group: Group) => {
//   const exportData = studentsList.map((s) => ({
//     Name: s.name,
//     "Enrollment Number": s.enrollment_number,
//     "Attendance %": calculateAttendance(s.id, group),
//   }));

//   const worksheet = XLSX.utils.json_to_sheet(exportData);

//   // Add header metadata
//   XLSX.utils.sheet_add_aoa(worksheet, [
//     [`Course: ${group.course} | Class: ${group.class} | Semester: ${group.semester}`],
//     [],
//   ], { origin: "A1" });

//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

//   const fileName = `Attendance_Report_${group.course}_${group.class}_Sem${group.semester}.xlsx`;
//   const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
//   const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
//   saveAs(blob, fileName);
// };
const exportToExcel = (studentsList: Student[], group: Group) => {
  const exportData = studentsList.map((s) => {
    const percent = calculateAttendance(s.id, group);
    return {
      "Name": s.name,
      "Enrollment Number": s.enrollment_number,
      "Attendance %": percent,
      attendanceColor: percent >= 50 ? "green" : "red", // for post-processing
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(
    exportData.map(({ attendanceColor, ...rest }) => rest) // remove extra prop for now
  );

  // Merge header cells and set metadata row
  XLSX.utils.sheet_add_aoa(
    worksheet,
    [[`Attendance Report - ${group.label}`], []],
    { origin: "A1" }
  );

  // Example: Apply center alignment to A1
  worksheet["A1"].s = {
    font: { bold: true, sz: 14 },
    alignment: { horizontal: "center" },
  };

  // Set column widths
  const wscols = [{ wch: 25 }, { wch: 20 }, { wch: 15 }];
  worksheet["!cols"] = wscols;

  // Highlight cells based on attendance %
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "");
  for (let R = 3; R <= range.e.r; ++R) {
    const attendanceCell = worksheet[XLSX.utils.encode_cell({ r: R, c: 2 })]; // "Attendance %" col
    if (attendanceCell && typeof attendanceCell.v === "number") {
      attendanceCell.s = {
        font: { color: { rgb: attendanceCell.v >= 50 ? "006100" : "9C0006" } },
        fill: {
          fgColor: {
            rgb: attendanceCell.v >= 50 ? "C6EFCE" : "FFC7CE", // green/red bg
          },
        },
      };
    }
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

  const fileName = `Attendance_Report_${group.course}_${group.class}_Sem${group.semester}.xlsx`;
  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
    cellStyles: true, // ✅ needed for styling
  });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, fileName);
};


return (
<div className="p-6 space-y-6">
<h2 className="text-xl font-bold">📋 Attendance Reports</h2>

  <div className="flex flex-wrap gap-2">
    {groups.map((group, index) => (
      <Button
        key={index}
        variant={selectedGroup === group ? "default" : "outline"}
        onClick={() => setSelectedGroup(group)}
      >
        {group.label}
      </Button>
    ))}
  </div>

  {selectedGroup && (
    <Card className="p-4 mt-4">
      <h3 className="text-lg font-semibold mb-2">
        Students for {selectedGroup.label}
      </h3>
      <Button
  className="mb-4"
  onClick={() =>
    exportToExcel(getStudentsForGroup(selectedGroup), selectedGroup)
  }
>
  Export to Excel
</Button>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Enrollment Number</TableHead>
            <TableHead>Attendance %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {getStudentsForGroup(selectedGroup).map((student) => (
            <TableRow key={student.id}>
              <TableCell>{student.name}</TableCell>
              <TableCell>{student.enrollment_number}</TableCell>
              {/* <TableCell>{calculateAttendance(student.id, selectedGroup)}%</TableCell> */}
              <TableCell
  className={
    calculateAttendance(student.id, selectedGroup) > 50
      ? "text-green-600"
      : "text-red-600"
  }
>
  {calculateAttendance(student.id, selectedGroup)}%
</TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )}
</div>
);
}