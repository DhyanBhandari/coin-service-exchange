
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, ArrowLeft, MapPin, Users, Wifi, Car } from "lucide-react";

const LivingSpaces = () => {
  const features = [
    { icon: <MapPin className="h-5 w-5" />, text: "Prime locations in major cities" },
    { icon: <Users className="h-5 w-5" />, text: "Community of like-minded professionals" },
    { icon: <Wifi className="h-5 w-5" />, text: "High-speed internet and workspaces" },
    { icon: <Car className="h-5 w-5" />, text: "Parking and transportation access" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="text-center mb-12">
          <Home className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Living Spaces</h1>
          <Badge variant="outline" className="mb-4">Lifestyle</Badge>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Premium co-living and workspace solutions designed for modern professionals who value community, convenience, and comfort.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>What's Included</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="text-blue-600">{feature.icon}</div>
                  <span>{feature.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
              <CardDescription>Flexible options for every need</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Monthly Stay</span>
                  <span className="font-semibold text-blue-600">100 Coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Weekly Stay</span>
                  <span className="font-semibold text-blue-600">30 Coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Stay</span>
                  <span className="font-semibold text-blue-600">5 Coins</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button size="lg" className="text-lg px-8 py-4">
            Book Living Space Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LivingSpaces;
