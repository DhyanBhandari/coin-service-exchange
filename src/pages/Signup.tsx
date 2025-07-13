// src/pages/Signup.tsx - Fixed with proper error handling
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Coins, User, Building2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'user' | 'org'>('user');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Set initial role from URL params
  useState(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'org') setRole('org');
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting registration with:', { 
        name, 
        email, 
        role, 
        password: '***' 
      });
      
      try {
        const response = await apiService.register({
          name,
          email,
          password,
          role
        });

        if (response) {
          console.log('Registration response:', response);

          if (response.success && response.data) {
            const user = response.data.user;
            
            toast({
              title: "Account Created!",
              description: `Welcome to ErthaExchange, ${user.name}!`,
            });

            // Navigate to appropriate dashboard based on role
            let dashboardPath = '/dashboard/user';
            if (user.role === 'admin') {
              dashboardPath = '/dashboard/admin';
            } else if (user.role === 'org') {
              dashboardPath = '/dashboard/org';
            }

            navigate(dashboardPath);
          } else {
            throw new Error(response.message || 'Registration failed');
          }
        }
      } catch (apiError) {
        // Handle network errors specifically
        if (apiError.message.includes('Failed to fetch') || 
            apiError.message.includes('Network error')) {
          console.error('Network error during registration:', apiError);
          throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        }
        throw apiError;
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = "Please try again with different details.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <Coins className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">ErthaExchange</span>
          </Link>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              Join the future of service exchange
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Account Type</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={role === 'user' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setRole('user')}
                    disabled={isLoading}
                  >
                    <User className="h-4 w-4 mr-2" />
                    User
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'org' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setRole('org')}
                    disabled={isLoading}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Organization
                  </Button>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {role === 'user' ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">User</Badge>
                      <span>Buy coins and access services</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Organization</Badge>
                      <span>Offer services and earn coins</span>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Note: This app works offline with demo accounts.</p>
              <p>You can create a new account or use the demo accounts from the login page.</p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;