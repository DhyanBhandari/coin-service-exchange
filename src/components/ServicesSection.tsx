
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ArrowRight, Star, Home, Plane, Leaf, Laptop, Users2, Ticket } from "lucide-react";

const ServicesSection = () => {
  const services = [
    { 
      name: "Living Spaces", 
      price: "100 Coins", 
      category: "Lifestyle", 
      rating: 4.9,
      icon: <Home className="h-6 w-6 text-blue-600" />,
      description: "Premium co-living and workspace solutions",
      link: "/services/living-spaces",
      details: "Modern co-living spaces with high-speed internet, community areas, and prime locations in major cities."
    },
    { 
      name: "Sustainable Trips", 
      price: "250 Coins", 
      category: "Travel", 
      rating: 4.8,
      icon: <Plane className="h-6 w-6 text-green-600" />,
      description: "Eco-friendly travel experiences and tours",
      link: "/services/sustainable-trips",
      details: "Carbon-neutral travel experiences with eco-friendly accommodations and local community engagement."
    },
    { 
      name: "Organic Products", 
      price: "50 Coins", 
      category: "Health", 
      rating: 4.7,
      icon: <Leaf className="h-6 w-6 text-emerald-600" />,
      description: "Fresh organic food and wellness products",
      link: "/services/organic-products",
      details: "100% certified organic produce and wellness products delivered fresh within 24 hours."
    },
    { 
      name: "Tech Services", 
      price: "150 Coins", 
      category: "Technology", 
      rating: 4.9,
      icon: <Laptop className="h-6 w-6 text-purple-600" />,
      description: "Web development and digital solutions",
      link: "/services/tech-services",
      details: "Professional web development, mobile apps, and digital marketing solutions for your business."
    },
    { 
      name: "StartUp Circle Events", 
      price: "75 Coins", 
      category: "Networking", 
      rating: 4.8,
      icon: <Users2 className="h-6 w-6 text-orange-600" />,
      description: "Exclusive startup networking events",
      link: "/services/startup-events",
      details: "Connect with entrepreneurs, investors, and innovators at exclusive networking events and workshops."
    },
    { 
      name: "Event Passes", 
      price: "120 Coins", 
      category: "Entertainment", 
      rating: 4.6,
      icon: <Ticket className="h-6 w-6 text-pink-600" />,
      description: "Access to premium events and experiences",
      link: "/services/event-passes",
      details: "VIP access to concerts, festivals, sports events, and exclusive entertainment experiences."
    }
  ];

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Our Services
          </h2>
          <p className="text-xl text-gray-600">
            Discover amazing services from sustainable living to tech solutions
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <HoverCard key={index}>
              <HoverCardTrigger asChild>
                <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline">{service.category}</Badge>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">{service.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 mb-2">
                      {service.icon}
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </div>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">{service.price}</span>
                      <Button size="sm">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              </HoverCardTrigger>
              <HoverCardContent className="w-80">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    {service.icon}
                    <div>
                      <h4 className="text-lg font-semibold">{service.name}</h4>
                      <Badge variant="outline" className="text-xs">{service.category}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{service.details}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-blue-600">{service.price}</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{service.rating}</span>
                    </div>
                  </div>
                  <Link to={service.link}>
                    <Button className="w-full">
                      Book Now
                    </Button>
                  </Link>
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
        <div className="text-center mt-12">
          <Link to="/services">
            <Button size="lg" variant="outline">
              View All Services
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
