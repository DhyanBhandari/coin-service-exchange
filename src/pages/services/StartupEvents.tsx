
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users2, ArrowLeft, Network, Lightbulb, Handshake, Trophy } from "lucide-react";

const StartupEvents = () => {
  const features = [
    { icon: <Network className="h-5 w-5" />, text: "Connect with fellow entrepreneurs" },
    { icon: <Lightbulb className="h-5 w-5" />, text: "Innovation workshops and talks" },
    { icon: <Handshake className="h-5 w-5" />, text: "Investor meetups and pitch sessions" },
    { icon: <Trophy className="h-5 w-5" />, text: "Startup competitions and awards" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="text-center mb-12">
          <Users2 className="h-16 w-16 text-orange-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">StartUp Circle Events</h1>
          <Badge variant="outline" className="mb-4">Networking</Badge>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Exclusive startup networking events designed to connect entrepreneurs, investors, and innovators in a collaborative environment.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Event Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="text-orange-600">{feature.icon}</div>
                  <span>{feature.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Types</CardTitle>
              <CardDescription>Various networking opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Monthly Meetup</span>
                  <span className="font-semibold text-orange-600">75 Coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Workshop Session</span>
                  <span className="font-semibold text-orange-600">100 Coins</span>
                </div>
                <div className="flex justify-between">
                  <span>Annual Conference</span>
                  <span className="font-semibold text-orange-600">300 Coins</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link to="/payment?service=StartUp Circle Events&price=75">
            <Button size="lg" className="text-lg px-8 py-4">
              Join StartUp Circle Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StartupEvents;
