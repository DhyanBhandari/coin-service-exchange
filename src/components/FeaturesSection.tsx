
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Shield, Users, Zap } from "lucide-react";

const FeaturesSection = () => {
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

  return (
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
  );
};

export default FeaturesSection;
