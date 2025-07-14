// src/components/RedirectIfLoggedIn.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTokenPayload } from "../lib/token"; // replace with actual path
import { ReactNode } from "react";

const RedirectIfLoggedIn = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const payload = getTokenPayload();
    if (payload?.role) {
      const redirectMap: Record<string, string> = {
        user: "/dashboard/user",
        org: "/dashboard/org",
        admin: "/dashboard/admin",
      };
      navigate(redirectMap[payload.role]);
    }
  }, [navigate]);

  return <>{children}</>;
};

export default RedirectIfLoggedIn;
