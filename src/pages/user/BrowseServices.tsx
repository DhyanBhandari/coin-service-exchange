
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Search, Filter, Star, Building2, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BrowseServices = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<any>(null);
  const { toast } = useToast();

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
    // Simulate booking
    toast({
      title: "Service Booked!",
      description: `${service.title} has been booked for ${service.price} coins.`,
    });
    setSelectedService(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/dashboard/user" className="flex items-center text-gray-600 hover:text-blue-600 mr-6">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
              <div className="flex items-center space-x-2">
                <Building2 className="h-6 w-6 text-blue-600" />
                <span className="text-lg font-semibold">Browse Services</span>
              </div>
            </div>
            <Badge variant="secondary" className="hidden md:flex">
              <Coins className="h-4 w-4 mr-1" />
              Balance: 500 coins
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-200">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline">{service.category}</Badge>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">{service.rating}</span>
                    <span className="text-sm text-gray-400 ml-1">({service.reviews})</span>
                  </div>
                </div>
                <CardTitle className="text-lg">{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
                <div className="flex items-center text-sm text-gray-500 mt-2">
                  <Building2 className="h-4 w-4 mr-1" />
                  {service.organization}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Coins className="h-5 w-5 text-blue-600 mr-1" />
                    <span className="text-2xl font-bold text-blue-600">{service.price}</span>
                    <span className="text-gray-500 ml-1">coins</span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedService(service)}>Book Now</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{service.title}</DialogTitle>
                        <DialogDescription>
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

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-600">Total Cost</p>
                            <div className="flex items-center">
                              <Coins className="h-5 w-5 text-blue-600 mr-1" />
                              <span className="text-2xl font-bold text-blue-600">{service.price}</span>
                              <span className="text-gray-500 ml-1">coins</span>
                            </div>
                          </div>
                          <Button onClick={() => handleBookService(service)}>
                            Confirm Booking
                          </Button>
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
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseServices;
