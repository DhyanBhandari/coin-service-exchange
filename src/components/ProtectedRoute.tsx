import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, RefreshCw } from "lucide-react";

interface ProtectedRouteProps {
  allowedRoles: string;
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check if email is verified
  if (!currentUser.emailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="text-orange-600 text-4xl mx-auto mb-2" />
            <CardTitle className="text-xl">Email Verification Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Please verify your email address to access your account.
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                We sent a verification email to:
              </p>
              <p className="font-semibold text-gray-800">
                {currentUser.email}
              </p>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                I've Verified My Email
              </Button>
              <Button 
                onClick={() => Navigate({ to: "/login" })}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Check your spam folder if you don't see the verification email.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600">Setting up your account...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role authorization
  if (allowedRoles && userData.role !== allowedRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-blue-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
            <Button onClick={() => window.history.back()} className="w-full">
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;