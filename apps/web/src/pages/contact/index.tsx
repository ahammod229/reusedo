import { Mail, MapPin, Phone } from "lucide-react";

export const Contact = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Contact Us</h1>
        <p className="text-xl text-muted-foreground">
          Have a question, feedback, or need assistance? We're here to help you get the most out of
          Reusedo.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">Get in Touch</h2>
            <p className="text-muted-foreground">
              Fill out the form and our support team will get back to you within 24 hours. For
              immediate assistance regarding an ongoing exchange, please use the dispute resolution
              center.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Email</h3>
                <p className="text-sm text-muted-foreground">support@reusedo.com</p>
                <p className="text-sm text-muted-foreground">partnerships@reusedo.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <Phone className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Phone</h3>
                <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
                <p className="text-sm text-muted-foreground">Mon-Fri, 9am-6pm EST</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <MapPin className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Office</h3>
                <p className="text-sm text-muted-foreground">
                  123 Innovation Drive
                  <br />
                  Tech District
                  <br />
                  San Francisco, CA 94103
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-2xl p-8 shadow-sm">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="first-name"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    First name
                  </label>
                  <input
                    id="first-name"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="last-name"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Last name
                  </label>
                  <input
                    id="last-name"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="subject"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Subject
                </label>
                <select
                  id="subject"
                  defaultValue=""
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>
                    Select a topic
                  </option>
                  <option value="support">General Support</option>
                  <option value="exchange">Exchange Dispute</option>
                  <option value="feedback">Product Feedback</option>
                  <option value="partnership">Partnership Inquiry</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="How can we help you?"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
