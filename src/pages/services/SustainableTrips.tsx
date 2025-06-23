
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plane, ArrowLeft, Leaf, Camera, Map, TreePine } from "lucide-react";

const SustainableTrips = () => {
  const features = [
    { icon: <Leaf className="h-5 w-5" />, text: "Carbon-neutral transportation" },
    { icon: <TreePine className="h-5 w-5" />, text: "Eco-friendly accommodations" },
    { icon: <Camera className="h-5 w-5" />, text: "Wildlife conservation experiences" },
    { icon: <Map className="h-5 w-5" />, text: "Local community engagement" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-green-600 hover:text-green-700 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="text-center mb-12">
          <Plane className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sustainable Trips</h1>
          <Badge variant="outline" className="mb-4">Travel</Badge>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Eco-friendly travel experiences that protect our planet while creating unforgettable memories and supporting local communities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Trip Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="text-green-600">{feature.icon}</div>
                  <span>{feature.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Trip Packages</CardTitle>
              <CardDescription>Choose your sustainable adventure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Weekend Getaway</span>
                  <span className="font-semibold text-green-600">250 Coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Week-long Adventure</span>
                  <span className="font-semibold text-green-600">800 Coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Extended Journey</span>
                  <span className="font-semibold text-green-600">1500 Coins</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link to="/payment?service=Sustainable Trips&price=250">
            <Button size="lg" className="text-lg px-8 py-4">
              Book Sustainable Trip Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SustainableTrips;
