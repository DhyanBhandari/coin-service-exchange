import { Navigate } from "react-router-dom";
import { getAuth } from "@/utils/auth";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const auth = getAuth();

  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && auth.role !== allowedRoles) {
    return <Navigate to="/not-found" replace />;
  }

  return children;
};

export default ProtectedRoute;
