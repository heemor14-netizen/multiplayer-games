import type { GameConfig } from "@/types/game";

export const config: GameConfig = {
  id: "quiz",
  name: "مسابقات وتحدي",
  icon: "🧠",
  minPlayers: 1,
  maxPlayers: 8,
};

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
  explanation?: string;
}

export const QUESTIONS: QuizQuestion[] = [
  // ثقافة إسلامية وتاريخ
  {
    question: "ما هي أطول سورة في القرآن الكريم؟",
    options: ["سورة النساء", "سورة البقرة", "سورة آل عمران", "سورة المائدة"],
    correctIndex: 1,
    category: "إسلاميات",
    explanation: "سورة البقرة هي أطول سورة في القرآن بعدد 286 آية.",
  },
  {
    question: "كم عدد سور القرآن الكريم؟",
    options: ["110", "112", "114", "116"],
    correctIndex: 2,
    category: "إسلاميات",
  },
  {
    question: "من هو أول الخلفاء الراشدين؟",
    options: ["عمر بن الخطاب", "عثمان بن عفان", "علي بن أبي طالب", "أبو بكر الصديق"],
    correctIndex: 3,
    category: "إسلاميات",
  },
  {
    question: "في أي عام تم فتح مكة المكرمة؟",
    options: ["6 هـ", "8 هـ", "9 هـ", "10 هـ"],
    correctIndex: 1,
    category: "إسلاميات",
  },
  {
    question: "من هو القائد المسلم الذي فتح الأندلس؟",
    options: ["طارق بن زياد", "خالد بن الوليد", "صلاح الدين الأيوبي", "عمرو بن العاص"],
    correctIndex: 0,
    category: "تاريخ",
  },
  {
    question: "من هو باني مدينة بغداد؟",
    options: ["هارون الرشيد", "أبو جعفر المنصور", "المأمون", "صلاح الدين"],
    correctIndex: 1,
    category: "تاريخ",
  },
  {
    question: "في أي عام وقعت معركة حطين الشهيرة؟",
    options: ["1187م", "1258م", "1099م", "1453م"],
    correctIndex: 0,
    category: "تاريخ",
  },
  {
    question: "من هو القائد الذي فتح القسطنطينية عام 1453م؟",
    options: ["سليمان القانوني", "محمد الفاتح", "سليم الأول", "عثمان الأول"],
    correctIndex: 1,
    category: "تاريخ",
  },

  // جغرافيا ومعالم
  {
    question: "ما هي عاصمة أستراليا؟",
    options: ["سيدني", "ملبورن", "كانبرا", "بيرث"],
    correctIndex: 2,
    category: "جغرافيا",
  },
  {
    question: "ما هي أكبر دولة عربية من حيث المساحة؟",
    options: ["المملكة العربية السعودية", "الجزائر", "مصر", "السودان"],
    correctIndex: 1,
    category: "جغرافيا",
  },
  {
    question: "ما هو أطول نهر في العالم؟",
    options: ["نهر الأمازون", "نهر النيل", "نهر المسيسيبي", "نهر اليانغتسي"],
    correctIndex: 1,
    category: "جغرافيا",
  },
  {
    question: "ما هي أعلى قمة جبلية في العالم؟",
    options: ["جبل كليمنجارو", "جبل إفرست", "جبل طويق", "جبل مون بلان"],
    correctIndex: 1,
    category: "جغرافيا",
  },
  {
    question: "ما هو أكبر محيط على وجه الأرض؟",
    options: ["المحيط الأطلسي", "المحيط الهندي", "المحيط الهادئ", "المحيط المتجمد الشمالي"],
    correctIndex: 2,
    category: "جغرافيا",
  },
  {
    question: "ما هي عاصمة اليابان؟",
    options: ["كيوتو", "أوساكا", "طوكيو", "سول"],
    correctIndex: 2,
    category: "جغرافيا",
  },
  {
    question: "ما هي عاصمة كندا؟",
    options: ["تورونتو", "فانكوفر", "مونتريال", "أوتاوا"],
    correctIndex: 3,
    category: "جغرافيا",
  },
  {
    question: "أي دولة تسمى 'بلاد الرافدين'؟",
    options: ["سوريا", "العراق", "مصر", "الأردن"],
    correctIndex: 1,
    category: "جغرافيا",
  },
  {
    question: "ما هي أصغر دولة في العالم من حيث المساحة؟",
    options: ["موناكو", "الفاتيكان", "سان مارينو", "ليختنشتاين"],
    correctIndex: 1,
    category: "جغرافيا",
  },
  {
    question: "ما هي عاصمة سويسرا الفيدرالية؟",
    options: ["زيورخ", "جنيف", "برن", "بازل"],
    correctIndex: 2,
    category: "جغرافيا",
  },

  // علوم وطبيعة
  {
    question: "ما هو أسرع كائن حي على وجه الأرض؟",
    options: ["الفهد الصياد", "صقر الشاهين", "السمكة الشراعية", "الحصان العربي"],
    correctIndex: 1,
    category: "علوم",
    explanation: "صقر الشاهين تصل سرعته عند الانقضاض لأكثر من 380 كم/ساعة!",
  },
  {
    question: "كم عدد كواكب المجموعة الشمسية المعتمدة رسمياً؟",
    options: ["7", "8", "9", "10"],
    correctIndex: 1,
    category: "علوم",
  },
  {
    question: "ما هو العنصر الكيميائي الأكثر وفرة في الكون؟",
    options: ["الأكسجين", "الهيدروجين", "الهيليوم", "النيتروجين"],
    correctIndex: 1,
    category: "علوم",
  },
  {
    question: "ما هو الغاز الذي تتنفسه النباتات في عملية البناء الضوئي؟",
    options: ["الأكسجين", "النيتروجين", "ثاني أكسيد الكربون", "الميثان"],
    correctIndex: 2,
    category: "علوم",
  },
  {
    question: "ما هو العضو الذي يضخ الدم في جسم الإنسان؟",
    options: ["الكبد", "الرئة", "القلب", "الكلى"],
    correctIndex: 2,
    category: "علوم",
  },
  {
    question: "ما هو الكوكب المعروف بالكوكب الأحمر؟",
    options: ["الزهرة", "المريخ", "المشتري", "عطارد"],
    correctIndex: 1,
    category: "علوم",
  },
  {
    question: "ما هو أقوى معدن طبيعي في الأرض؟",
    options: ["التيتانيوم", "الماس", "البلاتين", "التنجستن"],
    correctIndex: 1,
    category: "علوم",
  },
  {
    question: "ما هي سرعة الضوء التقريبية في الفراغ؟",
    options: ["150 ألف كم/ث", "300 ألف كم/ث", "500 ألف كم/ث", "1 مليون كم/ث"],
    correctIndex: 1,
    category: "علوم",
  },
  {
    question: "كم عدد صمامات قلب الإنسان؟",
    options: ["2", "3", "4", "5"],
    correctIndex: 2,
    category: "علوم",
  },

  // رياضة
  {
    question: "أي منتخب فاز بكأس العالم 2022 في قطر؟",
    options: ["فرنسا", "البرازيل", "الأرجنتين", "كرواتيا"],
    correctIndex: 2,
    category: "رياضة",
  },
  {
    question: "كم عدد لاعبي فريق كرة القدم داخل الملعب؟",
    options: ["10", "11", "12", "9"],
    correctIndex: 1,
    category: "رياضة",
  },
  {
    question: "كم مدة شوط مباراة كرة القدم الأصلي بدون وقت بدل ضائع؟",
    options: ["40 دقيقة", "45 دقيقة", "50 دقيقة", "35 دقيقة"],
    correctIndex: 1,
    category: "رياضة",
  },
  {
    question: "أي نادٍ يحمل الرقم القياسي في الفوز بدوري أبطال أوروبا؟",
    options: ["برشلونة", "بايرن ميونخ", "ميلان", "ريال مدريد"],
    correctIndex: 3,
    category: "رياضة",
  },
  {
    question: "أين أقيمت أول دورة ألعاب أولمبية حديثة عام 1896؟",
    options: ["باريس", "أثينا", "لندن", "روما"],
    correctIndex: 1,
    category: "رياضة",
  },

  // ثقافة وألغاز
  {
    question: "ما هو الشيء الذي كلما أخذت منه كَبُر؟",
    options: ["العمر", "الحفرة", "العقل", "الظل"],
    correctIndex: 1,
    category: "ألغاز",
  },
  {
    question: "ما هو الشيء الذي يمشي بلا أرجل ويبكي بلا عيون؟",
    options: ["الرياح", "السحاب والغيوم", "الساعة", "النهر"],
    correctIndex: 1,
    category: "ألغاز",
  },
  {
    question: "من هو مؤلف كتاب 'مقدمة ابن خلدون' ومؤسس علم الاجتماع؟",
    options: ["ابن رشد", "ابن خلدون", "الفارابي", "ابن سينا"],
    correctIndex: 1,
    category: "ثقافة",
  },
  {
    question: "ما هي لغة الضاد؟",
    options: ["الفارسية", "العربية", "السريانية", "التركية"],
    correctIndex: 1,
    category: "ثقافة",
  },
  {
    question: "كم عدد أحرف اللغة العربية الهجائية؟",
    options: ["26", "28", "29", "30"],
    correctIndex: 1,
    category: "ثقافة",
  },
];

export type QuizGameState = {
  currentRound: number;
  totalRounds: number;
  currentQuestion: QuizQuestion;
  timeLeft: number;
  status: "showing" | "answering" | "revealing" | "finished";
  answers: Record<string, number>;
  scores: Record<string, number>;
  players: Record<string, { name: string; photoURL?: string | null; isBot?: boolean }>;
  usedIndices: number[];
};
