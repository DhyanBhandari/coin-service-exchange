
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Star, Home, Plane, Leaf, Laptop, Users2, Ticket } from "lucide-react";

const ServicesSection = () => {
  const services = [
    { 
      name: "Living Spaces", 
      price: "100 Coins", 
      category: "Lifestyle", 
      rating: 4.9,
      icon: <Home className="h-6 w-6 text-blue-600" />,
      description: "Premium co-living and workspace solutions"
    },
    { 
      name: "Sustainable Trips", 
      price: "250 Coins", 
      category: "Travel", 
      rating: 4.8,
      icon: <Plane className="h-6 w-6 text-green-600" />,
      description: "Eco-friendly travel experiences and tours"
    },
    { 
      name: "Organic Products", 
      price: "50 Coins", 
      category: "Health", 
      rating: 4.7,
      icon: <Leaf className="h-6 w-6 text-emerald-600" />,
      description: "Fresh organic food and wellness products"
    },
    { 
      name: "Tech Services", 
      price: "150 Coins", 
      category: "Technology", 
      rating: 4.9,
      icon: <Laptop className="h-6 w-6 text-purple-600" />,
      description: "Web development and digital solutions"
    },
    { 
      name: "StartUp Circle Events", 
      price: "75 Coins", 
      category: "Networking", 
      rating: 4.8,
      icon: <Users2 className="h-6 w-6 text-orange-600" />,
      description: "Exclusive startup networking events"
    },
    { 
      name: "Event Passes", 
      price: "120 Coins", 
      category: "Entertainment", 
      rating: 4.6,
      icon: <Ticket className="h-6 w-6 text-pink-600" />,
      description: "Access to premium events and experiences"
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
            <Card key={index} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
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
                  <Button size="sm">Book Now</Button>
                </div>
              </CardContent>
            </Card>
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
