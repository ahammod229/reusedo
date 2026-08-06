import { Building2, Globe, Heart, Shield, Users } from "lucide-react";
import { Link } from "react-router";

export const About = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">About Reusedo</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          We are on a mission to reduce waste, foster community, and make sustainable living
          accessible to everyone through our intelligent exchange platform.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold tracking-tight">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed">
            Reusedo (formerly Binimoy) started with a simple idea: what if the items collecting dust
            in one person's home are exactly what someone else is searching for? By connecting
            individuals who want to trade products and services, we're building a circular economy
            that benefits both our wallets and our planet.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Our platform goes beyond a simple marketplace. With our intelligent matching engine,
            advanced trust system, and seamless chat experience, we ensure that every exchange is
            secure, equitable, and delightful.
          </p>
        </div>
        <div className="bg-muted/30 p-8 rounded-2xl border border-border/50 grid grid-cols-2 gap-6">
          <div className="space-y-2 text-center p-4">
            <Users className="w-8 h-8 mx-auto text-primary" />
            <h3 className="font-bold text-2xl">50k+</h3>
            <p className="text-sm text-muted-foreground">Active Users</p>
          </div>
          <div className="space-y-2 text-center p-4">
            <Globe className="w-8 h-8 mx-auto text-primary" />
            <h3 className="font-bold text-2xl">100k+</h3>
            <p className="text-sm text-muted-foreground">Items Exchanged</p>
          </div>
          <div className="space-y-2 text-center p-4">
            <Building2 className="w-8 h-8 mx-auto text-primary" />
            <h3 className="font-bold text-2xl">24</h3>
            <p className="text-sm text-muted-foreground">Cities Supported</p>
          </div>
          <div className="space-y-2 text-center p-4">
            <Heart className="w-8 h-8 mx-auto text-primary" />
            <h3 className="font-bold text-2xl">1M+</h3>
            <p className="text-sm text-muted-foreground">Lbs of Waste Saved</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 pt-8 border-t">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Core Values</h2>
          <p className="text-muted-foreground">The principles that guide everything we build.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          <div className="space-y-3 p-6 border rounded-xl bg-card hover:shadow-md transition-shadow">
            <Shield className="w-10 h-10 text-primary" />
            <h3 className="font-semibold text-xl">Trust & Safety</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Every user is verified, and our reputation system ensures you always know who you are
              exchanging with.
            </p>
          </div>
          <div className="space-y-3 p-6 border rounded-xl bg-card hover:shadow-md transition-shadow">
            <Globe className="w-10 h-10 text-primary" />
            <h3 className="font-semibold text-xl">Sustainability</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We believe the most sustainable product is the one that already exists. Reusing is our
              primary goal.
            </p>
          </div>
          <div className="space-y-3 p-6 border rounded-xl bg-card hover:shadow-md transition-shadow">
            <Users className="w-10 h-10 text-primary" />
            <h3 className="font-semibold text-xl">Community First</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We empower local communities to connect, share resources, and help one another thrive.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 p-8 rounded-2xl text-center space-y-6">
        <h2 className="text-2xl font-bold">Ready to join the movement?</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Start exchanging items today. Clean out your closet, find what you need, and meet your
          neighbors.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Sign Up Now
          </Link>
          <Link
            to="/explore"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            Explore Items
          </Link>
        </div>
      </div>
    </div>
  );
};
