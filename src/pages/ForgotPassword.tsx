import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error: any) {
      let errorMessage = "Failed to send reset email";
      
      if (error.message.includes("user-not-found")) {
        errorMessage = "No account found with this email address";
      } else if (error.message.includes("invalid-email")) {
        errorMessage = "Invalid email address";
      } else if (error.message.includes("too-many-requests")) {
        errorMessage = "Too many requests. Please try again later";
      } else {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="text-green-600 text-4xl mx-auto mb-2" />
            <CardTitle className="text-xl">Check Your Email</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="space-y-2">
              <p className="text-gray-600">
                We've sent a password reset link to:
              </p>
              <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded">
                {email}
              </p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
              <p className="font-medium mb-1">Next steps:</p>
              <ul className="text-left space-y-1">
                <li>• Check your inbox (and spam folder)</li>
                <li>• Click the reset link in the email</li>
                <li>• Follow the instructions to set a new password</li>
              </ul>
            </div>
            
            <div className="space-y-2 pt-2">
              <Button 
                onClick={() => setSent(false)} 
                variant="outline" 
                className="w-full"
              >
                Try Different Email
              </Button>
              <Link to="/login">
                <Button className="w-full">
                  Back to Login
                </Button>
              </Link>
            </div>
            
            <p className="text-xs text-gray-500">
              Didn't receive the email? Check your spam folder or try again with a different email address.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link 
            to="/login" 
            className="flex items-center text-gray-600 hover:text-blue-600 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
          <div className="text-center">
            <Mail className="text-blue-600 text-4xl mx-auto mb-2" />
            <CardTitle className="text-xl">Reset Password</CardTitle>
            <p className="text-gray-600 text-sm mt-2">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">Email Address</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                autoComplete="email"
                className="w-full"
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
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

export default ForgotPassword;