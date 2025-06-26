
import { useState } from "react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { StudentRegistration } from "@/components/StudentRegistration";

const Index = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("student");
  const [showRegistration, setShowRegistration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [pendingRole, setPendingRole] = useState<string | null>(null); // new
  const navigate = useNavigate();
const { signIn, profile, loading: profileLoading } = useAuth();
  // const { signIn } = useAuth();
  const { toast } = useToast();

  // const handleLogin = async (role: string) => {
  //   if (!credentials.email || !credentials.password) {
  //     toast({
  //       title: "Missing Credentials",
  //       description: "Please enter both email and password.",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setLoading(true);
  //   console.log('Starting login process for role:', role);
    
  //   try {
  //     const { error } = await signIn(credentials.email, credentials.password);
      
  //     if (error) {
  //       console.error('Login error:', error);
  //       toast({
  //         title: "Login Failed",
  //         description: error.message,
  //         variant: "destructive",
  //       });
  //     } else {
  //       console.log('Login successful, navigating to dashboard...');
  //       toast({
  //         title: "Login Successful",
  //         description: "Welcome back!",
  //       });
  //       // Navigate immediately after successful login
  //       navigate(`/dashboard?role=${role}`);
  //     }
  //   } catch (error) {
  //     console.error('Unexpected login error:', error);
  //     toast({
  //       title: "Error",
  //       description: "An unexpected error occurred.",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleLogin = async (selectedRole: string) => {
  if (!credentials.email || !credentials.password) {
    toast({
      title: "Missing Credentials",
      description: "Please enter both email and password.",
      variant: "destructive",
    });
    return;
  }

  setLoading(true);
  try {
    const { error } = await signIn(credentials.email, credentials.password);

    if (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
sessionStorage.setItem("requestedRole", selectedRole);
    }
  } catch (error) {
    console.error('Unexpected login error:', error);
    toast({
      title: "Error",
      description: "An unexpected error occurred.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  const requestedRole = sessionStorage.getItem("requestedRole");

  if (!requestedRole || profileLoading || !profile) return;

  if (profile.role !== requestedRole) {
    toast({
      title: "Access Denied",
      description: `You are not authorized to log in as ${requestedRole}.`,
      variant: "destructive",
    });
    localStorage.removeItem("requestedRole");
    return;
  }

  toast({
    title: "Login Successful",
    description: "Welcome back!",
  });

  navigate(`/dashboard?role=${requestedRole}`);
  localStorage.removeItem("requestedRole");
}, [profile, profileLoading]);


  if (showRegistration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <StudentRegistration onBack={() => setShowRegistration(false)} />
      </div>
    );
  }

  


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Attendify</h1>
          <p className="text-blue-600">Smart Attendance Management System</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-blue-900">Welcome Back</CardTitle>
            <CardDescription>Sign in to your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-blue-50">
                <TabsTrigger value="student" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Student
                </TabsTrigger>
                <TabsTrigger value="faculty" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Faculty
                </TabsTrigger>
                <TabsTrigger value="admin" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-email">Email</Label>
                    <Input
                      id="student-email"
                      type="email"
                      placeholder="student@university.edu"
                      className="border-blue-200 focus:border-blue-500"
                      value={credentials.email}
                      onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="student-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="border-blue-200 focus:border-blue-500 pr-10"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleLogin('student')}
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Sign In as Student"}
                  </Button>
                  <div className="text-center">
                    <Button 
                      variant="link" 
                      className="text-blue-600 hover:text-blue-700"
                      onClick={() => setShowRegistration(true)}
                    >
                      New student? Register here
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="faculty" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="faculty-email">Email</Label>
                    <Input
                      id="faculty-email"
                      type="email"
                      placeholder="faculty@university.edu"
                      className="border-blue-200 focus:border-blue-500"
                      value={credentials.email}
                      onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faculty-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="faculty-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="border-blue-200 focus:border-blue-500 pr-10"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleLogin('faculty')}
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Sign In as Faculty"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="admin" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@university.edu"
                      className="border-blue-200 focus:border-blue-500"
                      value={credentials.email}
                      onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter admin password"
                        className="border-blue-200 focus:border-blue-500 pr-10"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleLogin('admin')}
                    disabled={loading}
                  >
                    {loading ? "Signing In..." : "Sign In as Admin"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-sm text-blue-600">
          © 2024 Attendify. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Index;
