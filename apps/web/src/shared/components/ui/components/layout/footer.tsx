import { Link } from "react-router";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background px-4 py-6 md:px-8">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Reusedo. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <Link to="/about" className="hover:underline hover:text-foreground">
            About
          </Link>
          <Link to="/terms" className="hover:underline hover:text-foreground">
            Terms
          </Link>
          <Link to="/privacy" className="hover:underline hover:text-foreground">
            Privacy
          </Link>
          <Link to="/contact" className="hover:underline hover:text-foreground">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
