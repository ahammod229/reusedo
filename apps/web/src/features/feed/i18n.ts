import { create } from "zustand";
import { authBn, authEn } from "./i18n.auth";

export type Lang = "bn" | "en";

const base = {
  bn: {
    appTagline: "কিছুই ফেলবেন না — কারও না কারও কাজে লাগবে",
    feed: "ফিড",
    give: "দিন",
    need: "চাই",
    offer: "আমার কাছে আছে",
    needBadge: "আমার দরকার",
    free: "বিনামূল্যে",
    all: "সব",
    nearMe: "আমার এলাকা",
    district: "আমার জেলা",
    country: "সারা দেশ",
    request: "আমার চাই",
    iHaveThis: "আমার কাছে আছে",
    chat: "চ্যাট",
    save: "সেভ",
    share: "শেয়ার",
    report: "রিপোর্ট",
    sponsored: "স্পন্সরড",
    verified: "ভেরিফাইড",
    postSomething: "কী দিতে বা চাইতে চান?",
    takePhoto: "ছবি তুলুন",
    emptyFeed: "এই ফিল্টারে কিছু পাওয়া যায়নি",
    quickPost: "দ্রুত পোস্ট",
    quickPostHint: "শুধু ছবি তুলুন — বাকিটা AI গুছিয়ে দেবে",
    addPhotos: "ছবি যোগ করুন (সর্বোচ্চ ৫টি)",
    analyzing: "AI ছবি দেখছে…",
    aiDraft: "AI-এর খসড়া",
    aiHint: "ঠিক আছে কিনা দেখে নিন, দরকারে বদলান",
    title: "শিরোনাম",
    description: "বিবরণ",
    category: "ক্যাটাগরি",
    condition: "অবস্থা",
    publish: "পাবলিশ করুন",
    published: "পোস্ট পাবলিশ হয়েছে!",
    retake: "ছবি বদলান",
    aiLimit: "আজকের AI সীমা শেষ — নিজে লিখুন",
    needFromVoice: "আমার যা দরকার (লিখুন)",
    courierTitle: "কুরিয়ারে ডেলিভারি",
    courierHint: "দুজন রাজি হলে অ্যাডমিন যাচাই করে কনফার্ম করবেন",
    giverAgree: "দাতা সম্মত",
    receiverAgree: "গ্রহীতা সম্মত",
    agreeCourier: "কুরিয়ারে নিতে/দিতে রাজি",
    charge: "কুরিয়ার চার্জ (গ্রহীতা দেবেন, ডেলিভারিতে)",
    sendToAdmin: "অ্যাডমিনকে রিকোয়েস্ট পাঠান",
    waitingBoth: "দুজনের সম্মতির অপেক্ষা",
    pickup: "পিকআপ (দাতা)",
    dropoff: "ডেলিভারি (গ্রহীতা)",
    confirm: "কনফার্ম",
    reject: "বাতিল",
    courierQueue: "কুরিয়ার রিকোয়েস্ট",
    weightApprox: "আনুমানিক ওজন",
    tracking: "ট্র্যাকিং কোড",
    heroTitle: "যা আপনার দরকার নেই, তা কারও জন্য আশীর্বাদ",
    heroBody: "বই, খাতা, টেবিল, কাপড় — ফেলে না দিয়ে বিনামূল্যে দিয়ে দিন। যার দরকার সে খুঁজে নেবে। পুরোটাই ফ্রি।",
    ctaBrowse: "ফিড দেখুন",
    ctaJoin: "অ্যাকাউন্ট খুলুন",
    step1: "ছবি তুলুন",
    step1d: "AI শিরোনাম, বিবরণ আর ক্যাটাগরি লিখে দেবে।",
    step2: "মিলিয়ে নিন",
    step2d: "কাছের মানুষ রিকোয়েস্ট করবে, চ্যাটে কথা বলুন।",
    step3: "হস্তান্তর",
    step3d: "নিজে দেখা করে অথবা কুরিয়ারে — গ্রহীতা শুধু কুরিয়ার চার্জ দেবেন।",
    // shell
    navHome: "হোম",
    navFeed: "ফিড",
    navPost: "পোস্ট",
    navCourier: "কুরিয়ার",
    navExchanges: "আদান-প্রদান",
    navMessages: "মেসেজ",
    navProfile: "প্রোফাইল",
    navSettings: "সেটিংস",
    navHelp: "সাহায্য",
    navMyPosts: "আমার পোস্ট",
    navSaved: "সেভ করা",
    searchPlaceholder: "বই, টেবিল, কাপড় খুঁজুন…",
    postCta: "পোস্ট করুন",
    login: "লগইন",
    logout: "লগআউট",
    register: "অ্যাকাউন্ট খুলুন",
    menu: "মেনু",
    notifications: "নোটিফিকেশন",
    footerRights: "সর্বস্বত্ব সংরক্ষিত",
    footerAbout: "আমাদের কথা",
    footerTerms: "শর্তাবলী",
    footerPrivacy: "প্রাইভেসি",
    footerContact: "যোগাযোগ",
    footerNote: "ফেলবেন না, দিয়ে দিন — পুরোটাই বিনামূল্যে।",
  },
  en: {
    appTagline: "Don't throw it away — someone needs it",
    feed: "Feed",
    give: "Give",
    need: "Need",
    offer: "I have this",
    needBadge: "I need this",
    free: "Free",
    all: "All",
    nearMe: "My area",
    district: "My district",
    country: "Nationwide",
    request: "I want this",
    iHaveThis: "I have this",
    chat: "Chat",
    save: "Save",
    share: "Share",
    report: "Report",
    sponsored: "Sponsored",
    verified: "Verified",
    postSomething: "What do you want to give or ask for?",
    takePhoto: "Take photo",
    emptyFeed: "Nothing found for this filter",
    quickPost: "Quick post",
    quickPostHint: "Just snap a photo — AI fills in the rest",
    addPhotos: "Add photos (max 5)",
    analyzing: "AI is looking at your photo…",
    aiDraft: "AI draft",
    aiHint: "Check it looks right, edit if needed",
    title: "Title",
    description: "Description",
    category: "Category",
    condition: "Condition",
    publish: "Publish",
    published: "Post published!",
    retake: "Change photos",
    aiLimit: "Daily AI limit reached — write it yourself",
    needFromVoice: "What do you need? (type it)",
    courierTitle: "Courier delivery",
    courierHint: "Once both agree, an admin reviews and confirms",
    giverAgree: "Giver agreed",
    receiverAgree: "Receiver agreed",
    agreeCourier: "I agree to courier delivery",
    charge: "Courier charge (paid by receiver on delivery)",
    sendToAdmin: "Send request to admin",
    waitingBoth: "Waiting for both to agree",
    pickup: "Pickup (giver)",
    dropoff: "Delivery (receiver)",
    confirm: "Confirm",
    reject: "Reject",
    courierQueue: "Courier requests",
    weightApprox: "Approx. weight",
    tracking: "Tracking code",
    heroTitle: "What you don't need is a blessing for someone else",
    heroBody:
      "Books, notebooks, tables, clothes — give them away instead of throwing them out. Whoever needs them will find them. Completely free.",
    ctaBrowse: "Browse feed",
    ctaJoin: "Create account",
    step1: "Snap a photo",
    step1d: "AI writes the title, description and category.",
    step2: "Get matched",
    step2d: "Someone nearby requests it — talk in chat.",
    step3: "Hand over",
    step3d: "Meet in person or use courier — the receiver pays only the courier fee.",
    // shell
    navHome: "Home",
    navFeed: "Feed",
    navPost: "Post",
    navCourier: "Courier",
    navExchanges: "Exchanges",
    navMessages: "Messages",
    navProfile: "Profile",
    navSettings: "Settings",
    navHelp: "Help",
    navMyPosts: "My posts",
    navSaved: "Saved",
    searchPlaceholder: "Search books, tables, clothes…",
    postCta: "Post",
    login: "Log in",
    logout: "Log out",
    register: "Create account",
    menu: "Menu",
    notifications: "Notifications",
    footerRights: "All rights reserved",
    footerAbout: "About",
    footerTerms: "Terms",
    footerPrivacy: "Privacy",
    footerContact: "Contact",
    footerNote: "Don't throw it away, give it — completely free.",
  },
} as const;

const dict = {
  bn: { ...base.bn, ...authBn },
  en: { ...base.en, ...authEn },
};

export type TKey = keyof (typeof dict)["bn"];

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

const read = (): Lang => {
  try {
    return localStorage.getItem("reusedo-lang") === "en" ? "en" : "bn";
  } catch {
    return "bn";
  }
};

export const useLang = create<LangState>((set) => ({
  lang: read(),
  setLang: (lang) => {
    try {
      localStorage.setItem("reusedo-lang", lang);
    } catch {
      /* storage unavailable */
    }
    set({ lang });
  },
}));

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Renders digits as Bengali numerals when the UI language is Bengali. */
export function useNum() {
  const lang = useLang((s) => s.lang);
  return (n: number | string): string =>
    lang === "bn" ? String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]) : String(n);
}

/** Inline bilingual text: tr("বাংলা", "English"). Keeps one-off page copy next to the markup. */
export function useTr() {
  const lang = useLang((s) => s.lang);
  return (bn: string, en: string): string => (lang === "bn" ? bn : en);
}

export function useT() {
  const lang = useLang((s) => s.lang);
  return (key: TKey): string => dict[lang][key];
}
