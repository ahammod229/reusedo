import { Button } from "@/shared/components/ui";
import { ArrowRight, RefreshCw, Shield, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

export function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Helmet>
        <title>Reusedo - Sustainable Local Exchange</title>
        <meta
          name="description"
          content="Exchange what you have for what you need. Join Reusedo to trade items locally, reduce waste, and save money in a sustainable community."
        />
      </Helmet>
      {/* Hero Section */}
      <section className="relative px-6 py-24 md:py-32 lg:py-40 bg-gradient-to-b from-primary/10 to-background overflow-hidden">
        <div className="mx-auto max-w-5xl text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground">
            Exchange What You <span className="text-primary">Have</span>{" "}
            <br className="hidden sm:block" />
            For What You <span className="text-primary">Need</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed">
            Join the community-driven platform where items find new homes. Reduce waste, save money,
            and connect with people nearby through sustainable exchanges.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto h-12 px-8 text-base shadow-lg hover:shadow-xl transition-all"
            >
              <Link to="/explore">
                Explore Items <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto h-12 px-8 text-base"
            >
              <Link to="/register">Create an Account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 px-6 bg-background">
        <div className="mx-auto max-w-6xl space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">How Reusedo Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A simple, secure, and sustainable way to trade items you no longer use.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">1. List Your Items</h3>
              <p className="text-muted-foreground">
                Take a photo, describe your item, and list what you're looking for in return. It
                takes less than a minute.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <RefreshCw className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">2. Find Matches</h3>
              <p className="text-muted-foreground">
                Browse available items or wait for others to propose an exchange for your listed
                products.
              </p>
            </div>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold">3. Exchange Securely</h3>
              <p className="text-muted-foreground">
                Chat securely, agree on terms, and complete your trade in person or via our trusted
                shipping partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to start exchanging?</h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Join thousands of users who are already trading items, saving money, and protecting the
            environment.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="h-12 px-8 text-base text-primary"
          >
            <Link to="/register">Get Started For Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
