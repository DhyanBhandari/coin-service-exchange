import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { FaUserPlus, FaGoogle } from "react-icons/fa6";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, Mail } from "lucide-react";

const Signup = () => {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'org'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleRoleChange = (value: 'user' | 'org') => {
    setFormData(prev => ({ ...prev, role: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    
    if (!formData.email.trim()) {
      toast.error("Please enter your email");
      return false;
    }
    
    if (!formData.password) {
      toast.error("Please enter a password");
      return false;
    }
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    
    if (!acceptTerms) {
      toast.error("Please accept the terms and conditions");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      await signUp(formData.email, formData.password, formData.name, formData.role);
      
      toast.success("🎉 Account created! Please check your email to verify your account.");
      navigate("/login");
    } catch (error: any) {
      let errorMessage = "Signup failed";
      
      if (error.message.includes("email-already-in-use")) {
        errorMessage = "An account with this email already exists";
      } else if (error.message.includes("weak-password")) {
        errorMessage = "Password is too weak";
      } else if (error.message.includes("invalid-email")) {
        errorMessage = "Invalid email address";
      } else {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!acceptTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    try {
      setGoogleLoading(true);
      const result = await signInWithGoogle(formData.role);
      
      toast.success("🎉 Account created successfully!");
      
      // Role-based redirect
      const role = result.userData.role;
      const redirectMap: Record<string, string> = {
        user: "/dashboard/user",
        admin: "/dashboard/admin",
        org: "/dashboard/org"
      };
      
      navigate(redirectMap[role] || "/");
    } catch (error: any) {
      toast.error(error.message || "Google sign-up failed");
      console.error("Google sign-up error:", error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <FaUserPlus className="text-blue-600 text-4xl mx-auto mb-2" />
          <CardTitle className="text-xl">Create your account</CardTitle>
          <p className="text-gray-600 text-sm">Join ErthaExchange today</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Type Selection */}
          <div>
            <label className="block mb-2 text-sm font-medium">Account Type</label>
            <Select value={formData.role} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Individual User</SelectItem>
                <SelectItem value="org">Organization</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.role === 'user' 
                ? 'Access services and manage your wallet' 
                : 'Offer services and convert coins to cash'
              }
            </p>
          </div>

          {/* Google Sign Up */}
          <Button
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            variant="outline"
            className="w-full flex items-center gap-2"
          >
            <FaGoogle className="text-red-500" />
            {googleLoading ? "Creating account..." : "Continue with Google"}
          </Button>
          
          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-gray-500 text-sm">or</span>
            <Separator className="flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">Full Name</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                autoComplete="name"
              />
            </div>
            
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
                autoComplete="new-password"
              />
            </div>
            
            <div>
              <label className="block mb-1 text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
            </div>
            
            {/* Terms and Conditions */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms" 
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
              />
              <label htmlFor="terms" className="text-xs text-gray-600">
                I agree to the{" "}
                <Link to="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>
                {" "}and{" "}
                <Link to="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>
            
            <Button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              You'll receive a verification email after signup.
            </AlertDescription>
          </Alert>
          
          <div className="text-center text-sm">
            <p>
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;