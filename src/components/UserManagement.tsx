import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Search, Edit, Trash2, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'faculty' | 'admin';
  enrollment_number?: string;
  faculty_id?: string;
  mobile_number?: string;
  semester?: number;
  course?: string;
  class?: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'student' | 'faculty' | 'admin';
  mobile_number?: string;
  semester?: number;
  course?: string;
  class?: string;
  faculty_id?: string;
  enrollment_number?: string;
}

export function UserManagement() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'student',
    mobile_number: '',
    semester: 1,
    course: '',
    class: '',
    faculty_id: '',
    enrollment_number: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('=== Fetching users ===');
      
      // Fetch all users from public.users table
      const { data: publicUsers, error: publicUsersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (publicUsersError) {
        console.error('Error fetching public users:', publicUsersError);
        throw publicUsersError;
      }

      console.log('Public users fetched:', publicUsers);
      
      // Fetch students data
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      console.log('Students data fetched:', studentsData);

      // Fetch faculty data
      const { data: facultyData, error: facultyError } = await supabase
        .from('faculty')
        .select('*');

      if (facultyError) {
        console.error('Error fetching faculty:', facultyError);
        throw facultyError;
      }

      console.log('Faculty data fetched:', facultyData);

      // Combine data properly
      const combinedUsers: User[] = publicUsers?.map(user => {
        let additionalData: Partial<User> = {
          name: 'Unknown User'
        };

        if (user.role === 'student') {
          const studentData = studentsData?.find(s => s.user_id === user.id);
          if (studentData) {
            additionalData = {
              name: studentData.name || 'Student User',
              enrollment_number: studentData.enrollment_number,
              mobile_number: studentData.mobile_number,
              semester: studentData.semester,
              course: studentData.course,
              class: studentData.class
            };
          }
        } else if (user.role === 'faculty') {
          const facultyInfo = facultyData?.find(f => f.user_id === user.id);
          if (facultyInfo) {
            additionalData = {
              name: facultyInfo.name || 'Faculty User',
              faculty_id: facultyInfo.faculty_id
            };
          }
        } else if (user.role === 'admin') {
          additionalData = {
            name: 'Admin User'
          };
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          ...additionalData
        } as User;
      }) || [];

      console.log('Combined users:', combinedUsers);

      // Filter based on user role permissions
      let filteredUsers = combinedUsers;
      if (profile?.role === 'faculty') {
        filteredUsers = combinedUsers.filter(user => user.role === 'student');
      }

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      console.log('=== Starting user creation process ===');
      console.log('Form data:', formData);
      
      // Validate required fields
      if (!formData.name || !formData.email || !formData.password) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (formData.role === 'student' && !formData.enrollment_number) {
        toast.error('Enrollment number is required for students');
        return;
      }

      if (formData.role === 'faculty' && !formData.faculty_id) {
        toast.error('Faculty ID is required for faculty');
        return;
      }

      // Step 1: Create auth user with role in metadata
      console.log('Step 1: Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            role: formData.role,
            name: formData.name
          }
        }
      }); 
//       const { data: authData, error: authError } = await supabase.auth.admin.createUser({
//   email: formData.email,
//   password: formData.password,
//   email_confirm: true, // ✅ allow login without email confirmation
//   user_metadata: {
//     role: formData.role,
//     name: formData.name
//   }
// });


      if (authError) {
        console.error('Auth creation failed:', authError);
        toast.error(`Failed to create user authentication: ${authError.message}`);
        return;
      }

       if (!authData.user) {
        toast.error('Failed to create user authentication - no user returned');
        return;
      }

      const userId = authData.user.id;
     console.log('Created auth user with ID:', userId);

// const res = await fetch("http://localhost:4000/create-user", {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({
//     email: formData.email,
//     password: formData.password,
//     metadata: { name: formData.name, role: formData.role }
//   })
// });

// const result = await res.json();
// if (!res.ok) {
//   console.error("Auth creation failed:", result.error);
//   return;
// }

// const newUserId = result.user.id;

