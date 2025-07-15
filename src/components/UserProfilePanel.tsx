import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCoins, FaSignOutAlt, FaUser, FaWallet } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

interface UserProfilePanelProps {
  onClose?: () => void;
}

const UserProfilePanel: React.FC<UserProfilePanelProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { currentUser, userData, logout, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);

  // Refresh user data when component mounts
  useEffect(() => {
    if (currentUser && userData) {
      refreshUserData();
    }
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Error logging out");
      console.error("Logout error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoins = () => {
    if (userData?.role === 'user') {
      navigate("/wallet/add");
      onClose?.();
    }
  };

  const handleViewTransactions = () => {
    if (userData?.role === 'user') {
      navigate("/transactions");
      onClose?.();
    }
  };

  if (!currentUser || !userData) {
    return null;
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'org':
        return 'bg-blue-100 text-blue-800';
      case 'user':
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'org':
        return 'Organization';
      case 'user':
      default:
        return 'User';
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={currentUser.photoURL || undefined} 
              alt={userData.name}
            />
            <AvatarFallback className="bg-blue-100 text-blue-800 font-semibold">
              {getInitials(userData.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-semibold truncate">
              {userData.name}
            </CardTitle>
            <p className="text-sm text-gray-600 truncate">
              {userData.email}
            </p>
            <Badge 
              variant="secondary" 
              className={`text-xs mt-1 ${getRoleBadgeColor(userData.role)}`}
            >
              {getRoleDisplayName(userData.role)}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Email Verification Status */}
        {!currentUser.emailVerified && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-xs text-orange-800">
              ⚠️ Email not verified. Check your inbox for verification email.
            </p>
          </div>
        )}

        {/* Wallet Section for Users */}
        {userData.role === 'user' && (
          <>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FaCoins className="text-yellow-600" />
                  <span className="font-medium text-gray-700">Wallet Balance</span>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  {userData.walletBalance || 0}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleAddCoins}
                size="sm"
                className="text-xs"
                variant="outline"
              >
                <FaWallet className="mr-1 h-3 w-3" />
                Add Coins
              </Button>
              <Button
                onClick={handleViewTransactions}
                size="sm"
                className="text-xs"
                variant="outline"
              >
                History
              </Button>
            </div>
          </>
        )}

        {/* Organization Earnings for Orgs */}
        {userData.role === 'org' && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaCoins className="text-green-600" />
                <span className="font-medium text-gray-700">Earnings</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                {userData.walletBalance || 0}
              </span>
            </div>
          </div>
        )}

        <Separator />

        {/* Profile Actions */}
        <div className="space-y-2">
          <Button
            onClick={() => {
              navigate(`/dashboard/${userData.role}`);
              onClose?.();
            }}
            variant="outline"
            className="w-full justify-start text-sm"
            size="sm"
          >
            <FaUser className="mr-2 h-3 w-3" />
            Dashboard
          </Button>

          <Button
            onClick={handleLogout}
            disabled={loading}
            variant="outline"
            className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
            size="sm"
          >
            <FaSignOutAlt className="mr-2 h-3 w-3" />
            {loading ? "Signing out..." : "Sign Out"}
          </Button>
        </div>

        {/* Account Info */}
        <div className="pt-2 border-t">
          <div className="text-xs text-gray-500 space-y-1">
            <p>Account ID: {userData.id}</p>
            <p>
              Joined: {new Date(userData.createdAt).toLocaleDateString()}
            </p>
            {userData.role === 'user' && (
              <p className="text-green-600">
                ✓ {currentUser.emailVerified ? 'Verified' : 'Unverified'} Account
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfilePanel;