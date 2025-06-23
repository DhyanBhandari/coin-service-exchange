
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Laptop, ArrowLeft, Code, Smartphone, Globe, Zap } from "lucide-react";

const TechServices = () => {
  const features = [
    { icon: <Code className="h-5 w-5" />, text: "Custom web development" },
    { icon: <Smartphone className="h-5 w-5" />, text: "Mobile app development" },
    { icon: <Globe className="h-5 w-5" />, text: "Digital marketing solutions" },
    { icon: <Zap className="h-5 w-5" />, text: "Cloud infrastructure setup" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="text-center mb-12">
          <Laptop className="h-16 w-16 text-purple-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tech Services</h1>
          <Badge variant="outline" className="mb-4">Technology</Badge>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Professional web development and digital solutions to help your business thrive in the digital age.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Our Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="text-purple-600">{feature.icon}</div>
                  <span>{feature.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Packages</CardTitle>
              <CardDescription>Tailored solutions for every need</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Basic Website</span>
                  <span className="font-semibold text-purple-600">150 Coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Full-Stack Application</span>
                  <span className="font-semibold text-purple-600">500 Coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Enterprise Solution</span>
                  <span className="font-semibold text-purple-600">1000 Coins</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link to="/payment?service=Tech Services&price=150">
            <Button size="lg" className="text-lg px-8 py-4">
              Get Tech Services Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TechServices;
