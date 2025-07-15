import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, CheckCircle, AlertTriangle } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validCode, setValidCode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const oobCode = searchParams.get('oobCode');
  const mode = searchParams.get('mode');

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode || mode !== 'resetPassword') {
        toast.error("Invalid reset link");
        navigate("/login");
        return;
      }

      try {
        setVerifying(true);
        const email = await verifyPasswordResetCode(auth, oobCode);
        setEmail(email);
        setValidCode(true);
      } catch (error: any) {
        let errorMessage = "Invalid or expired reset link";
        
        if (error.code === 'auth/expired-action-code') {
          errorMessage = "This reset link has expired. Please request a new one.";
        } else if (error.code === 'auth/invalid-action-code') {
          errorMessage = "This reset link is invalid. Please request a new one.";
        }
        
        toast.error(errorMessage);
        navigate("/forgot-password");
      } finally {
        setVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode, mode, navigate]);

  const validatePassword = () => {
    if (!password) {
      toast.error("Please enter a new password");
      return false;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return false;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePassword()) return;

    try {
      setLoading(true);
      await confirmPasswordReset(auth, oobCode!, password);
      
      toast.success("Password reset successfully! You can now sign in with your new password.");
      navigate("/login");
    } catch (error: any) {
      let errorMessage = "Failed to reset password";
      
      if (error.code === 'auth/expired-action-code') {
        errorMessage = "This reset link has expired. Please request a new one.";
      } else if (error.code === 'auth/invalid-action-code') {
        errorMessage = "This reset link is invalid. Please request a new one.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password.";
      }
      
      toast.error(errorMessage);
      
      if (error.code === 'auth/expired-action-code' || error.code === 'auth/invalid-action-code') {
        navigate("/forgot-password");
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="text-red-600 text-4xl mx-auto mb-2" />
            <CardTitle className="text-xl">Invalid Reset Link</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              This password reset link is invalid or has expired.
            </p>
            <Button onClick={() => navigate("/forgot-password")} className="w-full">
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Lock className="text-blue-600 text-4xl mx-auto mb-2" />
          <CardTitle className="text-xl">Set New Password</CardTitle>
          <p className="text-gray-600 text-sm">
            Create a new password for your account
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {email && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Resetting password for: <strong>{email}</strong>
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium">New Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                autoComplete="new-password"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>
            
            <div>
              <label className="block mb-2 text-sm font-medium">Confirm New Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                autoComplete="new-password"
              />
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Updating Password..." : "Update Password"}
            </Button>
          </form>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;