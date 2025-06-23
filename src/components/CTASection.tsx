
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
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
  );
};

export default CTASection;