// // ➕ Add to students table
// if (formData.role === "student") {
//   await supabase.from("students").insert({
//     user_id: newUserId,
//     name: formData.name,
//     email: formData.email,
//     class: formData.class,
//     semester: formData.semester,
//     course: formData.course
//   });
// }


      // Step 2: Wait a moment for trigger to potentially create public.users entry
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Ensure public.users entry exists
      console.log('Step 2: Ensuring public.users entry...');
      const { error: publicUserError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: formData.email,
          role: formData.role
        }, {
          onConflict: 'id'
        });

      if (publicUserError) {
        console.error('Failed to create/update public user:', publicUserError);
        toast.error(`Failed to create user profile: ${publicUserError.message}`);
        return;
      }

      // Step 4: Create role-specific profile
      console.log('Step 3: Creating role-specific profile...');
      if (formData.role === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: userId,
            name: formData.name,
            email: formData.email,
            enrollment_number: formData.enrollment_number,
            mobile_number: formData.mobile_number,
            semester: formData.semester,
            course: formData.course,
            class: formData.class
          });

        if (studentError) {
          console.error('Student profile creation failed:', studentError);
          toast.error(`Failed to create student profile: ${studentError.message}`);
          return;
        }
      } else if (formData.role === 'faculty') {
        const { error: facultyError } = await supabase
          .from('faculty')
          .insert({
            user_id: userId,
            name: formData.name,
            email: formData.email,
            faculty_id: formData.faculty_id
          });

        if (facultyError) {
          console.error('Faculty profile creation failed:', facultyError);
          toast.error(`Failed to create faculty profile: ${facultyError.message}`);
          return;
        }
      }

      console.log('=== User creation successful ===');
      toast.success('User created successfully!');
      setIsAddUserOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('=== Unexpected error during user creation ===', error);
      toast.error('An unexpected error occurred while creating the user');
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      if (editingUser.role === 'student') {
        const { error } = await supabase
          .from('students')
          .update({
            name: formData.name,
            mobile_number: formData.mobile_number,
            semester: formData.semester,
            course: formData.course,
            class: formData.class
          })
          .eq('user_id', editingUser.id);

        if (error) throw error;
      } else if (editingUser.role === 'faculty') {
        const { error } = await supabase
          .from('faculty')
          .update({
            name: formData.name,
            faculty_id: formData.faculty_id
          })
          .eq('user_id', editingUser.id);

        if (error) throw error;
      }

      toast.success('User updated successfully');
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string, userRole: string) => {
    try {
      console.log('=== Deleting user ===', userId, userRole);
      
      // First delete from role-specific table
      if (userRole === 'student') {
        const { error: studentError } = await supabase
          .from('students')
          .delete()
          .eq('user_id', userId);
        
        if (studentError) {
          console.error('Error deleting student:', studentError);
          throw studentError;
        }
      } else if (userRole === 'faculty') {
        const { error: facultyError } = await supabase
          .from('faculty')
          .delete()
          .eq('user_id', userId);
        
        if (facultyError) {
          console.error('Error deleting faculty:', facultyError);
          throw facultyError;
        }
      }

      // Then delete from public.users (this will cascade to auth.users)
      const { error: publicUserError } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (publicUserError) {
        console.error('Error deleting public user:', publicUserError);
        throw publicUserError;
      }

      // Finally delete auth user
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('Error deleting auth user:', authError);
        // Don't throw here as the user data is already cleaned up
      }

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const canManageUser = (user: User) => {
    if (profile?.role === 'admin') return true;
    // if (profile?.role === 'faculty' && user.role === 'student') return true;
    if (profile?.role === 'faculty' && user.role === 'student') return true;
    return false;
  };

  const canCreateRole = (role: string) => {
    if (profile?.role === 'admin') return true;
    if (profile?.role === 'faculty' && role === 'student') return true;
    // if (profile?.role === 'faculty' ) return true;
    return false;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      mobile_number: '',
      semester: 1,
      course: '',
      class: '',
      faculty_id: '',
      enrollment_number: ''
    });
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email,
      password: '',
      role: user.role,
      mobile_number: user.mobile_number || '',
      semester: user.semester || 1,
      course: user.course || '',
      class: user.class || '',
      faculty_id: user.faculty_id || '',
      enrollment_number: user.enrollment_number || ''
    });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'faculty':
        return 'bg-blue-100 text-blue-800';
      case 'student':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>
                {profile?.role === 'admin' ? 'Manage students, faculty, and admin users' : 'Manage student users'}
              </CardDescription>
            </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>
                    Create a new user account with proper authentication
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter full name" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="user@university.edu" 
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Enter password" 
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={formData.role} onValueChange={(value: 'student' | 'faculty' | 'admin') => setFormData({...formData, role: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select-Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* {canCreateRole('student') && <SelectItem value="student">Student</SelectItem>} */}
                        {canCreateRole('faculty') && <SelectItem value="faculty">Faculty</SelectItem>}
                        {canCreateRole('admin') && <SelectItem value="admin">Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* {formData.role === 'student' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="enrollment_number">Enrollment Number</Label>
                        <Input 
                          id="enrollment_number" 
                          placeholder="Enter enrollment number" 
                          value={formData.enrollment_number}
                          onChange={(e) => setFormData({...formData, enrollment_number: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mobile">Mobile Number</Label>
                        <Input 
                          id="mobile" 
                          placeholder="Enter mobile number" 
                          value={formData.mobile_number}
                          onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="course">Course</Label>
                        <Input 
                          id="course" 
                          placeholder="Enter course" 
                          value={formData.course}
                          onChange={(e) => setFormData({...formData, course: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="class">Class</Label>
                        <Input 
                          id="class" 
                          placeholder="Enter class" 
                          value={formData.class}
                          onChange={(e) => setFormData({...formData, class: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <Select value={formData.semester?.toString()} onValueChange={(value) => setFormData({...formData, semester: parseInt(value)})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1,2,3,4,5,6,7,8].map(sem => (
                              <SelectItem key={sem} value={sem.toString()}>{sem}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )} */}
                  
                  {formData.role === 'faculty' && (
                    <div className="space-y-2">
                      <Label htmlFor="faculty_id">Faculty ID</Label>
                      <Input 
                        id="faculty_id" 
                        placeholder="Enter faculty ID" 
                        value={formData.faculty_id}
                        onChange={(e) => setFormData({...formData, faculty_id: e.target.value})}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 mt-6">
                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleCreateUser}>
                    Create User
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => {setIsAddUserOpen(false); resetForm();}}>
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {profile?.role === 'admin' && <SelectItem value="admin">Admin</SelectItem>}
                {profile?.role === 'admin' && <SelectItem value="faculty">Faculty</SelectItem>}
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Enrollment/Faculty ID</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.role === 'student' ? user.enrollment_number || 'N/A' : user.faculty_id || 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      {canManageUser(user) && (
                        <div className="flex items-center justify-end space-x-2">
                          <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => openEditDialog(user)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit User</DialogTitle>
                                <DialogDescription>
                                  Update user information
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="edit-name">Full Name</Label>
                                  <Input 
                                    id="edit-name" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                  />
                                </div>
                                
                                {user.role === 'student' && (
                                  <>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-mobile">Mobile Number</Label>
                                      <Input 
                                        id="edit-mobile" 
                                        value={formData.mobile_number}
                                        onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-course">Course</Label>
                                      <Input 
                                        id="edit-course" 
                                        value={formData.course}
                                        onChange={(e) => setFormData({...formData, course: e.target.value})}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-class">Class</Label>
                                      <Input 
                                        id="edit-class" 
                                        value={formData.class}
                                        onChange={(e) => setFormData({...formData, class: e.target.value})}
                                      />
                                    </div>
                                  </>
                                )}
                                
                                {user.role === 'faculty' && (
                                  <div className="space-y-2">
                                    <Label htmlFor="edit-faculty-id">Faculty ID</Label>
                                    <Input 
                                      id="edit-faculty-id" 
                                      value={formData.faculty_id}
                                      onChange={(e) => setFormData({...formData, faculty_id: e.target.value})}
                                    />
                                  </div>
                                )}
                                
                                <div className="flex space-x-2">
                                  <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleEditUser}>
                                    Update User
                                  </Button>
                                  <Button variant="outline" className="flex-1" onClick={() => setEditingUser(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user account and remove all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(user.id, user.role)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <UserPlus className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>No users found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
