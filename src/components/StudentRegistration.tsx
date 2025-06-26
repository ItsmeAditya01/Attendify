import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

export function StudentRegistration({ onBack }: { onBack: () => void }) {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    enrollment_number: '',
    mobile_number: '',
    semester: '',
    course: '',
    class: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Starting student registration...');

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await signUp(formData.email, formData.password, {
        ...formData,
        role: 'student',
      });

      if (authError) {
        console.error('Registration error:', authError);
        toast({
          title: "Registration Failed",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      if (!authData.user) {
        toast({
          title: "Registration Failed",
          description: "No user created",
          variant: "destructive",
        });
        return;
      }

      console.log('Auth user created:', authData.user.id);

      // Step 2: Wait for trigger to create public.users entry
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Ensure public.users entry exists
      const { error: publicUserError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: formData.email,
          role: 'student'
        }, {
          onConflict: 'id'
        });

      if (publicUserError) {
        console.error('Failed to create public user:', publicUserError);
        toast({
          title: "Registration Failed",
          description: `Failed to create user profile: ${publicUserError.message}`,
          variant: "destructive",
        });
        return;
      }

      // Step 4: Create student profile
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: authData.user.id,
          name: formData.name,
          email: formData.email,
          enrollment_number: formData.enrollment_number,
          mobile_number: formData.mobile_number,
          semester: parseInt(formData.semester),
          course: formData.course,
          class: formData.class
        });

      if (studentError) {
        console.error('Student profile creation failed:', studentError);
        toast({
          title: "Registration Failed",
          description: `Failed to create student profile: ${studentError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log('Student registration successful');
      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account.",
      });
      onBack();
    } catch (error) {
      console.error('Unexpected registration error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Student Registration</CardTitle>
        <CardDescription>Create your student account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="enrollment_number">Enrollment Number</Label>
            <Input
              id="enrollment_number"
              type="text"
              required
              value={formData.enrollment_number}
              onChange={(e) => setFormData({ ...formData, enrollment_number: e.target.value })}
              placeholder="e.g., EN2024001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input
              id="mobile"
              type="tel"
              value={formData.mobile_number}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="semester">Semester</Label>
            <Select value={formData.semester} onValueChange={(value) => setFormData({ ...formData, semester: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select Semester" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <SelectItem key={sem} value={sem.toString()}>
                    Semester {sem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Input
              id="course"
              type="text"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              placeholder="e.g., Computer Science"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <Input
              id="class"
              type="text"
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              placeholder="e.g., CS-A"
            />
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Registering..." : "Register"}
            </Button>
            <Button type="button" variant="outline" onClick={onBack} className="flex-1">
              Back to Login
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
