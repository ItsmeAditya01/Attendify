import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentOverview() {
  const { user } = useAuth();
  const [student, setStudent] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('students')
        .select('name, class, course, semester, enrollment_number')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => setStudent(data));
    }
  }, [user]);

  if (!student) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <Card className="transition-transform duration-300 hover:scale-105">
      <CardHeader>
        <CardTitle>My Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p><strong>Name:</strong> {student.name}</p>
        <p><strong>Enrollment:</strong> {student.enrollment_number}</p>
        <p><strong>Course:</strong> {student.course}</p>
        <p><strong>Class:</strong> {student.class}</p>
        <p><strong>Semester:</strong> {student.semester}</p>
      </CardContent>
    </Card>
    </div>

//     <CardContent className="space-y-4 text-sm sm:text-base px-4 sm:px-6 md:px-8">
//   <div className="grid sm:grid-cols-2 gap-2">
//     <p><strong>Name:</strong> {student.name}</p>
//     <p><strong>Enrollment:</strong> {student.enrollment_number}</p>
//     <p><strong>Course:</strong> {student.course}</p>
//     <p><strong>Class:</strong> {student.class}</p>
//     <p><strong>Semester:</strong> {student.semester}</p>
//   </div>
// </CardContent>

  );
  
}
