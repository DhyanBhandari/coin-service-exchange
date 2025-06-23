
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Shield, Users, Zap, ArrowRight, Star, Home, Plane, Leaf, Laptop, Users2, Ticket } from "lucide-react";

const Index = () => {
  const [userType, setUserType] = useState<'user' | 'org' | null>(null);

  const features = [
    {
      icon: <Coins className="h-8 w-8 text-blue-600" />,
      title: "Digital Coin System",
      description: "Buy ErthaCoins and use them across multiple service providers seamlessly."
    },
    {
      icon: <Shield className="h-8 w-8 text-green-600" />,
      title: "Secure Transactions",
      description: "Your transactions are protected with enterprise-grade security measures."
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Global Network",
      description: "Access services from verified organizations worldwide in one platform."
    },
    {
      icon: <Zap className="h-8 w-8 text-orange-600" />,
      title: "Instant Payments",
      description: "Pay for services instantly with your digital coin balance."
    }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Coins className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">ErthaExchange</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6 text-sm">
            🚀 Launching the Future of Service Exchange
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Exchange <span className="text-blue-600">Digital Coins</span><br />
            for <span className="text-green-600">Global Services</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Join the revolutionary platform where you can buy ErthaCoins and access services 
            from verified organizations worldwide. Simple, secure, and seamless.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button size="lg" className="text-lg px-8 py-4">
                Start Exploring Services
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/services">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Browse Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose ErthaExchange?
            </h2>
            <p className="text-xl text-gray-600">
              Experience the future of service transactions
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow duration-300">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
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

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users and organizations already using ErthaExchange
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup?type=user">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                I'm a User
              </Button>
            </Link>
            <Link to="/signup?type=org">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600">
                I'm an Organization
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Coins className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold">ErthaExchange</span>
              </div>
              <p className="text-gray-400">
                The future of digital service exchange platform.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/services" className="hover:text-white">Browse Services</Link></li>
                <li><Link to="/signup" className="hover:text-white">Sign Up</Link></li>
                <li><Link to="/login" className="hover:text-white">Login</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">For Organizations</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/signup?type=org" className="hover:text-white">Partner with Us</Link></li>
                <li><a href="#" className="hover:text-white">API Documentation</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About Us</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ErthaExchange. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
