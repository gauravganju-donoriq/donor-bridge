import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, Shield, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Become a Bone Marrow Donor
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your donation could save a life. Join our program and make a difference for patients in need of bone marrow transplants.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/apply")}
            className="text-lg px-8 py-6"
          >
            Apply Now
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Save Lives</h3>
            <p className="text-muted-foreground">
              Your donation can give patients a second chance at life.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Safe Process</h3>
            <p className="text-muted-foreground">
              Our medical team ensures a safe and comfortable donation experience.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Quick Screening</h3>
            <p className="text-muted-foreground">
              Complete our pre-screening form in just a few minutes.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-muted-foreground mb-6">
            Start your pre-screening application today. The process takes only 5-10 minutes.
          </p>
          <Button onClick={() => navigate("/apply")}>
            Start Application
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
