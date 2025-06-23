
import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, Send, ThumbsUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Feedback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const serviceName = searchParams.get('service') || 'Service';
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (starIndex: number) => {
    setRating(starIndex + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate feedback submission
    setTimeout(() => {
      toast({
        title: "Thank You!",
        description: "Your feedback has been submitted successfully",
      });

      setIsSubmitting(false);
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link to="/" className="flex items-center text-gray-600 hover:text-blue-600 mr-6">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Home
            </Link>
            <div className="flex items-center space-x-2">
              <ThumbsUp className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold">Feedback</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How was your experience?</h1>
          <p className="text-gray-600">We'd love to hear about your {serviceName} experience</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Share Your Feedback</CardTitle>
            <CardDescription>Your feedback helps us improve our services</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star Rating */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">
                  Rate your experience
                </label>
                <div className="flex items-center space-x-1">
                  {[0, 1, 2, 3, 4].map((starIndex) => (
                    <button
                      key={starIndex}
                      type="button"
                      onClick={() => handleStarClick(starIndex)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          starIndex < rating
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        } hover:text-yellow-400 transition-colors`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-gray-600">
                      {rating} out of 5 stars
                    </span>
                  )}
                </div>
              </div>

              {/* Written Feedback */}
              <div className="space-y-2">
                <label htmlFor="feedback" className="text-sm font-medium text-gray-700">
                  Tell us more about your experience (optional)
                </label>
                <Textarea
                  id="feedback"
                  placeholder="What did you like? What could we improve?"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Service Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-blue-900">Service:</span>
                  <span className="text-sm text-blue-800">{serviceName}</span>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  <Send className="h-4 w-4 mr-2" />
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/')}>
                  Skip for Now
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Thank You Message */}
        <div className="mt-8 text-center">
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Thank you for choosing our services!
            </h3>
            <p className="text-green-800">
              We hope you had a great experience with {serviceName}. 
              Your feedback helps us serve you better.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
