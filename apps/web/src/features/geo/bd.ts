// Bangladesh administrative hierarchy for address entry: 8 divisions, 64 districts.
// Upazila/area stay free-text until a full upazila dataset is wired in.
export const BD_DIVISIONS: { id: string; bn: string; en: string; districts: string[] }[] = [
  {
    id: "dhaka",
    bn: "ঢাকা",
    en: "Dhaka",
    districts: [
      "ঢাকা",
      "গাজীপুর",
      "নারায়ণগঞ্জ",
      "নরসিংদী",
      "মানিকগঞ্জ",
      "মুন্সিগঞ্জ",
      "টাঙ্গাইল",
      "কিশোরগঞ্জ",
      "ফরিদপুর",
      "গোপালগঞ্জ",
      "মাদারীপুর",
      "রাজবাড়ী",
      "শরীয়তপুর",
    ],
  },
  {
    id: "chattogram",
    bn: "চট্টগ্রাম",
    en: "Chattogram",
    districts: [
      "চট্টগ্রাম",
      "কক্সবাজার",
      "কুমিল্লা",
      "ব্রাহ্মণবাড়িয়া",
      "চাঁদপুর",
      "ফেনী",
      "নোয়াখালী",
      "লক্ষ্মীপুর",
      "খাগড়াছড়ি",
      "রাঙ্গামাটি",
      "বান্দরবান",
    ],
  },
  {
    id: "rajshahi",
    bn: "রাজশাহী",
    en: "Rajshahi",
    districts: ["রাজশাহী", "বগুড়া", "জয়পুরহাট", "নওগাঁ", "নাটোর", "চাঁপাইনবাবগঞ্জ", "পাবনা", "সিরাজগঞ্জ"],
  },
  {
    id: "khulna",
    bn: "খুলনা",
    en: "Khulna",
    districts: [
      "খুলনা",
      "বাগেরহাট",
      "চুয়াডাঙ্গা",
      "যশোর",
      "ঝিনাইদহ",
      "কুষ্টিয়া",
      "মাগুরা",
      "মেহেরপুর",
      "নড়াইল",
      "সাতক্ষীরা",
    ],
  },
  {
    id: "barishal",
    bn: "বরিশাল",
    en: "Barishal",
    districts: ["বরিশাল", "বরগুনা", "ভোলা", "ঝালকাঠি", "পটুয়াখালী", "পিরোজপুর"],
  },
  { id: "sylhet", bn: "সিলেট", en: "Sylhet", districts: ["সিলেট", "হবিগঞ্জ", "মৌলভীবাজার", "সুনামগঞ্জ"] },
  {
    id: "rangpur",
    bn: "রংপুর",
    en: "Rangpur",
    districts: ["রংপুর", "দিনাজপুর", "গাইবান্ধা", "কুড়িগ্রাম", "লালমনিরহাট", "নীলফামারী", "পঞ্চগড়", "ঠাকুরগাঁও"],
  },
  {
    id: "mymensingh",
    bn: "ময়মনসিংহ",
    en: "Mymensingh",
    districts: ["ময়মনসিংহ", "জামালপুর", "নেত্রকোণা", "শেরপুর"],
  },
];

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Accepts Bengali or Latin digits, with optional +88 / spaces / dashes. */
export function normalizePhone(input: string): string {
  const latin = input.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  return latin.replace(/[\s-]/g, "").replace(/^\+?88/, "");
}

export const isBdMobile = (input: string) => /^01[3-9]\d{8}$/.test(normalizePhone(input));
