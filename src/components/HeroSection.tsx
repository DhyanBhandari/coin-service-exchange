
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
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
  );
};

export default HeroSection;
