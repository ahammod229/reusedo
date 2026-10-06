import { Link } from "react-router";
import { Logo } from "./logo";

export interface FooterLabels {
  rights: string;
  about: string;
  terms: string;
  privacy: string;
  contact: string;
  note: string;
}

const DEFAULTS: FooterLabels = {
  rights: "All rights reserved",
  about: "About",
  terms: "Terms",
  privacy: "Privacy",
  contact: "Contact",
  note: "",
};

export function Footer({ labels }: { labels?: Partial<FooterLabels> }) {
  const l = { ...DEFAULTS, ...labels };
  return (
    <footer className="w-full border-t bg-card px-4 pb-24 pt-8 md:px-8 md:pb-8">
      <div className="mx-auto flex max-w-[88rem] flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <Logo />
          {l.note && <p className="text-sm text-muted-foreground">{l.note}</p>}
        </div>
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <Link to="/about" className="hover:text-foreground">
            {l.about}
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            {l.terms}
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            {l.privacy}
          </Link>
          <Link to="/contact" className="hover:text-foreground">
            {l.contact}
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ReuseDo · {l.rights}
        </p>
      </div>
    </footer>
  );
}
