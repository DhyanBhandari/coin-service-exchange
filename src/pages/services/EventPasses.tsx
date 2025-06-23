
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, ArrowLeft, Music, Star, Calendar, Gift } from "lucide-react";

const EventPasses = () => {
  const features = [
    { icon: <Music className="h-5 w-5" />, text: "Concerts and music festivals" },
    { icon: <Star className="h-5 w-5" />, text: "VIP and premium experiences" },
    { icon: <Calendar className="h-5 w-5" />, text: "Sports and entertainment events" },
    { icon: <Gift className="h-5 w-5" />, text: "Exclusive perks and merchandise" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-pink-600 hover:text-pink-700 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="text-center mb-12">
          <Ticket className="h-16 w-16 text-pink-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Passes</h1>
          <Badge variant="outline" className="mb-4">Entertainment</Badge>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Access to premium events and experiences including concerts, festivals, sports events, and exclusive entertainment.
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
                  <div className="text-pink-600">{feature.icon}</div>
                  <span>{feature.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pass Types</CardTitle>
              <CardDescription>Choose your experience level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>General Admission</span>
                  <span className="font-semibold text-pink-600">120 Coins</span>
                </div>
                <div className="flex justify-between">
                  <span>VIP Experience</span>
                  <span className="font-semibold text-pink-600">250 Coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Platinum Package</span>
                  <span className="font-semibold text-pink-600">500 Coins</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button size="lg" className="text-lg px-8 py-4">
            Get Event Pass Now
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EventPasses;
