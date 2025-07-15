import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { FaSignInAlt, FaGoogle } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const result = await signIn(formData.email, formData.password);
      
      toast.success("🎉 Login successful!");
      
      // Role-based redirect
      const role = result.userData.role;
      const redirectMap: Record<string, string> = {
        user: "/dashboard/user",
        admin: "/dashboard/admin",
        org: "/dashboard/org"
      };
      
      navigate(redirectMap[role] || "/");
    } catch (error: any) {
      let errorMessage = "Login failed";
      
      if (error.message.includes("wrong-password")) {
        errorMessage = "Incorrect password";
      } else if (error.message.includes("user-not-found")) {
        errorMessage = "No account found with this email";
      } else if (error.message.includes("too-many-requests")) {
        errorMessage = "Too many failed attempts. Please try again later";
      } else if (error.message.includes("invalid-email")) {
        errorMessage = "Invalid email address";
      } else {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const result = await signInWithGoogle('user');
      
      toast.success("🎉 Login successful!");
      
      // Role-based redirect
      const role = result.userData.role;
      const redirectMap: Record<string, string> = {
        user: "/dashboard/user",
        admin: "/dashboard/admin",
        org: "/dashboard/org"
      };
      
      navigate(redirectMap[role] || "/");
    } catch (error: any) {
      toast.error(error.message || "Google sign-in failed");
      console.error("Google sign-in error:", error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <FaSignInAlt className="text-blue-600 text-4xl mx-auto mb-2" />
          <CardTitle className="text-xl">Welcome back!</CardTitle>
          <p className="text-gray-600 text-sm">Sign in to your ErthaExchange account</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <FaGoogle className="text-red-500" />
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>
          
          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-gray-500 text-sm">or</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Email</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">Password</label>
              <Input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Make sure your email is verified to access all features.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2 text-center text-sm">
            <p>
              Don't have an account?{" "}
              <Link to="/signup" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </p>
            <p>
              <Link to="/forgot-password" className="text-blue-600 hover:underline">
                Forgot your password?
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;