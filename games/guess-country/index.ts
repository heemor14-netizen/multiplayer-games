import type { GameConfig } from "@/types/game";

export const config: GameConfig = {
  id: "guess-country",
  name: "خمن الدولة",
  icon: "🌍",
  minPlayers: 1,
  maxPlayers: 8,
};

export interface CountryQuestion {
  country: string;
  hint: string;
  letter: string;
  flag: string;
  continent: string;
  aliases: string[];
}

export const COUNTRIES_DATA: CountryQuestion[] = [
  // دول عربية
  {
    country: "السعودية",
    hint: "أكبر دولة في شبه الجزيرة العربية عاصمتها الرياض وتضم الحرمين الشريفين",
    letter: "س",
    flag: "🇸🇦",
    continent: "آسيا",
    aliases: ["المملكة العربية السعودية", "سعودية", "السعوديه"],
  },
  {
    country: "مصر",
    hint: "دولة عربية بها نهر النيل والأهرامات وعاصمتها القاهرة",
    letter: "م",
    flag: "🇪🇬",
    continent: "أفريقيا",
    aliases: ["جمهورية مصر العربية", "مصر"],
  },
  {
    country: "الإمارات",
    hint: "دولة خليجية عاصمتها أبوظبي وتشتهر ببرج خليفة في دبي",
    letter: "إ",
    flag: "🇦🇪",
    continent: "آسيا",
    aliases: ["الامارات", "الامارات العربية المتحدة", "الإمارات العربية المتحدة"],
  },
  {
    country: "الكويت",
    hint: "دولة خليجية عاصمتها مدينة الكويت وتشتهر بأبراجها الثلاثة الشهيرة",
    letter: "ك",
    flag: "🇰🇼",
    continent: "آسيا",
    aliases: ["كويت"],
  },
  {
    country: "قطر",
    hint: "دولة خليجية عاصمتها الدوحة استضافت كأس العالم 2022",
    letter: "ق",
    flag: "🇶🇦",
    continent: "آسيا",
    aliases: ["دولة قطر"],
  },
  {
    country: "عمان",
    hint: "دولة خليجية عاصمتها مسقط وتشتهر بالقلاع والحصون التاريخية",
    letter: "ع",
    flag: "🇴🇲",
    continent: "آسيا",
    aliases: ["سلطنة عمان", "عُمان"],
  },
  {
    country: "البحرين",
    hint: "مملكة أرخبيل جزر في الخليج العربي عاصمتها المنامة",
    letter: "ب",
    flag: "🇧🇭",
    continent: "آسيا",
    aliases: ["مملكة البحرين", "بحرين"],
  },
  {
    country: "المغرب",
    hint: "دولة في شمال أفريقيا عاصمتها الرباط وتطل على البحر المتوسط والمحيط الأطلسي",
    letter: "م",
    flag: "🇲🇦",
    continent: "أفريقيا",
    aliases: ["المملكة المغربية", "مغرب"],
  },
  {
    country: "الجزائر",
    hint: "أكبر دولة عربية وأفريقية من حيث المساحة وعاصمتها الجزائر",
    letter: "ج",
    flag: "🇩🇿",
    continent: "أفريقيا",
    aliases: ["الجزائر", "جزائر"],
  },
  {
    country: "تونس",
    hint: "دولة في شمال أفريقيا عاصمتها تونس وتشتهر بمدينة قرطاج التاريخية",
    letter: "ت",
    flag: "🇹🇳",
    continent: "أفريقيا",
    aliases: ["تونس الخضراء"],
  },
  {
    country: "الأردن",
    hint: "بلد عربي عاصمته عمّان وفيه مدينة البتراء الوردية والبحر الميت",
    letter: "أ",
    flag: "🇯🇴",
    continent: "آسيا",
    aliases: ["الاردن", "المملكة الأردنية الهاشمية"],
  },
  {
    country: "العراق",
    hint: "بلاد الرافدين دجلة والفرات وعاصمته بغداد دار السلام",
    letter: "ع",
    flag: "🇮🇶",
    continent: "آسيا",
    aliases: ["عراق", "جمهورية العراق"],
  },

  // دول عالمية
  {
    country: "اليابان",
    hint: "كوكب اليابان عاصمتها طوكيو وتشتهر بقطار الرصاصة وجبل فوجي",
    letter: "ي",
    flag: "🇯🇵",
    continent: "آسيا",
    aliases: ["اليابان", "يابان"],
  },
  {
    country: "الصين",
    hint: "دولة عاصمتها بكين وتشتهر بسور الصين العظيم وتنين الشرق",
    letter: "ص",
    flag: "🇨🇳",
    continent: "آسيا",
    aliases: ["جمهورية الصين الشعبية", "صين"],
  },
  {
    country: "فرنسا",
    hint: "دولة أوروبية عاصمتها باريس وتشتهر ببرج إيفل ومتحف اللوفر",
    letter: "ف",
    flag: "🇫🇷",
    continent: "أوروبا",
    aliases: ["فرنسا"],
  },
  {
    country: "إيطاليا",
    hint: "بلد البيتزا والباستا ومدرج الكولوسيوم وعاصمتها روما",
    letter: "إ",
    flag: "🇮🇹",
    continent: "أوروبا",
    aliases: ["ايطاليا", "إيطاليا"],
  },
  {
    country: "ألمانيا",
    hint: "دولة أوروبية صناعية كبرى عاصمتها برلين وتشتهر بسياراتها الفاخرة",
    letter: "أ",
    flag: "🇩🇪",
    continent: "أوروبا",
    aliases: ["المانيا", "ألمانيا"],
  },
  {
    country: "إسبانيا",
    hint: "دولة في شبه الجزيرة الأيبيرية عاصمتها مدريد وموطن ريال مدريد وبرشلونة",
    letter: "إ",
    flag: "🇪🇸",
    continent: "أوروبا",
    aliases: ["اسبانيا", "إسبانيا"],
  },
  {
    country: "تركيا",
    hint: "دولة تمتد بين آسيا وأوروبا عاصمتها أنقرة وأكبر مدنها إسطنبول",
    letter: "ت",
    flag: "🇹🇷",
    continent: "آسيا وأوروبا",
    aliases: ["تركيا"],
  },
  {
    country: "البرازيل",
    hint: "بلاد السامبا وغابات الأمازون وعاصمتها برازيليا",
    letter: "ب",
    flag: "🇧🇷",
    continent: "أمريكا الجنوبية",
    aliases: ["برازيل"],
  },
  {
    country: "الأرجنتين",
    hint: "دولة التانغو ومسقط رأس ميسي ومارادونا وعاصمتها بوينس آيرس",
    letter: "أ",
    flag: "🇦🇷",
    continent: "أمريكا الجنوبية",
    aliases: ["الارجنتين", "ارجنتين"],
  },
  {
    country: "كندا",
    hint: "دولة في أمريكا الشمالية تشتهر بورقة القيقب وعاصمتها أوتاوا",
    letter: "ك",
    flag: "🇨🇦",
    continent: "أمريكا الشمالية",
    aliases: ["كندا"],
  },
  {
    country: "أستراليا",
    hint: "قارة ودولة موطن الكنغر والكوالا وعاصمتها كانبرا",
    letter: "أ",
    flag: "🇦🇺",
    continent: "أوقيانوسيا",
    aliases: ["استراليا", "أستراليا"],
  },
  {
    country: "الهند",
    hint: "شبه القارة الهندية موطن تاج محل وعاصمتها نيودلهي",
    letter: "ه",
    flag: "🇮🇳",
    continent: "آسيا",
    aliases: ["هند", "جمهورية الهند"],
  },
  {
    country: "روسيا",
    hint: "أكبر دولة في العالم من حيث المساحة وعاصمتها موسكو وتضم الساحة الحمراء",
    letter: "ر",
    flag: "🇷🇺",
    continent: "أوراسيا",
    aliases: ["روسيا الاتحادية"],
  },
  {
    country: "بريطانيا",
    hint: "المملكة المتحدة موطن ساعة بيغ بن وعاصمتها لندن",
    letter: "ب",
    flag: "🇬🇧",
    continent: "أوروبا",
    aliases: ["المملكة المتحدة", "إنجلترا", "انجلترا", "بريطانيا"],
  },
];

export type CountryGameState = {
  round: number;
  totalRounds: number;
  currentQuestion: CountryQuestion;
  timeLeft: number;
  status: "answering" | "revealing" | "finished";
  answers: Record<string, string>;
  scores: Record<string, number>;
  players: Record<string, { name: string; photoURL?: string | null; isBot?: boolean }>;
  usedIndices: number[];
};
