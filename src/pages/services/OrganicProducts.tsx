
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, ArrowLeft, Apple, Heart, Shield, Truck } from "lucide-react";

const OrganicProducts = () => {
  const features = [
    { icon: <Apple className="h-5 w-5" />, text: "100% certified organic produce" },
    { icon: <Heart className="h-5 w-5" />, text: "Health and wellness products" },
    { icon: <Shield className="h-5 w-5" />, text: "No harmful chemicals or pesticides" },
    { icon: <Truck className="h-5 w-5" />, text: "Fresh delivery within 24 hours" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="text-center mb-12">
          <Leaf className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Organic Products</h1>
          <Badge variant="outline" className="mb-4">Health</Badge>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Fresh organic food and wellness products sourced directly from certified organic farms and trusted suppliers.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Product Benefits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="text-emerald-600">{feature.icon}</div>
                  <span>{feature.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Categories</CardTitle>
              <CardDescription>Wide range of organic options</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Fresh Produce Box</span>
                  <span className="font-semibold text-emerald-600">50 Coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Wellness Package</span>
                  <span className="font-semibold text-emerald-600">75 Coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium Bundle</span>
                  <span className="font-semibold text-emerald-600">120 Coins</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link to="/payment?service=Organic Products&price=50">
            <Button size="lg" className="text-lg px-8 py-4">
              Order Organic Products Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrganicProducts;
