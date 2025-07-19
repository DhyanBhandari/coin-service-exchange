// src/pages/user/BrowseServices.tsx - Complete corrected component
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Search, Filter, Star, Building2, Coins, Home, Plus, Wallet, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/contexts/UserDataContext";
import { api } from "@/lib/api";

interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  organizationId: string;
  organizationName?: string;
  rating?: number;
  reviewCount?: number;
  bookingCount?: number;
  status: string;
  features?: string[];
  images?: string[];
  tags?: string[];
  duration?: string;
  createdAt: string;
}

const BrowseServices = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { userData } = useAuth();
  const { bookService, userStats, refreshUserData } = useUserData();
  const navigate = useNavigate();

  // Get wallet balance from userData with fallback
  const walletBalance = userData?.walletBalance || 0;

  const categories = [
    { id: "all", name: "All Services" },
    { id: "technology", name: "Technology" },
    { id: "business", name: "Business" },
    { id: "creative", name: "Creative" },
    { id: "design", name: "Design" },
    { id: "marketing", name: "Marketing" },
    { id: "consulting", name: "Consulting" },
    { id: "lifestyle", name: "Lifestyle" },
    { id: "travel", name: "Travel" },
    { id: "health", name: "Health" },
    { id: "entertainment", name: "Entertainment" },
    { id: "education", name: "Education" }
  ];

  // Enhanced demo services for fallback
  const getDemoServices = (): Service[] => [
    // Technology Services
    {
      id: "1",
      title: "Professional Website Development",
      description: "Custom website development with modern technologies including React, Node.js, and responsive design. Perfect for businesses looking to establish a strong online presence.",
      price: 299,
      category: "technology",
      organizationId: "org1",
      organizationName: "TechCorp Solutions",
      rating: 4.9,
      reviewCount: 156,
      bookingCount: 89,
      status: "active",
      features: ["Responsive Design", "SEO Optimized", "Modern Framework", "24/7 Support", "SSL Certificate"],
      images: ["https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400"],
      tags: ["website", "development", "responsive", "modern"],
      duration: "2-4 weeks",
      createdAt: new Date().toISOString()
    },
    {
      id: "5",
      title: "Mobile App Development",
      description: "Native and cross-platform mobile application development for iOS and Android with modern UI/UX design and robust backend integration.",
      price: 499,
      category: "technology",
      organizationId: "org5",
      organizationName: "AppDev Studios",
      rating: 4.8,
      reviewCount: 98,
      bookingCount: 78,
      status: "active",
      features: ["iOS & Android", "Modern UI/UX", "API Integration", "App Store Deployment", "Maintenance"],
      images: ["https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400"],
      tags: ["mobile", "app", "ios", "android"],
      duration: "6-8 weeks",
      createdAt: new Date().toISOString()
    },
    {
      id: "15",
      title: "AI Chatbot Development",
      description: "Custom AI-powered chatbots for customer service, lead generation, and automated support with natural language processing capabilities.",
      price: 350,
      category: "technology",
      organizationId: "org15",
      organizationName: "AI Solutions Hub",
      rating: 4.7,
      reviewCount: 67,
      bookingCount: 45,
      status: "active",
      features: ["Natural Language Processing", "24/7 Support", "Multi-platform Integration", "Analytics Dashboard", "Custom Training"],
      images: ["https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400"],
      tags: ["ai", "chatbot", "automation", "nlp"],
      duration: "3-5 weeks",
      createdAt: new Date().toISOString()
    },

    // Lifestyle Services
    {
      id: "7",
      title: "Premium Co-Living Spaces",
      description: "Modern co-living spaces with high-speed internet, community areas, and prime locations. Perfect for young professionals and entrepreneurs.",
      price: 100,
      category: "lifestyle",
      organizationId: "org7",
      organizationName: "Urban Living Co.",
      rating: 4.9,
      reviewCount: 203,
      bookingCount: 156,
      status: "active",
      features: ["High-speed WiFi", "Community Areas", "Prime Location", "All Utilities Included", "24/7 Security"],
      images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400"],
      tags: ["coliving", "accommodation", "community", "modern"],
      duration: "Monthly subscription",
      createdAt: new Date().toISOString()
    },
    {
      id: "16",
      title: "Personal Fitness Training",
      description: "Personalized fitness coaching with custom workout plans, nutrition guidance, and progress tracking to help you achieve your health goals.",
      price: 85,
      category: "lifestyle",
      organizationId: "org16",
      organizationName: "FitLife Coaches",
      rating: 4.8,
      reviewCount: 134,
      bookingCount: 98,
      status: "active",
      features: ["Custom Workout Plans", "Nutrition Guidance", "Progress Tracking", "One-on-One Sessions", "Mobile App Access"],
      images: ["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400"],
      tags: ["fitness", "health", "personal-training", "wellness"],
      duration: "4 weeks program",
      createdAt: new Date().toISOString()
    },

    // Travel Services
    {
      id: "8",
      title: "Eco-Friendly Travel Packages",
      description: "Sustainable travel experiences with carbon-neutral transportation, eco-friendly accommodations, and local community engagement.",
      price: 250,
      category: "travel",
      organizationId: "org8",
      organizationName: "GreenTravel Co.",
      rating: 4.8,
      reviewCount: 89,
      bookingCount: 67,
      status: "active",
      features: ["Carbon Neutral", "Eco Accommodations", "Local Experiences", "Wildlife Conservation", "Cultural Immersion"],
      images: ["https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400"],
      tags: ["eco-travel", "sustainable", "nature", "adventure"],
      duration: "5-7 days",
      createdAt: new Date().toISOString()
    },
    {
      id: "17",
      title: "Adventure Photography Tours",
      description: "Professional photography tours to stunning locations with expert guidance on landscape, wildlife, and travel photography techniques.",
      price: 180,
      category: "travel",
      organizationId: "org17",
      organizationName: "Lens Adventures",
      rating: 4.9,
      reviewCount: 76,
      bookingCount: 54,
      status: "active",
      features: ["Professional Guide", "Photography Workshops", "Equipment Provided", "Photo Editing Tips", "Portfolio Review"],
      images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400"],
      tags: ["photography", "adventure", "workshop", "nature"],
      duration: "3 days",
      createdAt: new Date().toISOString()
    },

    // Health Services
    {
      id: "9",
      title: "Organic Product Delivery",
      description: "Fresh organic produce and wellness products delivered to your doorstep. 100% certified organic with farm-to-table freshness guaranteed.",
      price: 50,
      category: "health",
      organizationId: "org9",
      organizationName: "Pure Harvest Organics",
      rating: 4.7,
      reviewCount: 234,
      bookingCount: 189,
      status: "active",
      features: ["100% Certified Organic", "Farm Fresh", "Weekly Delivery", "Seasonal Varieties", "Nutrition Consultation"],
      images: ["https://images.unsplash.com/photo-1542838132-92c53300491e?w=400"],
      tags: ["organic", "health", "delivery", "fresh"],
      duration: "Weekly delivery",
      createdAt: new Date().toISOString()
    },
    {
      id: "18",
      title: "Mental Wellness Coaching",
      description: "Professional mental wellness coaching with mindfulness techniques, stress management, and personal development strategies.",
      price: 120,
      category: "health",
      organizationId: "org18",
      organizationName: "MindfulLife Coaching",
      rating: 4.9,
      reviewCount: 167,
      bookingCount: 123,
      status: "active",
      features: ["One-on-One Sessions", "Mindfulness Training", "Stress Management", "Goal Setting", "Progress Tracking"],
      images: ["https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400"],
      tags: ["wellness", "mental-health", "coaching", "mindfulness"],
      duration: "6 weeks program",
      createdAt: new Date().toISOString()
    },

    // Entertainment Services
    {
      id: "10",
      title: "Premium Event Passes",
      description: "VIP access to concerts, festivals, sports events, and exclusive entertainment experiences. Skip the lines and enjoy premium amenities.",
      price: 120,
      category: "entertainment",
      organizationId: "org10",
      organizationName: "Elite Events Access",
      rating: 4.6,
      reviewCount: 145,
      bookingCount: 98,
      status: "active",
      features: ["VIP Access", "Premium Seating", "Exclusive Lounges", "Meet & Greet", "Complimentary Refreshments"],
      images: ["https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400"],
      tags: ["vip", "events", "entertainment", "exclusive"],
      duration: "Event duration",
      createdAt: new Date().toISOString()
    },
    {
      id: "19",
      title: "Virtual Reality Gaming Experience",
      description: "Immersive VR gaming sessions with the latest technology, multiplayer experiences, and a wide variety of games and simulations.",
      price: 45,
      category: "entertainment",
      organizationId: "org19",
      organizationName: "VR World Gaming",
      rating: 4.8,
      reviewCount: 92,
      bookingCount: 156,
      status: "active",
      features: ["Latest VR Technology", "Multiplayer Games", "Private Rooms", "Game Variety", "Professional Setup"],
      images: ["https://images.unsplash.com/photo-1592478411213-6153e4ebc696?w=400"],
      tags: ["vr", "gaming", "technology", "experience"],
      duration: "2-4 hours",
      createdAt: new Date().toISOString()
    },

    // Marketing Services
    {
      id: "2",
      title: "Complete Digital Marketing Strategy",
      description: "Comprehensive digital marketing package including social media management, SEO optimization, content creation, and analytics tracking to boost your online presence.",
      price: 199,
      category: "marketing",
      organizationId: "org2",
      organizationName: "MarketPro Agency",
      rating: 4.8,
      reviewCount: 89,
      bookingCount: 67,
      status: "active",
      features: ["Social Media Management", "SEO Optimization", "Content Creation", "Analytics Dashboard", "Monthly Reports"],
      images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400"],
      tags: ["marketing", "seo", "social-media", "content"],
      duration: "1 month",
      createdAt: new Date().toISOString()
    },
    {
      id: "6",
      title: "SEO-Optimized Content Writing",
      description: "Professional content writing services for websites, blogs, and marketing materials with SEO optimization to improve your search rankings.",
      price: 79,
      category: "marketing",
      organizationId: "org6",
      organizationName: "WordCraft Agency",
      rating: 4.6,
      reviewCount: 145,
      bookingCount: 234,
      status: "active",
      features: ["SEO Optimized", "Research-based", "Multiple Revisions", "Quick Delivery", "Plagiarism Free"],
      images: ["https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400"],
      tags: ["content", "writing", "seo", "blog"],
      duration: "3-5 days",
      createdAt: new Date().toISOString()
    },

    // Design Services
    {
      id: "3",
      title: "Professional Brand Identity Design",
      description: "Complete brand identity package including logo design, color palette, typography, business cards, and brand guidelines to establish your professional image.",
      price: 149,
      category: "design",
      organizationId: "org3",
      organizationName: "Creative Studio Pro",
      rating: 4.7,
      reviewCount: 234,
      bookingCount: 156,
      status: "active",
      features: ["Logo Design", "Brand Guidelines", "Business Cards", "Color Palette", "Typography", "Vector Files"],
      images: ["https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400"],
      tags: ["design", "branding", "logo", "identity"],
      duration: "1-2 weeks",
      createdAt: new Date().toISOString()
    },
    {
      id: "20",
      title: "UI/UX Design for Mobile Apps",
      description: "Complete UI/UX design service for mobile applications with user research, wireframing, prototyping, and high-fidelity designs.",
      price: 225,
      category: "design",
      organizationId: "org20",
      organizationName: "Design Innovators",
      rating: 4.9,
      reviewCount: 78,
      bookingCount: 56,
      status: "active",
      features: ["User Research", "Wireframing", "Prototyping", "High-fidelity Design", "Design System", "Usability Testing"],
      images: ["https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400"],
      tags: ["ui", "ux", "mobile", "design", "prototype"],
      duration: "3-4 weeks",
      createdAt: new Date().toISOString()
    },

    // Business & Consulting Services
    {
      id: "4",
      title: "Business Growth Consulting",
      description: "Strategic business consulting focused on growth, market analysis, competitive positioning, and actionable strategies to scale your business effectively.",
      price: 249,
      category: "consulting",
      organizationId: "org4",
      organizationName: "BizConsult Pro",
      rating: 4.9,
      reviewCount: 67,
      bookingCount: 45,
      status: "active",
      features: ["Market Analysis", "Growth Strategy", "Competitive Analysis", "Financial Planning", "Implementation Support"],
      images: ["https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400"],
      tags: ["consulting", "business", "growth", "strategy"],
      duration: "2-3 weeks",
      createdAt: new Date().toISOString()
    },
    {
      id: "11",
      title: "Startup Networking Events",
      description: "Exclusive networking events for entrepreneurs, investors, and innovators. Build valuable connections and discover new opportunities in the startup ecosystem.",
      price: 75,
      category: "business",
      organizationId: "org11",
      organizationName: "StartupHub Network",
      rating: 4.8,
      reviewCount: 156,
      bookingCount: 123,
      status: "active",
      features: ["Industry Leaders", "Investor Meetups", "Pitch Sessions", "Workshop Access", "Networking Dinner"],
      images: ["https://images.unsplash.com/photo-1511578314322-379afb476865?w=400"],
      tags: ["networking", "startup", "business", "events"],
      duration: "Full day event",
      createdAt: new Date().toISOString()
    },
    {
      id: "21",
      title: "Financial Planning & Analysis",
      description: "Comprehensive financial planning services including budgeting, investment advice, retirement planning, and financial goal setting.",
      price: 175,
      category: "business",
      organizationId: "org21",
      organizationName: "WealthWise Advisors",
      rating: 4.7,
      reviewCount: 89,
      bookingCount: 67,
      status: "active",
      features: ["Budget Planning", "Investment Strategy", "Retirement Planning", "Tax Optimization", "Financial Goals"],
      images: ["https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400"],
      tags: ["finance", "planning", "investment", "consulting"],
      duration: "2-3 weeks",
      createdAt: new Date().toISOString()
    },

    // Creative Services
    {
      id: "12",
      title: "Professional Video Production",
      description: "High-quality video production services for marketing, events, and corporate communications with professional equipment and editing.",
      price: 320,
      category: "creative",
      organizationId: "org12",
      organizationName: "VideoVision Studios",
      rating: 4.9,
      reviewCount: 78,
      bookingCount: 54,
      status: "active",
      features: ["4K Recording", "Professional Editing", "Color Grading", "Audio Enhancement", "Motion Graphics"],
      images: ["https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400"],
      tags: ["video", "production", "editing", "creative"],
      duration: "1-3 weeks",
      createdAt: new Date().toISOString()
    },
    {
      id: "22",
      title: "Photography Portfolio Service",
      description: "Professional photography services for portraits, events, products, and commercial use with high-resolution images and editing.",
      price: 140,
      category: "creative",
      organizationId: "org22",
      organizationName: "Capture Moments Studio",
      rating: 4.8,
      reviewCount: 167,
      bookingCount: 134,
      status: "active",
      features: ["Professional Equipment", "Multiple Locations", "High-res Images", "Photo Editing", "Quick Delivery"],
      images: ["https://images.unsplash.com/photo-1471341971476-ae15ff5dd4ea?w=400"],
      tags: ["photography", "portrait", "commercial", "editing"],
      duration: "1-2 days",
      createdAt: new Date().toISOString()
    },

    // Education Services
    {
      id: "13",
      title: "Coding Bootcamp - Full Stack",
      description: "Intensive full-stack web development bootcamp covering modern technologies like React, Node.js, databases, and deployment strategies.",
      price: 450,
      category: "education",
      organizationId: "org13",
      organizationName: "CodeAcademy Pro",
      rating: 4.9,
      reviewCount: 234,
      bookingCount: 178,
      status: "active",
      features: ["Live Instruction", "Hands-on Projects", "Career Support", "Certification", "Job Placement Assistance"],
      images: ["https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400"],
      tags: ["coding", "bootcamp", "fullstack", "education"],
      duration: "12 weeks",
      createdAt: new Date().toISOString()
    },
    {
      id: "23",
      title: "Language Learning Program",
      description: "Comprehensive language learning program with native speakers, interactive lessons, and cultural immersion activities.",
      price: 95,
      category: "education",
      organizationId: "org23",
      organizationName: "LinguaWorld Academy",
      rating: 4.7,
      reviewCount: 145,
      bookingCount: 198,
      status: "active",
      features: ["Native Speakers", "Interactive Lessons", "Cultural Activities", "Progress Tracking", "Flexible Schedule"],
      images: ["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400"],
      tags: ["language", "learning", "education", "culture"],
      duration: "8 weeks",
      createdAt: new Date().toISOString()
    },

    // Additional Premium Services
    {
      id: "14",
      title: "Legal Document Review",
      description: "Professional legal document review and consultation services for contracts, agreements, and business documentation.",
      price: 180,
      category: "consulting",
      organizationId: "org14",
      organizationName: "LegalEase Partners",
      rating: 4.8,
      reviewCount: 89,
      bookingCount: 67,
      status: "active",
      features: ["Contract Review", "Legal Consultation", "Document Drafting", "Compliance Check", "Risk Assessment"],
      images: ["https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400"],
      tags: ["legal", "consulting", "contracts", "business"],
      duration: "3-5 days",
      createdAt: new Date().toISOString()
    },
    {
      id: "24",
      title: "Personal Stylist & Shopping",
      description: "Personal styling service with wardrobe consultation, shopping assistance, and style makeover for any occasion or budget.",
      price: 110,
      category: "lifestyle",
      organizationId: "org24",
      organizationName: "StyleSavvy Consultants",
      rating: 4.6,
      reviewCount: 123,
      bookingCount: 89,
      status: "active",
      features: ["Wardrobe Analysis", "Personal Shopping", "Style Consultation", "Color Analysis", "Occasion Styling"],
      images: ["https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400"],
      tags: ["styling", "fashion", "personal", "shopping"],
      duration: "1 day session",
      createdAt: new Date().toISOString()
    }
  ];

  // Fetch services from backend with proper error handling
  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      params.append('status', 'active');
      params.append('limit', '50');

      const response = await api.services.getAll(params);
      
      if (response.success && response.data) {
        // Ensure response.data is an array before setting
        const servicesData = Array.isArray(response.data) ? response.data : [];
        setServices(servicesData as Service[]);
      } else {
        console.warn('Invalid response structure, using demo data');
        setServices(getDemoServices());
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      // Fallback to demo data
      setServices(getDemoServices());
    } finally {
      setLoading(false);
    }
  };

  // Load services on component mount and when filters change
  useEffect(() => {
    fetchServices();
  }, [searchTerm, selectedCategory]);

  // Check if user has already booked a service
  const isServiceBooked = (serviceId: string) => {
    if (!Array.isArray(userStats.activeBookings)) {
      return false;
    }
    return userStats.activeBookings.some(booking => 
      booking.serviceId === serviceId && booking.status === 'active'
    );
  };

  const handleBookService = async (service: Service) => {
    setIsBooking(true);
    
    try {
      const success = await bookService({
        id: service.id,
        title: service.title,
        price: service.price,
        organization: service.organizationName || 'Unknown'
      });
      
      if (success) {
        toast({
          title: "Service Booked Successfully!",
          description: `${service.title} has been booked for ${service.price} coins.`,
        });
        setSelectedService(null);
        // Refresh data
        await refreshUserData();
      } else {
        toast({
          title: "Booking Failed",
          description: "Insufficient balance or booking error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Booking Error",
        description: "An error occurred while booking the service.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const handleAddCoins = () => {
    navigate('/wallet/add');
  };

  const getCategoryBadgeColor = (category: string) => {
    const colors: Record<string, string> = {
      technology: 'bg-blue-100 text-blue-800',
      design: 'bg-purple-100 text-purple-800',
      marketing: 'bg-green-100 text-green-800',
      consulting: 'bg-orange-100 text-orange-800',
      business: 'bg-indigo-100 text-indigo-800',
      creative: 'bg-pink-100 text-pink-800',
      lifestyle: 'bg-emerald-100 text-emerald-800',
      travel: 'bg-cyan-100 text-cyan-800',
      health: 'bg-green-100 text-green-800',
      entertainment: 'bg-red-100 text-red-800',
      education: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
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

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading services...</span>
          </div>
        )}

        {/* Services Grid */}
        {!loading && Array.isArray(services) && services.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const isBooked = isServiceBooked(service.id);
              const insufficientBalance = walletBalance < service.price;
              
              return (
                <Card key={service.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200">
                  <div className="aspect-video bg-gray-200 relative">
                    <img 
                      src={service.images?.[0] || `https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400`}
                      alt={service.title}
                      className="w-full h-full object-cover"
                    />
                    {isBooked && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-green-500 text-white">
                          Booked
                        </Badge>
                      </div>
                    )}
                    {!isBooked && insufficientBalance && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="destructive" className="bg-red-500">
                          Insufficient Balance
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getCategoryBadgeColor(service.category)}>
                        {service.category}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{service.rating || 4.5}</span>
                        <span className="text-xs text-gray-400">({service.reviewCount || 0})</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-tight">{service.title}</CardTitle>
                    <CardDescription className="text-sm line-clamp-2">{service.description}</CardDescription>
                    <div className="flex items-center text-sm text-gray-500 mt-2">
                      <Building2 className="h-4 w-4 mr-1" />
                      {service.organizationName || 'Organization'}
                    </div>
                    {service.duration && (
                      <p className="text-xs text-blue-600 mt-1">Duration: {service.duration}</p>
                    )}
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
                            disabled={isBooked}
                            className={
                              isBooked 
                                ? "bg-green-100 text-green-800 cursor-not-allowed" 
                                : insufficientBalance 
                                  ? "opacity-50 cursor-not-allowed" 
                                  : ""
                            }
                          >
                            {isBooked ? "Already Booked" : insufficientBalance ? "Need More Coins" : "Book Now"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-xl">{service.title}</DialogTitle>
                            <DialogDescription className="text-base">
                              by {service.organizationName || 'Organization'}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <img 
                              src={service.images?.[0] || `https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400`}
                              alt={service.title}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                            <p className="text-gray-700">{service.description}</p>
                            
                            {service.features && service.features.length > 0 && (
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
                            )}

                            {service.duration && (
                              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <p className="text-blue-800 text-sm font-medium">
                                  Service Duration: {service.duration}
                                </p>
                                <p className="text-blue-700 text-xs mt-1">
                                  This service will be completed within the specified timeframe.
                                </p>
                              </div>
                            )}

                            {/* Reviews and Rating */}
                            {service.rating && (
                              <div className="bg-gray-50 p-3 rounded border">
                                <div className="flex items-center space-x-2">
                                  <div className="flex items-center">
                                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                                    <span className="text-lg font-bold ml-1">{service.rating}</span>
                                    <span className="text-gray-500 ml-1">/ 5</span>
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    ({service.reviewCount || 0} reviews)
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    • {service.bookingCount || 0} bookings
                                  </span>
                                </div>
                              </div>
                            )}

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

                              {isBooked && (
                                <div className="bg-green-50 p-3 rounded border border-green-200">
                                  <p className="text-green-800 text-sm font-medium">
                                    ✅ You have already booked this service!
                                  </p>
                                </div>
                              )}

                              {!isBooked && insufficientBalance && (
                                <div className="bg-red-50 p-3 rounded border border-red-200">
                                  <p className="text-red-800 text-sm font-medium">
                                    You need {service.price - walletBalance} more coins to book this service.
                                  </p>
                                </div>
                              )}

                              <div className="flex space-x-2">
                                {!isBooked && walletBalance >= service.price ? (
                                  <Button 
                                    onClick={() => handleBookService(service)}
                                    className="flex-1"
                                    disabled={isBooking}
                                  >
                                    {isBooking ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Booking...
                                      </>
                                    ) : (
                                      "Confirm Booking"
                                    )}
                                  </Button>
                                ) : !isBooked ? (
                                  <Button 
                                    onClick={handleAddCoins}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Coins
                                  </Button>
                                ) : (
                                  <Button 
                                    className="flex-1 bg-green-100 text-green-800 cursor-not-allowed"
                                    disabled
                                  >
                                    Already Booked
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
              );
            })}
          </div>
        )}

        {/* No services found */}
        {!loading && (!Array.isArray(services) || services.length === 0) && (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
            <Button onClick={() => {setSearchTerm(""); setSelectedCategory("all");}}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Service Stats */}
        {!loading && Array.isArray(services) && services.length > 0 && (
          <div className="mt-12 bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Service Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{services.length}</p>
                <p className="text-sm text-blue-700">Available Services</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {services.reduce((sum, s) => sum + (s.bookingCount || 0), 0)}
                </p>
                <p className="text-sm text-green-700">Total Bookings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round((services.reduce((sum, s) => sum + (s.rating || 0), 0) / services.length) * 10) / 10}
                </p>
                <p className="text-sm text-purple-700">Average Rating</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {Array.isArray(userStats.activeBookings) ? userStats.activeBookings.length : 0}
                </p>
                <p className="text-sm text-orange-700">Your Active Services</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseServices;