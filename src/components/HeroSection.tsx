// src/components/HeroSection.tsx - Updated with Start Exploring button
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Coins, Users, Globe } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const HeroSection = () => {
  const { currentUser } = useAuth();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Exchange Value,
                <span className="text-blue-600"> Build Community</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Join ErthaExchange - where digital coins unlock real-world services. 
                Connect with trusted organizations and experience seamless transactions.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">1000+</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Globe className="h-8 w-8 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">500+</div>
                <div className="text-sm text-gray-600">Services</div>
              </div>
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  <Coins className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">50k+</div>
                <div className="text-sm text-gray-600">Coins Traded</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {currentUser ? (
                // Show Browse Services button for logged-in users
                <Link to="/services" className="flex-1 sm:flex-initial">
                  <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4">
                    <Coins className="mr-2 h-5 w-5" />
                    Start Exploring Services
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                // Show Get Started button for non-logged-in users
                <>
                  <Link to="/signup" className="flex-1 sm:flex-initial">
                    <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-4">
                      Get Started
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/login" className="flex-1 sm:flex-initial">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-4">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Secure Payments</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Verified Organizations</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span>24/7 Support</span>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative z-10">
              <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Coins className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Digital Wallet</h3>
                    <p className="text-gray-600">Secure coin management</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Available Balance</span>
                      <span className="font-semibold text-blue-600">1,250 Coins</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-sm text-gray-600">Recent Transaction</span>
                      <span className="font-semibold text-green-600">+500 Coins</span>
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    <Coins className="mr-2 h-4 w-4" />
                    Add Coins
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Background Elements */}
            <div className="absolute top-10 -right-10 w-20 h-20 bg-blue-200 rounded-full opacity-60"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-green-200 rounded-full opacity-40"></div>
            <div className="absolute top-1/2 -right-20 w-16 h-16 bg-purple-200 rounded-full opacity-50"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;