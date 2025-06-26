import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function AdminOverview() {
  const [attendanceStats, setAttendanceStats] = useState<any[]>([]);
  const [classwise, setClasswise] = useState<any[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;

    const fetchAttendance = async () => {
      const { data, error } = await supabase.rpc('get_avg_attendance_by_class_semester');
      if (!error) setAttendanceStats(data || []);
    };

    fetchAttendance();
  }, [expanded]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>View student attendance across the institute.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Use the Students tab or click to view analytics.</p>
        </CardContent>
      </Card>

      <Card onClick={() => setExpanded(!expanded)} className="cursor-pointer hover:bg-gray-50">
        <CardHeader>
          <CardTitle>Average Attendance</CardTitle>
          <CardDescription>Click to view class-wise and semester-wise averages</CardDescription>
        </CardHeader>
        {expanded && (
          <CardContent className="space-y-2 mt-2">
            <h4 className="font-semibold">By Class</h4>
            {attendanceStats
              .filter((s) => s.type === 'class')
              .map((item, i) => (
                <p key={i}>{item.class} (Sem {item.semester}): {item.average_attendance}%</p>
              ))}

            <h4 className="font-semibold mt-4">By Semester</h4>
            {attendanceStats
              .filter((s) => s.type === 'semester')
              .map((item, i) => (
                <p key={i}>Semester {item.semester}: {item.average_attendance}%</p>
              ))}
          </CardContent>
        )}
      </Card>
    </>
  );
}
