import { ArrowRight, HelpCircle, MessageSquare, Package, Search, Shield } from "lucide-react";
import { Link } from "react-router";

export const Help = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">How can we help?</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Search our knowledge base or browse categories below to find answers to your questions.
        </p>

        <div className="max-w-2xl mx-auto relative">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search for articles, guides, or keywords..."
              className="flex h-14 w-full rounded-full border border-input bg-background pl-12 pr-4 text-base shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
        <Link
          to="#"
          className="group p-6 rounded-2xl border bg-card hover:shadow-md transition-all space-y-4 flex flex-col items-start"
        >
          <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Getting Started</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Creating an account, setting up your profile, and verifying identity.
            </p>
          </div>
        </Link>

        <Link
          to="#"
          className="group p-6 rounded-2xl border bg-card hover:shadow-md transition-all space-y-4 flex flex-col items-start"
        >
          <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Exchanges</h3>
            <p className="text-sm text-muted-foreground mt-1">
              How to propose trades, negotiate, and complete exchanges.
            </p>
          </div>
        </Link>

        <Link
          to="#"
          className="group p-6 rounded-2xl border bg-card hover:shadow-md transition-all space-y-4 flex flex-col items-start"
        >
          <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Trust & Safety</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Understanding trust scores, reporting users, and our policies.
            </p>
          </div>
        </Link>

        <Link
          to="#"
          className="group p-6 rounded-2xl border bg-card hover:shadow-md transition-all space-y-4 flex flex-col items-start"
        >
          <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Communication</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Guidelines for using the chat, notifications, and inbox.
            </p>
          </div>
        </Link>
      </div>

      {/* FAQ Section */}
      <div className="pt-12">
        <h2 className="text-2xl font-bold tracking-tight mb-8">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-semibold text-lg">Is Reusedo completely free to use?</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Yes, listing items and initiating exchanges is completely free. We may introduce
              premium features in the future, but the core community exchange functionality will
              always remain free.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-lg">How does the Trust Score work?</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your trust score is calculated based on successful exchanges, verification status, and
              reviews from other users. A higher score means you are a reliable community member.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-lg">What happens if an exchange goes wrong?</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              If an item is not as described or a user doesn't follow through, you can open a
              dispute. Our moderation team will review the chat logs and take appropriate action.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-lg">How do I verify my account?</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              You can verify your account by going to Settings &gt; Security and submitting a valid
              government ID or connecting verified social accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Still need help CTA */}
      <div className="bg-muted p-8 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-6 mt-12">
        <div>
          <h3 className="text-xl font-bold">Still need help?</h3>
          <p className="text-muted-foreground">Our support team is always ready to assist you.</p>
        </div>
        <Link
          to="/contact"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Contact Support <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
