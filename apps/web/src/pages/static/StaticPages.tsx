import { useTr } from "@/features/feed/i18n";
import { PageHeading } from "@/features/feed/parts";
import { Button } from "@/shared/components/ui";
import { ChevronDown, Compass, MailCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router";

function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 px-4 py-8">
      <Helmet>
        <title>{title} — ReuseDo</title>
      </Helmet>
      <PageHeading title={title} />
      {children}
    </div>
  );
}

export function HelpPage() {
  const tr = useTr();
  const faqs: [string, string][] = [
    [
      tr("ReuseDo কি সত্যিই বিনামূল্যে?", "Is ReuseDo really free?"),
      tr(
        "হ্যাঁ। জিনিস দেওয়া ও নেওয়া সম্পূর্ণ বিনামূল্যে। কুরিয়ারে পাঠালে শুধু কুরিয়ার চার্জ গ্রহীতা দেন।",
        "Yes. Giving and receiving are completely free. If sent by courier, only the courier fee is paid by the receiver.",
      ),
    ],
    [
      tr("কীভাবে পোস্ট করব?", "How do I post?"),
      tr(
        "‘পোস্ট’ বাটনে চেপে জিনিসের ছবি তুলুন। AI শিরোনাম, বিবরণ ও ক্যাটাগরি লিখে দেবে — আপনি দেখে নিয়ে পাবলিশ করবেন।",
        "Tap ‘Post’ and take a photo. AI writes the title, description and category — you review and publish.",
      ),
    ],
    [
      tr("কেন ইমেইল কোড লাগে?", "Why do I need an email code?"),
      tr(
        "ভুয়া অ্যাকাউন্ট ঠেকাতে ও নিরাপদ লেনদেনের জন্য। কোডটি ৬ সংখ্যার, ১০ মিনিট কাজ করে।",
        "To prevent fake accounts and keep exchanges safe. The 6-digit code is valid for 10 minutes.",
      ),
    ],
    [
      tr("আমার ঠিকানা কি সবাই দেখবে?", "Will everyone see my address?"),
      tr(
        "না। পাবলিকে শুধু এলাকার নাম দেখায়। রিকোয়েস্ট গ্রহণের পর অপর পক্ষ পুরো ঠিকানা দেখতে পায়।",
        "No. Only your area is public. The other person sees the full address after the request is accepted.",
      ),
    ],
    [
      tr("কুরিয়ার কীভাবে কাজ করে?", "How does courier work?"),
      tr(
        "দুজন রাজি হলে রিকোয়েস্ট অ্যাডমিনের কাছে যায়। অ্যাডমিন যাচাই করে কনফার্ম করলে Steadfast কুরিয়ার পার্সেল নেয় এবং ট্র্যাকিং কোড পাওয়া যায়।",
        "Once both agree, the request goes to an admin. After they confirm, Steadfast Courier collects the parcel and you get a tracking code.",
      ),
    ],
    [
      tr("কেউ প্রতারণা করলে?", "What if someone scams me?"),
      tr(
        "পোস্ট বা প্রোফাইলে ‘রিপোর্ট’ চাপুন। আমরা দ্রুত যাচাই করে ব্যবস্থা নেব।",
        "Tap ‘Report’ on the post or profile. We review quickly and act.",
      ),
    ],
  ];
  return (
    <Page title={tr("সাহায্য", "Help")}>
      <div className="space-y-2">
        {faqs.map(([q, a]) => (
          <details key={q} className="group rounded-2xl border bg-card p-4 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold">
              {q}
              <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        {tr("আরও জানতে ", "Need more? ")}
        <Link to="/contact" className="font-semibold text-primary hover:underline">
          {tr("যোগাযোগ করুন", "Contact us")}
        </Link>
      </p>
    </Page>
  );
}

export function AboutPage() {
  const tr = useTr();
  return (
    <Page title={tr("আমাদের কথা", "About us")}>
      <p className="text-lg leading-relaxed">
        {tr(
          "প্রতিদিন কত বই, খাতা, আসবাব আর কাপড় অকারণে ফেলে দেওয়া হয় — অথচ কারও জন্য সেটাই খুব দরকারি। ReuseDo সেই দুই পক্ষকে মেলায়: যার অপ্রয়োজনীয় জিনিস আছে, আর যার সেটা দরকার।",
          "Every day countless books, notebooks, furniture and clothes are thrown away — while someone nearby needs exactly that. ReuseDo connects the two: people with things they don't need, and people who do.",
        )}
      </p>
      <p className="leading-relaxed text-muted-foreground">
        {tr(
          "পুরোটাই বিনামূল্যে, যাচাই করা মানুষের সাথে, আপনার নিজের এলাকায়। প্ল্যাটফর্মের খরচ চালাতে ফিডে অল্প কিছু বিজ্ঞাপন দেখানো হয়।",
          "Completely free, with verified people, in your own area. A few ads in the feed cover the running costs.",
        )}
      </p>
      <Button asChild size="lg">
        <Link to="/feed">
          <Compass className="mr-2 h-5 w-5" /> {tr("ফিড দেখুন", "Browse feed")}
        </Link>
      </Button>
    </Page>
  );
}

export function ContactPage() {
  const tr = useTr();
  return (
    <Page title={tr("যোগাযোগ", "Contact")}>
      <div className="flex items-start gap-3 rounded-2xl border bg-card p-5">
        <MailCheck className="mt-0.5 h-6 w-6 text-primary" />
        <div>
          <p className="font-semibold">{tr("ইমেইল করুন", "Email us")}</p>
          <p className="text-sm text-muted-foreground">support@reusedo.app</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {tr("সাধারণত ২৪ ঘণ্টার মধ্যে উত্তর দিই।", "We usually reply within 24 hours.")}
          </p>
        </div>
      </div>
    </Page>
  );
}

/** Draft copy — must be reviewed by a lawyer before launch (and is required for ad-network approval). */
export function LegalPage({ kind }: { kind: "terms" | "privacy" }) {
  const tr = useTr();
  const terms = kind === "terms";
  const sections: [string, string][] = terms
    ? [
        [
          tr("১. বিনামূল্যে দান", "1. Free giving"),
          tr(
            "ReuseDo-তে সব জিনিস বিনামূল্যে দেওয়া হয়। বিক্রয় বা অর্থের লেনদেন নিষিদ্ধ।",
            "All items on ReuseDo are given free. Selling or payment between users is prohibited.",
          ),
        ],
        [
          tr("২. নিষিদ্ধ জিনিস", "2. Prohibited items"),
          tr(
            "অস্ত্র, ওষুধ, প্রাণী, বিপজ্জনক বা অবৈধ জিনিস পোস্ট করা যাবে না।",
            "Weapons, medicine, animals, dangerous or illegal items may not be posted.",
          ),
        ],
        [
          tr("৩. ব্যবহারকারীর দায়িত্ব", "3. User responsibility"),
          tr(
            "সঠিক তথ্য দিন, অন্যের সাথে সম্মানজনক আচরণ করুন এবং নিরাপদ স্থানে দেখা করুন।",
            "Provide accurate information, treat others respectfully and meet in safe places.",
          ),
        ],
        [
          tr("৪. কুরিয়ার", "4. Courier"),
          tr(
            "কুরিয়ার চার্জ গ্রহীতা বহন করেন। অ্যাডমিন অনুমোদন ছাড়া কুরিয়ার বুক হয় না।",
            "The receiver pays the courier fee. No courier is booked without admin approval.",
          ),
        ],
      ]
    : [
        [
          tr("১. আমরা কী তথ্য নিই", "1. What we collect"),
          tr(
            "নাম, ইমেইল, ফোন, ঠিকানা ও আপনার আপলোড করা ছবি।",
            "Name, email, phone, address and the photos you upload.",
          ),
        ],
        [
          tr("২. ঠিকানার গোপনীয়তা", "2. Address privacy"),
          tr(
            "পাবলিকে শুধু এলাকা দেখানো হয়। পুরো ঠিকানা কেবল নিশ্চিত লেনদেনে অপর পক্ষ ও কুরিয়ার দেখে।",
            "Only your area is public. The full address is shared only with the other party and courier in a confirmed exchange.",
          ),
        ],
        [
          tr("৩. AI ব্যবহার", "3. AI usage"),
          tr(
            "পোস্টের ছবি Google Gemini-তে পাঠানো হয় বিবরণ তৈরির জন্য। ফ্রি টিয়ারে এই ডেটা Google উন্নয়নে ব্যবহার করতে পারে।",
            "Post photos are sent to Google Gemini to draft descriptions. On the free tier Google may use this data to improve its models.",
          ),
        ],
        [
          tr("৪. বিজ্ঞাপন ও কুকি", "4. Ads & cookies"),
          tr(
            "আমরা Google বিজ্ঞাপন দেখাই; এতে কুকি ব্যবহার হতে পারে। আপনি ব্রাউজার থেকে কুকি নিয়ন্ত্রণ করতে পারেন।",
            "We show Google ads, which may use cookies. You can control cookies in your browser.",
          ),
        ],
      ];
  return (
    <Page title={terms ? tr("শর্তাবলী", "Terms of use") : tr("প্রাইভেসি নীতি", "Privacy policy")}>
      <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">
        {tr(
          "এটি একটি খসড়া। চালুর আগে আইনজীবীর মাধ্যমে চূড়ান্ত করুন।",
          "This is a draft. Have it reviewed by a lawyer before launch.",
        )}
      </p>
      {sections.map(([h, b]) => (
        <section key={h}>
          <h2 className="font-bold">{h}</h2>
          <p className="mt-1 leading-relaxed text-muted-foreground">{b}</p>
        </section>
      ))}
    </Page>
  );
}

export function NotFoundPage() {
  const tr = useTr();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-7xl">🔍</p>
      <h1 className="text-2xl font-extrabold">{tr("পেজটি খুঁজে পাওয়া যায়নি", "Page not found")}</h1>
      <p className="text-muted-foreground">
        {tr(
          "লিংকটি ভুল হতে পারে অথবা পেজটি সরানো হয়েছে।",
          "The link may be wrong or the page was removed.",
        )}
      </p>
      <Button asChild size="lg">
        <Link to="/feed">{tr("ফিডে ফিরুন", "Back to feed")}</Link>
      </Button>
    </div>
  );
}
