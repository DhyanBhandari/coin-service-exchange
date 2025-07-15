import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface RedirectIfLoggedInProps {
  children: ReactNode;
}

const RedirectIfLoggedIn: React.FC<RedirectIfLoggedInProps> = ({ children }) => {
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

  if (currentUser && userData) {
    const redirectMap: Record<string, string> = {
      user: "/dashboard/user",
      org: "/dashboard/org",
      admin: "/dashboard/admin",
    };
    return <Navigate to={redirectMap[userData.role] || "/"} replace />;
  }

  return <>{children}</>;
};

export default RedirectIfLoggedIn;