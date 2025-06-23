
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import UserProfilePanel from "./UserProfilePanel";

const Navigation = () => {
  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Coins className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">ErthaExchange</span>
          </Link>
          <div className="flex items-center space-x-4">
            <UserProfilePanel />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
