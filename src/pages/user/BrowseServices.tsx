// src/pages/user/BrowseServices.tsx - Updated with wallet balance and navigation
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Search, Filter, Star, Building2, Coins, Home, Plus, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const BrowseServices = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<any>(null);
  const { toast } = useToast();
  const { userData } = useAuth();
  const navigate = useNavigate();

  // Get wallet balance from userData
  const walletBalance = userData?.walletBalance || 0;

  const categories = [
    { id: "all", name: "All Services" },
    { id: "technology", name: "Technology" },
    { id: "business", name: "Business" },
    { id: "creative", name: "Creative" },
    { id: "marketing", name: "Marketing" },
    { id: "consulting", name: "Consulting" }
  ];

  const services = [
    {
      id: 1,
      title: "Web Development",
      description: "Custom website development with modern technologies",
      price: 200,
      category: "technology",
      organization: "TechCorp Solutions",
      rating: 4.9,
      reviews: 156,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400",
      features: ["Responsive Design", "SEO Optimized", "Modern Framework", "24/7 Support"]
    },
    {
      id: 2,
      title: "Digital Marketing",
      description: "Complete digital marketing strategy and execution",
      price: 50,
      category: "marketing",
      organization: "MarketPro Agency",
      rating: 4.8,
      reviews: 89,
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400",
      features: ["Social Media", "SEO", "Content Creation", "Analytics"]
    },
    {
      id: 3,
      title: "Logo Design",
      description: "Professional logo design for your brand",
      price: 75,
      category: "creative",
      organization: "Creative Studio",
      rating: 4.7,
      reviews: 234,
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400",
      features: ["Multiple Concepts", "Vector Files", "Brand Guidelines", "Revisions"]
    },
    {
      id: 4,
      title: "Business Consulting",
      description: "Strategic business consulting and planning",
      price: 100,
      category: "consulting",
      organization: "BizConsult Pro",
      rating: 4.9,
      reviews: 67,
      image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400",
      features: ["Strategy Planning", "Market Analysis", "Growth Plan", "Follow-up"]
    },
    {
      id: 5,
      title: "Mobile App Development",
      description: "Native and cross-platform mobile applications",
      price: 300,
      category: "technology",
      organization: "AppDev Studios",
      rating: 4.8,
      reviews: 98,
      image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400",
      features: ["iOS & Android", "Modern UI", "API Integration", "App Store Deploy"]
    },
    {
      id: 6,
      title: "Content Writing",
      description: "Professional content writing for websites and blogs",
      price: 25,
      category: "creative",
      organization: "WordCraft Agency",
      rating: 4.6,
      reviews: 145,
      image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400",
      features: ["SEO Optimized", "Research-based", "Multiple Drafts", "Quick Delivery"]
    }
  ];

  const filteredServices = services.filter(service => {
    const matchesSearch = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleBookService = (service: any) => {
    // Check if user has sufficient balance
    if (walletBalance < service.price) {
      toast({
        title: "Insufficient Balance",
        description: `You need ${service.price - walletBalance} more coins. Add coins to your wallet first.`,
        variant: "destructive",
      });
      return;
    }

    // Simulate booking
    toast({
      title: "Service Booked!",
      description: `${service.title} has been booked for ${service.price} coins.`,
    });
    setSelectedService(null);
  };

  const handleAddCoins = () => {
    navigate('/wallet/add');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center text-gray-600 hover:text-blue-600 transition-colors">
                <Home className="h-5 w-5 mr-2" />
                Home
              </Link>
              <span className="text-gray-300">/</span>
              <div className="flex items-center space-x-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-semibold text-gray-900">Browse Services</span>
              </div>
            </div>

            {/* Wallet Balance Display */}
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Wallet Balance</p>
                    <div className="flex items-center space-x-1">
                      <Coins className="h-4 w-4 text-blue-600" />
                      <span className="text-lg font-bold text-blue-600">{walletBalance}</span>
                      <span className="text-sm text-blue-500">coins</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                size="sm" 
                onClick={handleAddCoins}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Coins
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Info */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Explore Services</h1>
          <p className="text-gray-600">Discover amazing services from verified organizations</p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="transition-all duration-200"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Low Balance Warning */}
        {walletBalance < 50 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-yellow-100 p-2 rounded-full">
                  <Wallet className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium text-yellow-900">Low Balance</h3>
                  <p className="text-sm text-yellow-700">
                    You have {walletBalance} coins. Consider adding more coins to access premium services.
                  </p>
                </div>
              </div>
              <Button onClick={handleAddCoins} size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                Add Coins
              </Button>
            </div>
          </div>
        )}

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
              <div className="aspect-video bg-gray-200 relative">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
                {walletBalance < service.price && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="destructive" className="bg-red-500">
                      Insufficient Balance
                    </Badge>
                  </div>
                )}
              </div>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-xs">{service.category}</Badge>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600">{service.rating}</span>
                    <span className="text-xs text-gray-400">({service.reviews})</span>
                  </div>
                </div>
                <CardTitle className="text-lg leading-tight">{service.title}</CardTitle>
                <CardDescription className="text-sm line-clamp-2">{service.description}</CardDescription>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Building2 className="h-4 w-4 mr-1" />
                  {service.organization}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Coins className="h-5 w-5 text-blue-600 mr-1" />
                    <span className="text-2xl font-bold text-blue-600">{service.price}</span>
                    <span className="text-gray-500 ml-1">coins</span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        onClick={() => setSelectedService(service)}
                        disabled={walletBalance < service.price}
                        className={walletBalance < service.price ? "opacity-50 cursor-not-allowed" : ""}
                      >
                        {walletBalance < service.price ? "Need More Coins" : "Book Now"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl">{service.title}</DialogTitle>
                        <DialogDescription className="text-base">
                          by {service.organization}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <img 
                          src={service.image} 
                          alt={service.title}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <p className="text-gray-700">{service.description}</p>
                        
                        <div>
                          <h4 className="font-semibold mb-2">What's included:</h4>
                          <ul className="space-y-1">
                            {service.features.map((feature: string, index: number) => (
                              <li key={index} className="flex items-center text-sm">
                                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Booking Section */}
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Service Cost</p>
                              <div className="flex items-center">
                                <Coins className="h-5 w-5 text-blue-600 mr-1" />
                                <span className="text-2xl font-bold text-blue-600">{service.price}</span>
                                <span className="text-gray-500 ml-1">coins</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Your Balance</p>
                              <div className="flex items-center">
                                <Wallet className="h-5 w-5 text-green-600 mr-1" />
                                <span className="text-2xl font-bold text-green-600">{walletBalance}</span>
                                <span className="text-gray-500 ml-1">coins</span>
                              </div>
                            </div>
                          </div>

                          {walletBalance < service.price && (
                            <div className="bg-red-50 p-3 rounded border border-red-200">
                              <p className="text-red-800 text-sm font-medium">
                                You need {service.price - walletBalance} more coins to book this service.
                              </p>
                            </div>
                          )}

                          <div className="flex space-x-2">
                            {walletBalance >= service.price ? (
                              <Button 
                                onClick={() => handleBookService(service)}
                                className="flex-1"
                              >
                                Confirm Booking
                              </Button>
                            ) : (
                              <Button 
                                onClick={handleAddCoins}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Coins
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
            <Button onClick={() => {setSearchTerm(""); setSelectedCategory("all");}}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseServices;