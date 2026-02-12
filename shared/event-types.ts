/**
 * Event Type System — Multi-event platform configuration
 * 
 * Defines all supported event types, their categories (B2C/B2B),
 * applicable vendor categories, visible features, and role labels.
 * 
 * B2B taxonomy follows Norwegian corporate event standards:
 *   1. Faglige og strategiske (Professional & Strategic)
 *   2. Sosiale og relasjonsbyggende (Social & Relationship)
 *   3. Eksternt rettede (External-facing)
 *   4. HR- og interne markeringer (HR & Internal)
 */

// ─── Event Type Enum ────────────────────────────────────────────
export const EVENT_TYPES = [
  // B2C: Personal / Life events
  "wedding",
  "confirmation",
  "birthday",
  "anniversary",
  "engagement",
  "baby_shower",
  // B2B: Professional & Strategic
  "conference",
  "seminar",
  "kickoff",
  // B2B: Social & Relationship
  "summer_party",
  "christmas_party",
  "team_building",
  // B2B: External-facing
  "product_launch",
  "trade_fair",
  // B2B: HR & Internal
  "corporate_anniversary",
  "awards_night",
  "employee_day",
  "onboarding_day",
  // B2B: General catch-all
  "corporate_event",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

// ─── Event Category (B2C vs B2B) ────────────────────────────────
export const EVENT_CATEGORIES = ["personal", "corporate"] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

// ─── Corporate Sub-Categories ───────────────────────────────────
export const CORPORATE_SUB_CATEGORIES = [
  "professional_strategic",
  "social_relational",
  "external_facing",
  "hr_internal",
] as const;
export type CorporateSubCategory = (typeof CORPORATE_SUB_CATEGORIES)[number];

export interface CorporateSubCategoryInfo {
  key: CorporateSubCategory;
  labelNo: string;
  labelEn: string;
  descriptionNo: string;
  descriptionEn: string;
}

export const CORPORATE_SUB_CATEGORY_INFO: Record<CorporateSubCategory, CorporateSubCategoryInfo> = {
  professional_strategic: {
    key: "professional_strategic",
    labelNo: "Faglige og strategiske",
    labelEn: "Professional & Strategic",
    descriptionNo: "Kompetanseheving, bransjedeling, retning og mål",
    descriptionEn: "Competence building, industry sharing, direction and goals",
  },
  social_relational: {
    key: "social_relational",
    labelNo: "Sosiale og relasjonsbyggende",
    labelEn: "Social & Relationship Building",
    descriptionNo: "Kulturbygging, trivsel, samarbeid og samhold",
    descriptionEn: "Culture building, well-being, collaboration and cohesion",
  },
  external_facing: {
    key: "external_facing",
    labelNo: "Eksternt rettede",
    labelEn: "External-facing Events",
    descriptionNo: "PR, merkevarebygging, leads og nettverk",
    descriptionEn: "PR, branding, leads and networking",
  },
  hr_internal: {
    key: "hr_internal",
    labelNo: "HR og interne markeringer",
    labelEn: "HR & Internal Celebrations",
    descriptionNo: "Jubileer, utmerkelser, ansattdager, onboarding",
    descriptionEn: "Anniversaries, awards, employee days, onboarding",
  },
};

// ─── Event Type Metadata ────────────────────────────────────────
export interface EventTypeConfig {
  type: EventType;
  category: EventCategory;
  corporateSubCategory?: CorporateSubCategory;
  labelNo: string;       // Norwegian label
  labelEn: string;       // English label
  icon: string;          // Emoji icon for picker
  descriptionNo: string; // Norwegian description
  descriptionEn: string; // English description
  /** Typical content / key activities (for B2B info display) */
  typicalContentNo?: string[];
  typicalContentEn?: string[];
  /** Which features to show for this event type */
  features: {
    traditions: boolean;
    dressTracking: boolean;
    weddingPartyRoles: boolean;
    speeches: boolean;
    photoplan: boolean;
    seating: boolean;
    coupleProfile: boolean;
    importantPeople: boolean;
    sharePartner: boolean;
  };
  /** Per-feature labels — adapts feature names to event context */
  featureLabels?: {
    /** Label for traditions/setup feature in menus & headers */
    traditions?: { no: string; en: string; descriptionNo?: string; descriptionEn?: string };
    /** Label for dress tracking / dress code feature in menus & headers */
    dressTracking?: { no: string; en: string; descriptionNo?: string; descriptionEn?: string };
  };
  /** Suggested attire vendor names/types for this event – helps couple discover relevant stores */
  attireVendorHints?: {
    storesNo: string[];    // ["Dressmann", "Volt", "H&M"] etc.
    storesEn: string[];
    searchTermsNo: string[]; // Search terms for vendor matching
    searchTermsEn: string[];
  };
  /** Role labels for "important people" */
  roleLabels: {
    primary: { no: string; en: string };     // "Brud" / "Konfirmant" / "Jubilant" / "Arrangør"
    secondary: { no: string; en: string };   // "Brudgom" / "Fadder" / "Partner" / "Medarrangør"
    guestLabel: { no: string; en: string };  // "Gjester" / "Deltakere" / "Inviterte"
  };
  /** Date field label */
  dateLabel: { no: string; en: string };     // "Bryllupsdato" / "Konfirmasjonsdato" / "Arrangementsdato"
  /** Share screen labels — what do we call "sharing" for this event type */
  shareLabel: {
    titleNo: string;      // "Del bryllupet" / "Del arrangementet"
    titleEn: string;      // "Share wedding" / "Share event"
    subtitleNo: string;   // "Inviter partner, toastmaster..."
    subtitleEn: string;
    shareMessageNo: string;  // SMS/share text template
    shareMessageEn: string;
  };
  /** Q&A game configurations — interactive audience games suitable for this event type */
  qaGames?: QaGameConfig[];
}

// ─── Q&A Game System ────────────────────────────────────────────
export type QaGameMode = "shoe_game" | "quiz" | "two_truths" | "qa_open" | "icebreaker";

export interface QaGameConfig {
  mode: QaGameMode;
  labelNo: string;
  labelEn: string;
  descriptionNo: string;
  descriptionEn: string;
  icon: string;
  /** Instructions shown before start */
  instructionsNo: string[];
  instructionsEn: string[];
  /** Pre-loaded questions for this game */
  presetQuestions: QaGameQuestion[];
}

export interface QaGameQuestion {
  id: string;
  textNo: string;
  textEn: string;
  category?: string;
}

// ─── Wedding Shoe Game Presets ──────────────────────────────────
export const SHOE_GAME_QUESTIONS: QaGameQuestion[] = [
  // Hvem av dere... (Who of you...)
  { id: "shoe_1", textNo: "Hvem sa «Jeg elsker deg» først?", textEn: "Who said 'I love you' first?", category: "kjærlighet" },
  { id: "shoe_2", textNo: "Hvem tok initiativet til den første daten?", textEn: "Who initiated the first date?", category: "kjærlighet" },
  { id: "shoe_3", textNo: "Hvem er den mest romantiske?", textEn: "Who is more romantic?", category: "kjærlighet" },
  { id: "shoe_4", textNo: "Hvem fridde?", textEn: "Who proposed?", category: "kjærlighet" },
  { id: "shoe_5", textNo: "Hvem bruker lengst tid på badet?", textEn: "Who spends more time in the bathroom?", category: "hverdag" },
  { id: "shoe_6", textNo: "Hvem er flinkest til å lage mat?", textEn: "Who is the better cook?", category: "hverdag" },
  { id: "shoe_7", textNo: "Hvem holder orden i hjemmet?", textEn: "Who keeps the house tidy?", category: "hverdag" },
  { id: "shoe_8", textNo: "Hvem er morgenfuglen?", textEn: "Who is the early bird?", category: "hverdag" },
  { id: "shoe_9", textNo: "Hvem styrer fjernkontrollen?", textEn: "Who controls the remote?", category: "hverdag" },
  { id: "shoe_10", textNo: "Hvem snorker?", textEn: "Who snores?", category: "hverdag" },
  { id: "shoe_11", textNo: "Hvem vinner i en diskusjon?", textEn: "Who wins an argument?", category: "personlighet" },
  { id: "shoe_12", textNo: "Hvem er den mest sta?", textEn: "Who is more stubborn?", category: "personlighet" },
  { id: "shoe_13", textNo: "Hvem glemmer oftest ting?", textEn: "Who forgets things most often?", category: "personlighet" },
  { id: "shoe_14", textNo: "Hvem er den morsomste?", textEn: "Who is funnier?", category: "personlighet" },
  { id: "shoe_15", textNo: "Hvem sier unnskyld først etter en krangel?", textEn: "Who apologizes first after a fight?", category: "personlighet" },
  { id: "shoe_16", textNo: "Hvem bruker mest penger?", textEn: "Who spends more money?", category: "økonomi" },
  { id: "shoe_17", textNo: "Hvem planla bryllupet mest?", textEn: "Who planned the wedding the most?", category: "bryllup" },
  { id: "shoe_18", textNo: "Hvem var mest nervøs i dag?", textEn: "Who was more nervous today?", category: "bryllup" },
  { id: "shoe_19", textNo: "Hvem gråt først i dag?", textEn: "Who cried first today?", category: "bryllup" },
  { id: "shoe_20", textNo: "Hvem kommer til å bestemme hvor dere skal på bryllupsreise?", textEn: "Who will decide the honeymoon destination?", category: "bryllup" },
  { id: "shoe_21", textNo: "Hvem kjører best?", textEn: "Who is the better driver?", category: "hverdag" },
  { id: "shoe_22", textNo: "Hvem velger film på filmnatt?", textEn: "Who picks the movie on movie night?", category: "hverdag" },
  { id: "shoe_23", textNo: "Hvem synger høyest i dusjen?", textEn: "Who sings the loudest in the shower?", category: "morsomt" },
  { id: "shoe_24", textNo: "Hvem hadde den verste frisyren som ung?", textEn: "Who had the worst hairstyle as a kid?", category: "morsomt" },
  { id: "shoe_25", textNo: "Hvem er den beste danseren?", textEn: "Who is the better dancer?", category: "morsomt" },
];

// ─── Corporate Icebreaker Presets ───────────────────────────────
export const ICEBREAKER_QUESTIONS: QaGameQuestion[] = [
  { id: "ice_1", textNo: "Hva er din skjulte superkraft?", textEn: "What is your hidden superpower?", category: "personlig" },
  { id: "ice_2", textNo: "Hva ville du gjort hvis du ikke jobbet her?", textEn: "What would you do if you didn't work here?", category: "personlig" },
  { id: "ice_3", textNo: "Hva er det beste ferietipset ditt?", textEn: "What is your best vacation tip?", category: "personlig" },
  { id: "ice_4", textNo: "Hva handler den siste boken du leste om?", textEn: "What was the last book you read about?", category: "kultur" },
  { id: "ice_5", textNo: "Hvis laget vårt var en film, hvilken genre ville det vært?", textEn: "If our team was a movie, what genre would it be?", category: "team" },
  { id: "ice_6", textNo: "Hva er den største utfordringen i vår bransje akkurat nå?", textEn: "What is the biggest challenge in our industry right now?", category: "bransje" },
  { id: "ice_7", textNo: "Hva motiverer deg mest i jobben?", textEn: "What motivates you most at work?", category: "team" },
  { id: "ice_8", textNo: "Hvis du kunne ha lunsj med hvem som helst, hvem ville det vært?", textEn: "If you could have lunch with anyone, who would it be?", category: "personlig" },
];

// ─── Party/Celebration Two Truths Presets ───────────────────────
export const TWO_TRUTHS_QUESTIONS: QaGameQuestion[] = [
  { id: "tt_1", textNo: "Fortell to sannheter og en løgn – gjestene gjetter!", textEn: "Tell two truths and a lie – guests guess!", category: "lek" },
  { id: "tt_2", textNo: "Hva er noe overraskende folk ikke vet om deg?", textEn: "What is something surprising people don't know about you?", category: "lek" },
  { id: "tt_3", textNo: "Hva er ditt mest pinlige øyeblikk?", textEn: "What is your most embarrassing moment?", category: "lek" },
];

export const EVENT_TYPE_CONFIGS: Record<EventType, EventTypeConfig> = {
  // ─── B2C: Life Events ───────────────────────────────────────
  wedding: {
    type: "wedding",
    category: "personal",
    labelNo: "Bryllup",
    labelEn: "Wedding",
    icon: "💒",
    descriptionNo: "Planlegg bryllupet med alle verktøy",
    descriptionEn: "Plan your wedding with all the tools",
    features: {
      traditions: true,
      dressTracking: true,
      weddingPartyRoles: true,
      speeches: true,
      photoplan: true,
      seating: true,
      coupleProfile: true,
      importantPeople: true,
      sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Tradisjoner", en: "Traditions", descriptionNo: "Kulturelle bryllupstradisjoner", descriptionEn: "Cultural wedding traditions" },
      dressTracking: { no: "Antrekk & Styling", en: "Attire & Styling", descriptionNo: "Brudekjole, hår og makeup", descriptionEn: "Wedding dress, hair and makeup" },
    },
    attireVendorHints: {
      storesNo: ["Brudehuset", "Drømmekjolen", "Menswear", "Bogstad Herremagasin"],
      storesEn: ["Bridal Shop", "Wedding Dress Boutique", "Menswear"],
      searchTermsNo: ["brudekjole", "brudgom drakt", "bryllupsantrekk", "brudekjole oslo"],
      searchTermsEn: ["wedding dress", "groom suit", "bridal gown"],
    },
    roleLabels: {
      primary: { no: "Brud", en: "Bride" },
      secondary: { no: "Brudgom", en: "Groom" },
      guestLabel: { no: "Gjester", en: "Guests" },
    },
    dateLabel: { no: "Bryllupsdato", en: "Wedding Date" },
    shareLabel: {
      titleNo: "Del bryllupet",
      titleEn: "Share Wedding",
      subtitleNo: "Inviter partneren din, toastmaster og forlovere",
      subtitleEn: "Invite your partner, toastmaster and best man/maid of honor",
      shareMessageNo: "Hei {name}! Du er invitert til bryllupet vårt på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to our wedding on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
    qaGames: [
      {
        mode: "shoe_game",
        labelNo: "Skoleken",
        labelEn: "The Shoe Game",
        descriptionNo: "Den klassiske bryllupsleken med sko!",
        descriptionEn: "The classic wedding shoe game!",
        icon: "👟",
        instructionsNo: [
          "Brud og brudgom sitter på stoler med ryggen mot hverandre",
          "Begge tar av seg skoene og bytter én sko med hverandre",
          "Verten leser opp spørsmål – svaret er enten «Brud» eller «Brudgom»",
          "Paret svarer ved å løfte opp den riktige skoen",
          "Gjestene koser seg med å se om parene er enige!",
        ],
        instructionsEn: [
          "Bride and groom sit on chairs back to back",
          "Both take off their shoes and swap one shoe with each other",
          "The host reads questions – the answer is either 'Bride' or 'Groom'",
          "The couple answers by raising the correct shoe",
          "Guests enjoy seeing if the couple agrees!",
        ],
        presetQuestions: [], // Will reference SHOE_GAME_QUESTIONS
      },
      {
        mode: "qa_open",
        labelNo: "Åpne spørsmål",
        labelEn: "Open Q&A",
        descriptionNo: "Gjestene stiller spørsmål til brudeparet",
        descriptionEn: "Guests ask questions to the couple",
        icon: "💬",
        instructionsNo: [
          "Gjestene skriver inn spørsmål fra telefonen",
          "Spørsmål kan modereres av toastmaster/vert",
          "Populære spørsmål stemmes opp av gjestene",
          "Brudeparet svarer på de mest populære spørsmålene",
        ],
        instructionsEn: [
          "Guests submit questions from their phone",
          "Questions can be moderated by the toastmaster/host",
          "Popular questions are upvoted by guests",
          "The couple answers the most popular questions",
        ],
        presetQuestions: [],
      },
    ],
  },

  confirmation: {
    type: "confirmation",
    category: "personal",
    labelNo: "Konfirmasjon",
    labelEn: "Confirmation",
    icon: "⛪",
    descriptionNo: "Planlegg konfirmasjonen steg for steg",
    descriptionEn: "Plan the confirmation step by step",
    features: {
      traditions: true,
      dressTracking: true,
      weddingPartyRoles: false,
      speeches: true,
      photoplan: true,
      seating: true,
      coupleProfile: false,
      importantPeople: true,
      sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Seremoni & Oppsett", en: "Ceremony & Setup", descriptionNo: "Kirkeseremoni og festoppsett", descriptionEn: "Church ceremony and party setup" },
      dressTracking: { no: "Antrekk & Bunad", en: "Outfit & Bunad", descriptionNo: "Bunad, kjole eller dress", descriptionEn: "Bunad, dress or suit" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "Volt", "Cubus", "H&M", "Bunadbutikken", "Match"],
      storesEn: ["Dressmann", "Volt", "Cubus", "H&M", "Bunad Shop"],
      searchTermsNo: ["konfirmasjonsantrekk", "bunad", "dress", "konfirmasjonskjole", "ungdomsklær"],
      searchTermsEn: ["confirmation outfit", "bunad", "suit", "formal wear"],
    },
    roleLabels: {
      primary: { no: "Konfirmant", en: "Confirmand" },
      secondary: { no: "Forelder", en: "Parent" },
      guestLabel: { no: "Gjester", en: "Guests" },
    },
    dateLabel: { no: "Konfirmasjonsdato", en: "Confirmation Date" },
    shareLabel: {
      titleNo: "Del konfirmasjonen",
      titleEn: "Share Confirmation",
      subtitleNo: "Inviter den andre forelderen eller medarrangør",
      subtitleEn: "Invite the other parent or co-organizer",
      shareMessageNo: "Hei {name}! Du er invitert til konfirmasjonsfeiringen på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the confirmation celebration on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
  },

  birthday: {
    type: "birthday",
    category: "personal",
    labelNo: "Bursdag",
    labelEn: "Birthday",
    icon: "🎂",
    descriptionNo: "Planlegg bursdagsfeiringen",
    descriptionEn: "Plan the birthday celebration",
    features: {
      traditions: true,
      dressTracking: true,
      weddingPartyRoles: false,
      speeches: true,
      photoplan: true,
      seating: true,
      coupleProfile: false,
      importantPeople: true,
      sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Tema & Oppsett", en: "Theme & Setup", descriptionNo: "Temafest, dekorasjon og oppsett", descriptionEn: "Theme party, decoration and setup" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Antrekkskode og tema", descriptionEn: "Dress code and theme" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "H&M", "Zara", "Volt", "Match", "Cubus"],
      storesEn: ["Dressmann", "H&M", "Zara", "Volt"],
      searchTermsNo: ["festantrekk", "dresscode", "festklær", "bursdagsantrekk"],
      searchTermsEn: ["party outfit", "dress code", "formal wear"],
    },
    roleLabels: {
      primary: { no: "Jubilant", en: "Birthday Person" },
      secondary: { no: "Medarrangør", en: "Co-organizer" },
      guestLabel: { no: "Gjester", en: "Guests" },
    },
    dateLabel: { no: "Bursdagsdato", en: "Birthday Date" },
    shareLabel: {
      titleNo: "Del bursdagen",
      titleEn: "Share Birthday",
      subtitleNo: "Inviter medarrangør til bursdagsfeiringen",
      subtitleEn: "Invite a co-organizer to the birthday celebration",
      shareMessageNo: "Hei {name}! Du er invitert til bursdagsfeiringen på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the birthday celebration on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
    qaGames: [
      {
        mode: "two_truths",
        labelNo: "To sannheter og en løgn",
        labelEn: "Two Truths and a Lie",
        descriptionNo: "Gjett hva som er sant og usant!",
        descriptionEn: "Guess what's true and false!",
        icon: "🤥",
        instructionsNo: [
          "Jubilanten forteller tre ting om seg selv",
          "To av dem er sanne, en er løgn",
          "Gjestene stemmer på hvilken de tror er løgn",
          "Jubilanten avslører svaret!",
        ],
        instructionsEn: [
          "The birthday person tells three things about themselves",
          "Two are true, one is a lie",
          "Guests vote on which one is the lie",
          "The birthday person reveals the answer!",
        ],
        presetQuestions: [],
      },
      {
        mode: "qa_open",
        labelNo: "Åpne spørsmål",
        labelEn: "Open Q&A",
        descriptionNo: "Still spørsmål til jubilanten",
        descriptionEn: "Ask questions to the birthday person",
        icon: "💬",
        instructionsNo: [
          "Gjestene skriver inn spørsmål",
          "Populære spørsmål stemmes opp",
          "Jubilanten svarer på de mest populære",
        ],
        instructionsEn: [
          "Guests submit questions",
          "Popular questions are upvoted",
          "The birthday person answers the most popular ones",
        ],
        presetQuestions: [],
      },
    ],
  },

  anniversary: {
    type: "anniversary",
    category: "personal",
    labelNo: "Jubileum",
    labelEn: "Anniversary",
    icon: "💍",
    descriptionNo: "Feir jubileet med stil",
    descriptionEn: "Celebrate the anniversary in style",
    features: {
      traditions: true,
      dressTracking: true,
      weddingPartyRoles: false,
      speeches: true,
      photoplan: true,
      seating: true,
      coupleProfile: true,
      importantPeople: true,
      sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Tema & Oppsett", en: "Theme & Setup", descriptionNo: "Jubiléumstema og bordoppsett", descriptionEn: "Anniversary theme and table setup" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Antrekkskode for feiringen", descriptionEn: "Dress code for the celebration" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "Bogstad Herremagasin", "H&M", "Zara", "Match"],
      storesEn: ["Dressmann", "H&M", "Zara"],
      searchTermsNo: ["festantrekk", "dresscode", "selskapsklær"],
      searchTermsEn: ["celebration outfit", "formal wear", "party attire"],
    },
    roleLabels: {
      primary: { no: "Vert", en: "Host" },
      secondary: { no: "Medvert", en: "Co-host" },
      guestLabel: { no: "Gjester", en: "Guests" },
    },
    dateLabel: { no: "Jubileumsdato", en: "Anniversary Date" },
    shareLabel: {
      titleNo: "Del jubileet",
      titleEn: "Share Anniversary",
      subtitleNo: "Inviter partneren din eller medarrangør",
      subtitleEn: "Invite your partner or co-organizer",
      shareMessageNo: "Hei {name}! Du er invitert til jubileumsfeiringen på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the anniversary celebration on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
  },

  engagement: {
    type: "engagement",
    category: "personal",
    labelNo: "Forlovelse",
    labelEn: "Engagement Party",
    icon: "💎",
    descriptionNo: "Planlegg forlovelsesfesten",
    descriptionEn: "Plan the engagement party",
    features: {
      traditions: true,
      dressTracking: true,
      weddingPartyRoles: false,
      speeches: true,
      photoplan: true,
      seating: true,
      coupleProfile: true,
      importantPeople: true,
      sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Tema & Oppsett", en: "Theme & Setup", descriptionNo: "Festtema og dekorasjon", descriptionEn: "Party theme and decoration" },
      dressTracking: { no: "Antrekk", en: "Outfit", descriptionNo: "Festantrekk og styling", descriptionEn: "Party outfit and styling" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "H&M", "Zara", "Volt", "Match"],
      storesEn: ["Dressmann", "H&M", "Zara", "Volt"],
      searchTermsNo: ["festantrekk", "forlovelsesantrekk", "kjole", "dress"],
      searchTermsEn: ["engagement outfit", "party dress", "formal wear"],
    },
    roleLabels: {
      primary: { no: "Forlovet", en: "Fiancée" },
      secondary: { no: "Forlovet", en: "Fiancé" },
      guestLabel: { no: "Gjester", en: "Guests" },
    },
    dateLabel: { no: "Festdato", en: "Party Date" },
    shareLabel: {
      titleNo: "Del forlovelsen",
      titleEn: "Share Engagement",
      subtitleNo: "Inviter din forlovede",
      subtitleEn: "Invite your fiancé(e)",
      shareMessageNo: "Hei {name}! Du er invitert til forlovelsesfesten på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the engagement party on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
  },

  baby_shower: {
    type: "baby_shower",
    category: "personal",
    labelNo: "Babyshower / Dåp",
    labelEn: "Baby Shower / Baptism",
    icon: "👶",
    descriptionNo: "Planlegg babyshower eller dåp",
    descriptionEn: "Plan the baby shower or baptism",
    features: {
      traditions: true,
      dressTracking: true,
      weddingPartyRoles: false,
      speeches: true,
      photoplan: true,
      seating: true,
      coupleProfile: false,
      importantPeople: true,
      sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Tradisjon & Seremoni", en: "Tradition & Ceremony", descriptionNo: "Dåpstradisjon og seremoni", descriptionEn: "Baptism tradition and ceremony" },
      dressTracking: { no: "Antrekk", en: "Outfit", descriptionNo: "Dåpskjole og antrekk", descriptionEn: "Baptism gown and outfit" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "H&M", "Cubus", "Lindex"],
      storesEn: ["H&M", "Cubus", "Lindex"],
      searchTermsNo: ["dåpsantrekk", "dåpskjole", "festantrekk"],
      searchTermsEn: ["baptism outfit", "christening gown", "formal wear"],
    },
    roleLabels: {
      primary: { no: "Arrangør", en: "Host" },
      secondary: { no: "Medarrangør", en: "Co-host" },
      guestLabel: { no: "Gjester", en: "Guests" },
    },
    dateLabel: { no: "Dato", en: "Date" },
    shareLabel: {
      titleNo: "Del arrangementet",
      titleEn: "Share Event",
      subtitleNo: "Inviter medarrangør til babyshoweren",
      subtitleEn: "Invite a co-organizer to the baby shower",
      shareMessageNo: "Hei {name}! Du er invitert til babyshoweren på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the baby shower on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
  },

  // ─── B2B: Professional & Strategic ──────────────────────────
  conference: {
    type: "conference",
    category: "corporate",
    corporateSubCategory: "professional_strategic",
    labelNo: "Konferanse / Fagseminar",
    labelEn: "Conference / Industry Seminar",
    icon: "🎤",
    descriptionNo: "Kompetanseheving, bransjedeling, synlighet",
    descriptionEn: "Competence building, industry sharing, visibility",
    typicalContentNo: ["Keynote speakers", "Paneldebatter", "Breakout sessions", "Sponsorstands"],
    typicalContentEn: ["Keynote speakers", "Panel debates", "Breakout sessions", "Sponsor booths"],
    features: {
      traditions: true, dressTracking: true, weddingPartyRoles: false,
      speeches: true, photoplan: true, seating: true,
      coupleProfile: false, importantPeople: true, sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Format & Program", en: "Format & Program", descriptionNo: "Programstruktur og sesjonsformat", descriptionEn: "Program structure and session format" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Antrekkskode for deltakere", descriptionEn: "Dress code for attendees" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "Volt", "H&M", "Zara", "Hugo Boss"],
      storesEn: ["Dressmann", "Volt", "H&M", "Zara", "Hugo Boss"],
      searchTermsNo: ["business antrekk", "dresscode", "konferanseantrekk", "formellt"],
      searchTermsEn: ["business attire", "dress code", "conference wear", "formal"],
    },
    roleLabels: {
      primary: { no: "Arrangør", en: "Organizer" },
      secondary: { no: "Programansvarlig", en: "Program Lead" },
      guestLabel: { no: "Deltakere", en: "Delegates" },
    },
    dateLabel: { no: "Konferansedato", en: "Conference Date" },
    shareLabel: {
      titleNo: "Del arrangementet", titleEn: "Share Event",
      subtitleNo: "Inviter medarrangør, programansvarlig eller kollega",
      subtitleEn: "Invite a co-organizer, program lead or colleague",
      shareMessageNo: "Hei {name}! Du er invitert til konferansen på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the conference on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
    qaGames: [
      {
        mode: "icebreaker",
        labelNo: "Icebreaker",
        labelEn: "Icebreaker",
        descriptionNo: "Bli bedre kjent med kollegene!",
        descriptionEn: "Get to know your colleagues better!",
        icon: "🧊",
        instructionsNo: [
          "Deltakerne svarer på icebreaker-spørsmål",
          "Svarene vises anonymt eller med navn",
          "Perfekt for å bli kjent og bryte isen",
        ],
        instructionsEn: [
          "Participants answer icebreaker questions",
          "Answers shown anonymously or with names",
          "Perfect for getting to know each other",
        ],
        presetQuestions: [],
      },
      {
        mode: "qa_open",
        labelNo: "Spørsmål til foredragsholder",
        labelEn: "Speaker Q&A",
        descriptionNo: "Deltakerne stiller spørsmål til taleren",
        descriptionEn: "Attendees ask questions to the speaker",
        icon: "🎤",
        instructionsNo: [
          "Deltakerne sender inn spørsmål under presentasjonen",
          "Spørsmål kan modereres av arrangør",
          "Populære spørsmål stemmes opp",
          "Taleren svarer på de mest populære spørsmålene",
        ],
        instructionsEn: [
          "Attendees submit questions during the presentation",
          "Questions can be moderated by the organizer",
          "Popular questions are upvoted",
          "The speaker answers the most popular questions",
        ],
        presetQuestions: [],
      },
    ],
  },

  seminar: {
    type: "seminar",
    category: "corporate",
    corporateSubCategory: "professional_strategic",
    labelNo: "Seminar / Workshop",
    labelEn: "Seminar / Workshop",
    icon: "📋",
    descriptionNo: "Kunnskapsdeling og kompetansebygging",
    descriptionEn: "Knowledge sharing and competence building",
    typicalContentNo: ["Presentasjoner", "Gruppearbeid", "Diskusjoner", "Nettverking"],
    typicalContentEn: ["Presentations", "Group work", "Discussions", "Networking"],
    features: {
      traditions: true, dressTracking: true, weddingPartyRoles: false,
      speeches: true, photoplan: false, seating: true,
      coupleProfile: false, importantPeople: true, sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Format & Oppsett", en: "Format & Setup", descriptionNo: "Workshop-format og gruppearbeid", descriptionEn: "Workshop format and group work" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Antrekkskode for deltakere", descriptionEn: "Dress code for participants" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "H&M", "Volt"],
      storesEn: ["Dressmann", "H&M", "Volt"],
      searchTermsNo: ["business casual", "seminarantrekk", "dresscode"],
      searchTermsEn: ["business casual", "seminar attire", "dress code"],
    },
    roleLabels: {
      primary: { no: "Arrangør", en: "Organizer" },
      secondary: { no: "Fasilitator", en: "Facilitator" },
      guestLabel: { no: "Deltakere", en: "Participants" },
    },
    dateLabel: { no: "Seminardato", en: "Seminar Date" },
    shareLabel: {
      titleNo: "Del arrangementet", titleEn: "Share Event",
      subtitleNo: "Inviter medarrangør eller fasilitator",
      subtitleEn: "Invite a co-organizer or facilitator",
      shareMessageNo: "Hei {name}! Du er invitert til seminaret på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the seminar on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
    qaGames: [
      {
        mode: "icebreaker",
        labelNo: "Icebreaker",
        labelEn: "Icebreaker",
        descriptionNo: "Bli bedre kjent med deltakerne!",
        descriptionEn: "Get to know the participants!",
        icon: "🧊",
        instructionsNo: [
          "Deltakerne svarer på icebreaker-spørsmål",
          "Svarene kan deles anonymt eller med navn",
          "Perfekt for å bryte isen i en workshop",
        ],
        instructionsEn: [
          "Participants answer icebreaker questions",
          "Answers can be shared anonymously or with names",
          "Perfect for breaking the ice in a workshop",
        ],
        presetQuestions: [],
      },
      {
        mode: "qa_open",
        labelNo: "Spørsmål til foredragsholder",
        labelEn: "Speaker Q&A",
        descriptionNo: "Deltakerne stiller spørsmål til innleder",
        descriptionEn: "Attendees ask questions to the speaker",
        icon: "🎤",
        instructionsNo: [
          "Deltakerne sender inn spørsmål under presentasjonen",
          "Spørsmål kan modereres av arrangør",
          "Populære spørsmål stemmes opp",
        ],
        instructionsEn: [
          "Attendees submit questions during the presentation",
          "Questions can be moderated by the organizer",
          "Popular questions are upvoted",
        ],
        presetQuestions: [],
      },
    ],
  },

  kickoff: {
    type: "kickoff",
    category: "corporate",
    corporateSubCategory: "professional_strategic",
    labelNo: "Strategisamling / Kickoff",
    labelEn: "Strategy Gathering / Kickoff",
    icon: "🎯",
    descriptionNo: "Sette retning, mål og motivasjon — ofte 1–2 dager",
    descriptionEn: "Set direction, goals and motivation — often 1–2 days",
    typicalContentNo: ["Presentasjon av budsjett og mål", "Teambuilding", "Sosiale aktiviteter på kvelden"],
    typicalContentEn: ["Budget and goals presentation", "Team building", "Evening social activities"],
    features: {
      traditions: true, dressTracking: true, weddingPartyRoles: false,
      speeches: true, photoplan: true, seating: true,
      coupleProfile: false, importantPeople: true, sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Format & Agenda", en: "Format & Agenda", descriptionNo: "Dagsprogram og aktivitetsformat", descriptionEn: "Day program and activity format" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Avslappet, smart casual eller formelt", descriptionEn: "Casual, smart casual or formal" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "H&M", "Volt", "Stormberg"],
      storesEn: ["Dressmann", "H&M", "Volt", "Stormberg"],
      searchTermsNo: ["smart casual", "kickoff antrekk", "business casual"],
      searchTermsEn: ["smart casual", "kickoff outfit", "business casual"],
    },
    roleLabels: {
      primary: { no: "Arrangør", en: "Organizer" },
      secondary: { no: "Avdelingsleder", en: "Department Lead" },
      guestLabel: { no: "Deltakere", en: "Attendees" },
    },
    dateLabel: { no: "Kickoff-dato", en: "Kickoff Date" },
    shareLabel: {
      titleNo: "Del arrangementet", titleEn: "Share Event",
      subtitleNo: "Inviter medarrangør eller avdelingsleder",
      subtitleEn: "Invite a co-organizer or department lead",
      shareMessageNo: "Hei {name}! Du er invitert til kickoffen på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the kickoff on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
    qaGames: [
      {
        mode: "icebreaker",
        labelNo: "Icebreaker",
        labelEn: "Icebreaker",
        descriptionNo: "Bli kjent på tvers av avdelinger!",
        descriptionEn: "Get to know colleagues across departments!",
        icon: "🧊",
        instructionsNo: [
          "Alle svarer på oppvarmingsspørsmål",
          "Del svarene i små grupper eller for hele rommet",
          "Perfekt for å starte kickoffen med energi",
        ],
        instructionsEn: [
          "Everyone answers warm-up questions",
          "Share answers in small groups or for the whole room",
          "Perfect to start the kickoff with energy",
        ],
        presetQuestions: [],
      },
      {
        mode: "quiz",
        labelNo: "Bedriftsquiz",
        labelEn: "Company Quiz",
        descriptionNo: "Test kunnskapen om bedriften og kollegaene!",
        descriptionEn: "Test your knowledge about the company and colleagues!",
        icon: "🧠",
        instructionsNo: [
          "Arrangøren legger inn spørsmål om bedriften",
          "Deltakerne svarer i sanntid",
          "Den med flest riktige svar vinner!",
        ],
        instructionsEn: [
          "The organizer adds questions about the company",
          "Participants answer in real-time",
          "The one with the most correct answers wins!",
        ],
        presetQuestions: [],
      },
    ],
  },

  // ─── B2B: Social & Relationship Building ──────────────────
  summer_party: {
    type: "summer_party",
    category: "corporate",
    corporateSubCategory: "social_relational",
    labelNo: "Sommerfest",
    labelEn: "Summer Party",
    icon: "☀️",
    descriptionNo: "Uformell kulturbygging, ofte utendørs",
    descriptionEn: "Informal culture building, often outdoors",
    typicalContentNo: ["Uformell stemning", "Utendørs aktiviteter", "Grilling", "Underholdning"],
    typicalContentEn: ["Casual atmosphere", "Outdoor activities", "BBQ", "Entertainment"],
    features: {
      traditions: true, dressTracking: true, weddingPartyRoles: false,
      speeches: true, photoplan: true, seating: true,
      coupleProfile: false, importantPeople: true, sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Tema & Oppsett", en: "Theme & Setup", descriptionNo: "Utendørstema og festoppsett", descriptionEn: "Outdoor theme and party setup" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Uformelt / sommerlig antrekk", descriptionEn: "Casual / summer attire" },
    },
    attireVendorHints: {
      storesNo: ["H&M", "Cubus", "Lindex", "Stormberg"],
      storesEn: ["H&M", "Cubus", "Stormberg"],
      searchTermsNo: ["sommerantrekk", "uformelt", "casual"],
      searchTermsEn: ["summer outfit", "casual wear"],
    },
    roleLabels: {
      primary: { no: "Arrangør", en: "Organizer" },
      secondary: { no: "Sosialansvarlig", en: "Social Coordinator" },
      guestLabel: { no: "Ansatte", en: "Employees" },
    },
    dateLabel: { no: "Festdato", en: "Party Date" },
    shareLabel: {
      titleNo: "Del arrangementet", titleEn: "Share Event",
      subtitleNo: "Inviter sosialansvarlig eller medarrangør",
      subtitleEn: "Invite social coordinator or co-organizer",
      shareMessageNo: "Hei {name}! Du er invitert til sommerfesten på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the summer party on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
    qaGames: [
      {
        mode: "quiz",
        labelNo: "Sommerfest-quiz",
        labelEn: "Summer Party Quiz",
        descriptionNo: "Morsom quiz for hele gjengen!",
        descriptionEn: "Fun quiz for the whole crew!",
        icon: "☀️",
        instructionsNo: [
          "Spill individuelt eller i lag",
          "Spørsmål om alt og ingenting",
          "Vinnerne får en premie!",
        ],
        instructionsEn: [
          "Play individually or in teams",
          "Questions about everything and nothing",
          "Winners get a prize!",
        ],
        presetQuestions: [],
      },
      {
        mode: "icebreaker",
        labelNo: "Sommer-icebreaker",
        labelEn: "Summer Icebreaker",
        descriptionNo: "Bli bedre kjent med kollegaene!",
        descriptionEn: "Get to know your colleagues better!",
        icon: "🧊",
        instructionsNo: [
          "Svar på lette og morsomme spørsmål",
          "Del favorittferieminner og sommerplaner",
          "Perfekt for uformell stemning",
        ],
        instructionsEn: [
          "Answer light and fun questions",
          "Share favorite vacation memories and summer plans",
          "Perfect for a casual atmosphere",
        ],
        presetQuestions: [],
      },
    ],
  },

  christmas_party: {
    type: "christmas_party",
    category: "corporate",
    corporateSubCategory: "social_relational",
    labelNo: "Julebord",
    labelEn: "Christmas Party",
    icon: "🎄",
    descriptionNo: "Formell middag med underholdning og tema",
    descriptionEn: "Formal dinner with entertainment and theme",
    typicalContentNo: ["Felles middag", "Underholdning", "Quiz / tema", "Dans"],
    typicalContentEn: ["Shared dinner", "Entertainment", "Quiz / theme", "Dancing"],
    features: {
      traditions: true, dressTracking: true, weddingPartyRoles: false,
      speeches: true, photoplan: true, seating: true,
      coupleProfile: false, importantPeople: true, sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Tema & Underholdning", en: "Theme & Entertainment", descriptionNo: "Juletema, quiz og underholdning", descriptionEn: "Christmas theme, quiz and entertainment" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Formelt, juletema eller avslappet", descriptionEn: "Formal, Christmas theme or casual" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "Volt", "H&M", "Zara", "Match"],
      storesEn: ["Dressmann", "Volt", "H&M", "Zara"],
      searchTermsNo: ["juleborantrekk", "festantrekk", "dresscode", "formelt"],
      searchTermsEn: ["christmas party outfit", "formal wear", "dress code"],
    },
    roleLabels: {
      primary: { no: "Arrangør", en: "Organizer" },
      secondary: { no: "Sosialkomité", en: "Social Committee" },
      guestLabel: { no: "Ansatte", en: "Employees" },
    },
    dateLabel: { no: "Juleborddato", en: "Party Date" },
    shareLabel: {
      titleNo: "Del arrangementet", titleEn: "Share Event",
      subtitleNo: "Inviter sosialkomité eller medarrangør",
      subtitleEn: "Invite social committee or co-organizer",
      shareMessageNo: "Hei {name}! Du er invitert til julebordet på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the Christmas party on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
    qaGames: [
      {
        mode: "quiz",
        labelNo: "Julebordsquiz",
        labelEn: "Christmas Quiz",
        descriptionNo: "Test julekunnskapen til kollegaene!",
        descriptionEn: "Test your colleagues' Christmas knowledge!",
        icon: "🎅",
        instructionsNo: [
          "Spill lagvis eller individuelt",
          "Spørsmål om jul, bedriften og kollegaene",
          "Laget med flest poeng vinner!",
        ],
        instructionsEn: [
          "Play in teams or individually",
          "Questions about Christmas, the company and colleagues",
          "The team with the most points wins!",
        ],
        presetQuestions: [],
      },
      {
        mode: "icebreaker",
        labelNo: "Jule-icebreaker",
        labelEn: "Christmas Icebreaker",
        descriptionNo: "Morsomme julerelaterte spørsmål!",
        descriptionEn: "Fun Christmas-related questions!",
        icon: "🎄",
        instructionsNo: [
          "Svar på julerelaterte oppvarmingsspørsmål",
          "Del favorittjuletradisjoner og minner",
          "Perfekt for å komme i julestemning",
        ],
        instructionsEn: [
          "Answer Christmas-related warm-up questions",
          "Share favorite Christmas traditions and memories",
          "Perfect for getting into the holiday spirit",
        ],
        presetQuestions: [],
      },
    ],
  },

  team_building: {
    type: "team_building",
    category: "corporate",
    corporateSubCategory: "social_relational",
    labelNo: "Teambuilding",
    labelEn: "Team Building",
    icon: "🤝",
    descriptionNo: "Samarbeid og samhold — escape room, matlaging, tur",
    descriptionEn: "Collaboration and cohesion — escape room, cooking, outdoors",
    typicalContentNo: ["Escape room", "Matlagingskurs", "Rafting / fjelltur", "Vinteraktiviteter"],
    typicalContentEn: ["Escape room", "Cooking class", "Rafting / hiking", "Winter activities"],
    features: {
      traditions: true, dressTracking: true, weddingPartyRoles: false,
      speeches: false, photoplan: false, seating: false,
      coupleProfile: false, importantPeople: true, sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Aktiviteter & Format", en: "Activities & Format", descriptionNo: "Aktivitetstype og gruppeformat", descriptionEn: "Activity type and group format" },
      dressTracking: { no: "Antrekk", en: "Attire", descriptionNo: "Komfortable klær for aktiviteter", descriptionEn: "Comfortable clothing for activities" },
    },
    attireVendorHints: {
      storesNo: ["Stormberg", "XXL", "H&M", "Cubus"],
      storesEn: ["Stormberg", "XXL", "H&M"],
      searchTermsNo: ["aktivitetsklær", "sportsklær", "komfortabelt"],
      searchTermsEn: ["activewear", "sportswear", "comfortable"],
    },
    roleLabels: {
      primary: { no: "Arrangør", en: "Organizer" },
      secondary: { no: "Teamleder", en: "Team Lead" },
      guestLabel: { no: "Deltakere", en: "Participants" },
    },
    dateLabel: { no: "Dato", en: "Date" },
    shareLabel: {
      titleNo: "Del arrangementet", titleEn: "Share Event",
      subtitleNo: "Inviter teamleder eller medarrangør",
      subtitleEn: "Invite team lead or co-organizer",
      shareMessageNo: "Hei {name}! Du er invitert til teambuildingen på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the team building event on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
    qaGames: [
      {
        mode: "two_truths",
        labelNo: "To sannheter, én løgn",
        labelEn: "Two Truths, One Lie",
        descriptionNo: "Hvor godt kjenner du kollegaene?",
        descriptionEn: "How well do you know your colleagues?",
        icon: "🤔",
        instructionsNo: [
          "Hver person deler to sannheter og én løgn",
          "De andre gjetter hva som er løgn",
          "Riktig gjett gir poeng!",
        ],
        instructionsEn: [
          "Each person shares two truths and one lie",
          "Others guess which is the lie",
          "Correct guesses earn points!",
        ],
        presetQuestions: [],
      },
      {
        mode: "icebreaker",
        labelNo: "Icebreaker",
        labelEn: "Icebreaker",
        descriptionNo: "Oppvarmingsspørsmål for teamet!",
        descriptionEn: "Warm-up questions for the team!",
        icon: "🧊",
        instructionsNo: [
          "Svar på morsomme og uventede spørsmål",
          "Del svarene i teamet",
          "Perfekt for å bygge samhold",
        ],
        instructionsEn: [
          "Answer fun and unexpected questions",
          "Share answers within the team",
          "Perfect for building cohesion",
        ],
        presetQuestions: [],
      },
    ],
  },

  // ─── B2B: External-facing ─────────────────────────────────
  product_launch: {
    type: "product_launch",
    category: "corporate",
    corporateSubCategory: "external_facing",
    labelNo: "Produktlansering",
    labelEn: "Product Launch",
    icon: "🚀",
    descriptionNo: "PR og merkevarebygging — presse, kunder, investorer",
    descriptionEn: "PR and branding — press, customers, investors",
    typicalContentNo: ["Sceneproduksjon", "Demo", "Mingling og nettverk", "Pressedekning"],
    typicalContentEn: ["Stage production", "Demo", "Mingling and networking", "Press coverage"],
    features: {
      traditions: true, dressTracking: true, weddingPartyRoles: false,
      speeches: true, photoplan: true, seating: true,
      coupleProfile: false, importantPeople: true, sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Konsept & Oppsett", en: "Concept & Setup", descriptionNo: "Scenografi, demo og presentasjon", descriptionEn: "Set design, demo and presentation" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Profesjonelt / business antrekk", descriptionEn: "Professional / business attire" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "Volt", "Hugo Boss", "Zara"],
      storesEn: ["Dressmann", "Hugo Boss", "Zara"],
      searchTermsNo: ["business antrekk", "profesjonelt", "lanseringsantrekk"],
      searchTermsEn: ["business attire", "professional wear", "launch outfit"],
    },
    roleLabels: {
      primary: { no: "Arrangør", en: "Organizer" },
      secondary: { no: "Prosjektleder", en: "Project Lead" },
      guestLabel: { no: "Inviterte", en: "Invitees" },
    },
    dateLabel: { no: "Lanseringsdato", en: "Launch Date" },
    shareLabel: {
      titleNo: "Del arrangementet", titleEn: "Share Event",
      subtitleNo: "Inviter prosjektleder eller medarrangør",
      subtitleEn: "Invite project lead or co-organizer",
      shareMessageNo: "Hei {name}! Du er invitert til produktlanseringen på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the product launch on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
    qaGames: [
      {
        mode: "qa_open",
        labelNo: "Spørsmål om produktet",
        labelEn: "Product Q&A",
        descriptionNo: "Deltakerne stiller spørsmål om det nye produktet",
        descriptionEn: "Attendees ask questions about the new product",
        icon: "🚀",
        instructionsNo: [
          "Send inn spørsmål under lanseringen",
          "Spørsmål kan modereres av arrangør",
          "De mest populære spørsmålene besvares live",
        ],
        instructionsEn: [
          "Submit questions during the launch",
          "Questions can be moderated by the organizer",
          "The most popular questions are answered live",
        ],
        presetQuestions: [],
      },
    ],
  },

  trade_fair: {
    type: "trade_fair",
    category: "corporate",
    corporateSubCategory: "external_facing",
    labelNo: "Messe / Bransjetreff",
    labelEn: "Trade Fair / Industry Meetup",
    icon: "🏛️",
    descriptionNo: "Leads og nettverk — stand, kunder, samarbeidspartnere",
    descriptionEn: "Leads and networking — booth, customers, partners",
    typicalContentNo: ["Standplass", "Kundemøter", "Nettverk", "Produktvisning"],
    typicalContentEn: ["Exhibition booth", "Client meetings", "Networking", "Product display"],
    features: {
      traditions: true, dressTracking: true, weddingPartyRoles: false,
      speeches: true, photoplan: true, seating: false,
      coupleProfile: false, importantPeople: true, sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Stand & Oppsett", en: "Booth & Setup", descriptionNo: "Standoppsett og kundemøter", descriptionEn: "Booth setup and client meetings" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Profesjonelt antrekk for messe", descriptionEn: "Professional attire for trade fair" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "Volt", "Hugo Boss"],
      storesEn: ["Dressmann", "Hugo Boss"],
      searchTermsNo: ["messeantrekk", "business antrekk", "profesjonelt"],
      searchTermsEn: ["trade fair attire", "business wear", "professional"],
    },
    roleLabels: {
      primary: { no: "Utstiller", en: "Exhibitor" },
      secondary: { no: "Standansvarlig", en: "Booth Manager" },
      guestLabel: { no: "Besøkende", en: "Visitors" },
    },
    dateLabel: { no: "Messedato", en: "Fair Date" },
    shareLabel: {
      titleNo: "Del arrangementet", titleEn: "Share Event",
      subtitleNo: "Inviter standansvarlig eller kollega",
      subtitleEn: "Invite booth manager or colleague",
      shareMessageNo: "Hei {name}! Du er invitert til messen på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the trade fair on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
    qaGames: [
      {
        mode: "qa_open",
        labelNo: "Spørsmål til utstillere",
        labelEn: "Exhibitor Q&A",
        descriptionNo: "Still spørsmål til utstillerne på messen",
        descriptionEn: "Ask questions to the exhibitors at the fair",
        icon: "🎪",
        instructionsNo: [
          "Send inn spørsmål til foredragsholdere og utstillere",
          "Spørsmål kan modereres av arrangør",
          "Populære spørsmål prioriteres",
        ],
        instructionsEn: [
          "Submit questions to speakers and exhibitors",
          "Questions can be moderated by the organizer",
          "Popular questions are prioritized",
        ],
        presetQuestions: [],
      },
    ],
  },

  // ─── B2B: HR & Internal Celebrations ──────────────────────
  corporate_anniversary: {
    type: "corporate_anniversary",
    category: "corporate",
    corporateSubCategory: "hr_internal",
    labelNo: "Jubileumsfeiring",
    labelEn: "Anniversary Celebration",
    icon: "🎊",
    descriptionNo: "Feir 10, 25 eller 50 år — bedriftsjubileum",
    descriptionEn: "Celebrate 10, 25 or 50 years — corporate anniversary",
    typicalContentNo: ["Taler", "Tilbakeblikk / historikk", "Prisutdeling", "Festmiddag"],
    typicalContentEn: ["Speeches", "Retrospective / history", "Awards", "Gala dinner"],
    features: {
      traditions: true, dressTracking: true, weddingPartyRoles: false,
      speeches: true, photoplan: true, seating: true,
      coupleProfile: false, importantPeople: true, sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Historikk & Oppsett", en: "History & Setup", descriptionNo: "Jubileumshistorikk og festoppsett", descriptionEn: "Anniversary history and celebration setup" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Formelt antrekk til jubileet", descriptionEn: "Formal attire for the anniversary" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "Volt", "Hugo Boss", "Zara"],
      storesEn: ["Dressmann", "Hugo Boss", "Zara"],
      searchTermsNo: ["festantrekk", "formelt", "galla"],
      searchTermsEn: ["formal wear", "celebration outfit", "gala"],
    },
    roleLabels: {
      primary: { no: "Arrangør", en: "Organizer" },
      secondary: { no: "Jubileumskomité", en: "Anniversary Committee" },
      guestLabel: { no: "Gjester", en: "Guests" },
    },
    dateLabel: { no: "Jubileumsdato", en: "Anniversary Date" },
    shareLabel: {
      titleNo: "Del arrangementet", titleEn: "Share Event",
      subtitleNo: "Inviter jubileumskomité eller medarrangør",
      subtitleEn: "Invite anniversary committee or co-organizer",
      shareMessageNo: "Hei {name}! Du er invitert til jubileumsfeiringen på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the anniversary celebration on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
  },

  awards_night: {
    type: "awards_night",
    category: "corporate",
    corporateSubCategory: "hr_internal",
    labelNo: "Prisutdeling / Galla",
    labelEn: "Awards Night / Gala",
    icon: "🏆",
    descriptionNo: "Pris- og utmerkelseskveld med formell ramme",
    descriptionEn: "Awards and recognition night with formal setting",
    typicalContentNo: ["Prisutdeling", "Taler", "Festmiddag", "Underholdning"],
    typicalContentEn: ["Awards ceremony", "Speeches", "Gala dinner", "Entertainment"],
    features: {
      traditions: true, dressTracking: true, weddingPartyRoles: false,
      speeches: true, photoplan: true, seating: true,
      coupleProfile: false, importantPeople: true, sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Seremoni & Program", en: "Ceremony & Program", descriptionNo: "Prisseremoni og underholdning", descriptionEn: "Awards ceremony and entertainment" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Galla / formelt antrekk", descriptionEn: "Gala / formal attire" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "Hugo Boss", "Volt", "Bogstad Herremagasin"],
      storesEn: ["Dressmann", "Hugo Boss", "Volt"],
      searchTermsNo: ["gallaantrekk", "formelt", "smoking", "lang kjole"],
      searchTermsEn: ["gala outfit", "formal wear", "tuxedo", "evening gown"],
    },
    roleLabels: {
      primary: { no: "Arrangør", en: "Organizer" },
      secondary: { no: "Seremonimester", en: "MC" },
      guestLabel: { no: "Gjester", en: "Guests" },
    },
    dateLabel: { no: "Galladato", en: "Gala Date" },
    shareLabel: {
      titleNo: "Del arrangementet", titleEn: "Share Event",
      subtitleNo: "Inviter seremonimester eller medarrangør",
      subtitleEn: "Invite MC or co-organizer",
      shareMessageNo: "Hei {name}! Du er invitert til gallaen på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the awards night on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
    qaGames: [
      {
        mode: "quiz",
        labelNo: "Gallakviss",
        labelEn: "Gala Quiz",
        descriptionNo: "Underholdende quiz mellom rettene!",
        descriptionEn: "Entertaining quiz between courses!",
        icon: "🏆",
        instructionsNo: [
          "Quiz mellom hovedrett og dessert",
          "Spørsmål om bedriftens historie og høydepunkter",
          "Vinnerlaget får en overraskelsespremie!",
        ],
        instructionsEn: [
          "Quiz between main course and dessert",
          "Questions about company history and highlights",
          "The winning team gets a surprise prize!",
        ],
        presetQuestions: [],
      },
      {
        mode: "qa_open",
        labelNo: "Spørsmål til ledelsen",
        labelEn: "Q&A with Management",
        descriptionNo: "Still spørsmål til ledelsen under gallaen",
        descriptionEn: "Ask questions to management during the gala",
        icon: "🎤",
        instructionsNo: [
          "Send inn spørsmål anonymt eller med navn",
          "De mest populære spørsmålene besvares live",
          "Arrangøren modererer spørsmålene",
        ],
        instructionsEn: [
          "Submit questions anonymously or with your name",
          "The most popular questions are answered live",
          "The organizer moderates the questions",
        ],
        presetQuestions: [],
      },
    ],
  },

  employee_day: {
    type: "employee_day",
    category: "corporate",
    corporateSubCategory: "hr_internal",
    labelNo: "Ansattdag / Mangfoldsarrangement",
    labelEn: "Employee Day / Diversity Event",
    icon: "🙌",
    descriptionNo: "Ansattdager, mangfold- og kulturarrangementer",
    descriptionEn: "Employee days, diversity and culture events",
    typicalContentNo: ["Foredrag", "Workshops", "Kulturelle innslag", "Sosialt samvær"],
    typicalContentEn: ["Talks", "Workshops", "Cultural performances", "Social gathering"],
    features: {
      traditions: true, dressTracking: true, weddingPartyRoles: false,
      speeches: true, photoplan: false, seating: false,
      coupleProfile: false, importantPeople: true, sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Program & Oppsett", en: "Program & Setup", descriptionNo: "Foredrag, workshops og kultur", descriptionEn: "Talks, workshops and culture" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Avslappet eller business casual", descriptionEn: "Casual or business casual" },
    },
    attireVendorHints: {
      storesNo: ["H&M", "Cubus", "Dressmann"],
      storesEn: ["H&M", "Cubus", "Dressmann"],
      searchTermsNo: ["business casual", "kontorantrekk"],
      searchTermsEn: ["business casual", "office wear"],
    },
    roleLabels: {
      primary: { no: "HR-ansvarlig", en: "HR Lead" },
      secondary: { no: "Medarrangør", en: "Co-organizer" },
      guestLabel: { no: "Ansatte", en: "Employees" },
    },
    dateLabel: { no: "Dato", en: "Date" },
    shareLabel: {
      titleNo: "Del arrangementet", titleEn: "Share Event",
      subtitleNo: "Inviter HR-kollega eller medarrangør",
      subtitleEn: "Invite HR colleague or co-organizer",
      shareMessageNo: "Hei {name}! Du er invitert til ansattdagen på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the employee day on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
    qaGames: [
      {
        mode: "icebreaker",
        labelNo: "Icebreaker",
        labelEn: "Icebreaker",
        descriptionNo: "Bli bedre kjent på tvers av avdelinger!",
        descriptionEn: "Get to know people across departments!",
        icon: "🧊",
        instructionsNo: [
          "Svar på oppvarmingsspørsmål",
          "Del morsomme fakta om deg selv",
          "Perfekt for å bygge fellesskap",
        ],
        instructionsEn: [
          "Answer warm-up questions",
          "Share fun facts about yourself",
          "Perfect for building community",
        ],
        presetQuestions: [],
      },
      {
        mode: "qa_open",
        labelNo: "Spørsmål til ledelsen",
        labelEn: "Q&A with Management",
        descriptionNo: "Still spørsmål til ledelsen under ansattdagen",
        descriptionEn: "Ask questions to management during employee day",
        icon: "🎤",
        instructionsNo: [
          "Send inn spørsmål anonymt eller med navn",
          "Populære spørsmål stemmes opp",
          "Ledelsen svarer live",
        ],
        instructionsEn: [
          "Submit questions anonymously or with your name",
          "Popular questions are upvoted",
          "Management answers live",
        ],
        presetQuestions: [],
      },
    ],
  },

  onboarding_day: {
    type: "onboarding_day",
    category: "corporate",
    corporateSubCategory: "hr_internal",
    labelNo: "Onboarding-dag",
    labelEn: "Onboarding Day",
    icon: "🎓",
    descriptionNo: "Velkomstdag for nye ansatte",
    descriptionEn: "Welcome day for new employees",
    typicalContentNo: ["Introduksjoner", "Kontoromvisning", "Teamlunsj", "Buddy-ordning"],
    typicalContentEn: ["Introductions", "Office tour", "Team lunch", "Buddy program"],
    features: {
      traditions: true, dressTracking: true, weddingPartyRoles: false,
      speeches: true, photoplan: false, seating: false,
      coupleProfile: false, importantPeople: true, sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Onboarding-program", en: "Onboarding Program", descriptionNo: "Introduksjon og fadderordning", descriptionEn: "Introduction and buddy program" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Kontorantrekk eller avslappet", descriptionEn: "Office attire or casual" },
    },
    attireVendorHints: {
      storesNo: ["H&M", "Cubus", "Dressmann"],
      storesEn: ["H&M", "Cubus", "Dressmann"],
      searchTermsNo: ["kontorantrekk", "casual", "business casual"],
      searchTermsEn: ["office attire", "casual", "business casual"],
    },
    roleLabels: {
      primary: { no: "HR-ansvarlig", en: "HR Lead" },
      secondary: { no: "Fadder", en: "Buddy" },
      guestLabel: { no: "Nye ansatte", en: "New Employees" },
    },
    dateLabel: { no: "Onboarding-dato", en: "Onboarding Date" },
    shareLabel: {
      titleNo: "Del arrangementet", titleEn: "Share Event",
      subtitleNo: "Inviter fadder eller HR-kollega",
      subtitleEn: "Invite buddy or HR colleague",
      shareMessageNo: "Hei {name}! Du er invitert til onboarding-dagen på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the onboarding day on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
    qaGames: [
      {
        mode: "two_truths",
        labelNo: "To sannheter, én løgn",
        labelEn: "Two Truths, One Lie",
        descriptionNo: "Bli kjent med de nye kollegaene!",
        descriptionEn: "Get to know your new colleagues!",
        icon: "🤔",
        instructionsNo: [
          "Hver person deler to sannheter og én løgn",
          "De andre gjetter hva som er løgn",
          "Morsom måte å bli kjent på!",
        ],
        instructionsEn: [
          "Each person shares two truths and one lie",
          "Others guess which is the lie",
          "Fun way to get to know each other!",
        ],
        presetQuestions: [],
      },
      {
        mode: "icebreaker",
        labelNo: "Icebreaker",
        labelEn: "Icebreaker",
        descriptionNo: "Oppvarmingsspørsmål for nyansatte!",
        descriptionEn: "Warm-up questions for new employees!",
        icon: "🧊",
        instructionsNo: [
          "Svar på lette oppvarmingsspørsmål",
          "Del litt om deg selv med teamet",
          "Perfekt for første dag på jobb",
        ],
        instructionsEn: [
          "Answer light warm-up questions",
          "Share a bit about yourself with the team",
          "Perfect for the first day at work",
        ],
        presetQuestions: [],
      },
    ],
  },

  // ─── B2B: General catch-all ───────────────────────────────
  corporate_event: {
    type: "corporate_event",
    category: "corporate",
    labelNo: "Annet bedriftsarrangement",
    labelEn: "Other Corporate Event",
    icon: "🏢",
    descriptionNo: "Planlegg et annet type bedriftsarrangement",
    descriptionEn: "Plan another type of corporate event",
    features: {
      traditions: true, dressTracking: true, weddingPartyRoles: false,
      speeches: true, photoplan: true, seating: true,
      coupleProfile: false, importantPeople: true, sharePartner: true,
    },
    featureLabels: {
      traditions: { no: "Format & Oppsett", en: "Format & Setup", descriptionNo: "Arrangementsformat og oppsett", descriptionEn: "Event format and setup" },
      dressTracking: { no: "Dresscode", en: "Dress Code", descriptionNo: "Antrekkskode for arrangementet", descriptionEn: "Dress code for the event" },
    },
    attireVendorHints: {
      storesNo: ["Dressmann", "H&M", "Volt", "Zara"],
      storesEn: ["Dressmann", "H&M", "Volt", "Zara"],
      searchTermsNo: ["dresscode", "business antrekk", "festantrekk"],
      searchTermsEn: ["dress code", "business attire", "formal wear"],
    },
    roleLabels: {
      primary: { no: "Arrangør", en: "Organizer" },
      secondary: { no: "Medarrangør", en: "Co-organizer" },
      guestLabel: { no: "Deltakere", en: "Attendees" },
    },
    dateLabel: { no: "Arrangementsdato", en: "Event Date" },
    shareLabel: {
      titleNo: "Del arrangementet", titleEn: "Share Event",
      subtitleNo: "Inviter medarrangør eller kollega",
      subtitleEn: "Invite co-organizer or colleague",
      shareMessageNo: "Hei {name}! Du er invitert til arrangementet på Evendi. Din invitasjonskode: {code}. Last ned Evendi og skriv inn koden for å få tilgang.",
      shareMessageEn: "Hi {name}! You're invited to the event on Evendi. Your invitation code: {code}. Download Evendi and enter the code to get access.",
    },
  },
};

// ─── Helper Functions ───────────────────────────────────────────

/** Get event config for a given type (defaults to wedding) */
export function getEventConfig(eventType?: EventType | null): EventTypeConfig {
  return EVENT_TYPE_CONFIGS[eventType || "wedding"];
}

/** Get localized label for an event type */
export function getEventLabel(eventType: EventType | null | undefined, locale: string = "no"): string {
  const config = getEventConfig(eventType);
  return locale === "no" ? config.labelNo : config.labelEn;
}

/** Get date field label for an event type */
export function getDateLabel(eventType: EventType | null | undefined, locale: string = "no"): string {
  const config = getEventConfig(eventType);
  return locale === "no" ? config.dateLabel.no : config.dateLabel.en;
}

/** Get guest/attendee label for an event type */
export function getGuestLabel(eventType: EventType | null | undefined, locale: string = "no"): string {
  const config = getEventConfig(eventType);
  return locale === "no" ? config.roleLabels.guestLabel.no : config.roleLabels.guestLabel.en;
}

/** Check if a feature is enabled for an event type */
export function isFeatureEnabled(eventType: EventType | null | undefined, feature: keyof EventTypeConfig["features"]): boolean {
  return getEventConfig(eventType).features[feature];
}

/** Get personal (B2C) event types */
export function getPersonalEventTypes(): EventTypeConfig[] {
  return Object.values(EVENT_TYPE_CONFIGS).filter(c => c.category === "personal");
}

/** Get corporate (B2B) event types */
export function getCorporateEventTypes(): EventTypeConfig[] {
  return Object.values(EVENT_TYPE_CONFIGS).filter(c => c.category === "corporate");
}

/** Get all event types grouped by category */
export function getGroupedEventTypes(): { personal: EventTypeConfig[]; corporate: EventTypeConfig[] } {
  return {
    personal: getPersonalEventTypes(),
    corporate: getCorporateEventTypes(),
  };
}

/** Get corporate event types grouped by sub-category */
export function getCorporateGrouped(): { subCategory: CorporateSubCategoryInfo; events: EventTypeConfig[] }[] {
  const corporate = getCorporateEventTypes();
  return CORPORATE_SUB_CATEGORIES.map(subCat => ({
    subCategory: CORPORATE_SUB_CATEGORY_INFO[subCat],
    events: corporate.filter(e => e.corporateSubCategory === subCat),
  })).filter(g => g.events.length > 0);
}

/** Get the "Other" corporate catch-all (no sub-category) */
export function getCorporateCatchAll(): EventTypeConfig | undefined {
  return getCorporateEventTypes().find(e => !e.corporateSubCategory);
}

// ─── Vendor Category Registry (Single Source of Truth) ──────────
/**
 * Every vendor category slug used across client + server.
 * DB stores Norwegian display names; client uses English slugs.
 * This registry bridges both systems.
 */
export const VENDOR_CATEGORY_SLUGS = [
  "photographer",
  "videographer",
  "photo-video",
  "florist",
  "catering",
  "music",
  "dj",
  "venue",
  "cake",
  "bakery",
  "planner",
  "coordinator",
  "beauty",
  "hair",
  "makeup",
  "transport",
  "dress",
  "attire",
  "entertainment",
  "decoration",
  "invitations",
  "confectionery",
  "bar",
  "photobooth",
  "rings",
  "accommodation",
  "pets",
] as const;

export type VendorCategorySlug = (typeof VENDOR_CATEGORY_SLUGS)[number];

export interface VendorCategoryInfo {
  slug: VendorCategorySlug;
  /** Norwegian display name (matches DB `vendor_categories.name`) */
  dbName: string;
  /** Norwegian label shown to couples */
  labelNo: string;
  /** English label */
  labelEn: string;
  /** EvendiIcon name */
  icon: string;
  /** Gradient colors [start, end] for marketplace UI */
  gradient: [string, string];
  /** Route name for vendor-details admin screen (null = no dedicated screen) */
  detailsRoute: string | null;
  /** Alias slugs that resolve to this category */
  aliases?: VendorCategorySlug[];
}

export const VENDOR_CATEGORIES: Record<VendorCategorySlug, VendorCategoryInfo> = {
  photographer: {
    slug: "photographer",
    dbName: "Fotograf",
    labelNo: "Fotograf",
    labelEn: "Photographer",
    icon: "camera",
    gradient: ["#667eea", "#764ba2"],
    detailsRoute: "PhotographerDetails",
  },
  videographer: {
    slug: "videographer",
    dbName: "Videograf",
    labelNo: "Videograf",
    labelEn: "Videographer",
    icon: "video",
    gradient: ["#f093fb", "#f5576c"],
    detailsRoute: "PhotographerDetails",
  },
  "photo-video": {
    slug: "photo-video",
    dbName: "Fotograf", // Composite — maps to Fotograf in DB
    labelNo: "Foto & Video",
    labelEn: "Photo & Video",
    icon: "camera",
    gradient: ["#667eea", "#f5576c"],
    detailsRoute: "PhotoVideoDetails",
  },
  florist: {
    slug: "florist",
    dbName: "Blomster",
    labelNo: "Blomster",
    labelEn: "Florist",
    icon: "sun",
    gradient: ["#43e97b", "#38f9d7"],
    detailsRoute: "FloristDetails",
  },
  catering: {
    slug: "catering",
    dbName: "Catering",
    labelNo: "Catering",
    labelEn: "Catering",
    icon: "coffee",
    gradient: ["#fa709a", "#fee140"],
    detailsRoute: "CateringDetails",
  },
  music: {
    slug: "music",
    dbName: "Musikk",
    labelNo: "Musikk/DJ",
    labelEn: "Music/DJ",
    icon: "music",
    gradient: ["#4facfe", "#00f2fe"],
    detailsRoute: "MusicDetails",
    aliases: ["dj"],
  },
  dj: {
    slug: "dj",
    dbName: "Musikk",
    labelNo: "DJ",
    labelEn: "DJ",
    icon: "music",
    gradient: ["#4facfe", "#00f2fe"],
    detailsRoute: "MusicDetails",
  },
  venue: {
    slug: "venue",
    dbName: "Venue",
    labelNo: "Lokale",
    labelEn: "Venue",
    icon: "home",
    gradient: ["#a18cd1", "#fbc2eb"],
    detailsRoute: "VenueDetails",
  },
  cake: {
    slug: "cake",
    dbName: "Kake",
    labelNo: "Kake",
    labelEn: "Cake",
    icon: "gift",
    gradient: ["#fccb90", "#d57eeb"],
    detailsRoute: "CakeDetails",
    aliases: ["bakery"],
  },
  bakery: {
    slug: "bakery",
    dbName: "Kake",
    labelNo: "Kake",
    labelEn: "Bakery",
    icon: "gift",
    gradient: ["#fccb90", "#d57eeb"],
    detailsRoute: "CakeDetails",
  },
  planner: {
    slug: "planner",
    dbName: "Planlegger",
    labelNo: "Planlegger",
    labelEn: "Planner",
    icon: "clipboard",
    gradient: ["#667eea", "#764ba2"],
    detailsRoute: "PlannerDetails",
    aliases: ["coordinator"],
  },
  coordinator: {
    slug: "coordinator",
    dbName: "Planlegger",
    labelNo: "Koordinator",
    labelEn: "Coordinator",
    icon: "clipboard",
    gradient: ["#667eea", "#764ba2"],
    detailsRoute: "PlannerDetails",
  },
  beauty: {
    slug: "beauty",
    dbName: "Hår & Makeup",
    labelNo: "Hår & Makeup",
    labelEn: "Hair & Makeup",
    icon: "scissors",
    gradient: ["#f093fb", "#f5576c"],
    detailsRoute: "BeautyDetails",
    aliases: ["hair", "makeup"],
  },
  hair: {
    slug: "hair",
    dbName: "Hår & Makeup",
    labelNo: "Hår",
    labelEn: "Hair",
    icon: "scissors",
    gradient: ["#f093fb", "#f5576c"],
    detailsRoute: "BeautyDetails",
  },
  makeup: {
    slug: "makeup",
    dbName: "Hår & Makeup",
    labelNo: "Makeup",
    labelEn: "Makeup",
    icon: "scissors",
    gradient: ["#f093fb", "#f5576c"],
    detailsRoute: "BeautyDetails",
  },
  transport: {
    slug: "transport",
    dbName: "Transport",
    labelNo: "Transport",
    labelEn: "Transport",
    icon: "truck",
    gradient: ["#4facfe", "#43e97b"],
    detailsRoute: "TransportDetails",
  },
  dress: {
    slug: "dress",
    dbName: "Drakt & Dress",
    labelNo: "Brudekjole",
    labelEn: "Bridal Dress",
    icon: "heart",
    gradient: ["#fbc2eb", "#a18cd1"],
    detailsRoute: "DressDetails",
    aliases: ["attire"],
  },
  attire: {
    slug: "attire",
    dbName: "Drakt & Dress",
    labelNo: "Antrekk",
    labelEn: "Attire",
    icon: "shopping-bag",
    gradient: ["#fbc2eb", "#a18cd1"],
    detailsRoute: "DressDetails",
  },
  entertainment: {
    slug: "entertainment",
    dbName: "Underholdning",
    labelNo: "Underholdning",
    labelEn: "Entertainment",
    icon: "smile",
    gradient: ["#f6d365", "#fda085"],
    detailsRoute: null,
  },
  decoration: {
    slug: "decoration",
    dbName: "Dekorasjon",
    labelNo: "Dekorasjon",
    labelEn: "Decoration",
    icon: "star",
    gradient: ["#a1c4fd", "#c2e9fb"],
    detailsRoute: null,
  },
  invitations: {
    slug: "invitations",
    dbName: "Invitasjoner",
    labelNo: "Invitasjoner",
    labelEn: "Invitations",
    icon: "mail",
    gradient: ["#ffecd2", "#fcb69f"],
    detailsRoute: null,
  },
  confectionery: {
    slug: "confectionery",
    dbName: "Konfektyrer",
    labelNo: "Konfektyrer",
    labelEn: "Confectionery",
    icon: "gift",
    gradient: ["#fccb90", "#d57eeb"],
    detailsRoute: null,
  },
  bar: {
    slug: "bar",
    dbName: "Bar & Drikke",
    labelNo: "Bar & Drikke",
    labelEn: "Bar & Drinks",
    icon: "coffee",
    gradient: ["#ff9a9e", "#fad0c4"],
    detailsRoute: null,
  },
  photobooth: {
    slug: "photobooth",
    dbName: "Fotoboks",
    labelNo: "Fotoboks",
    labelEn: "Photo Booth",
    icon: "aperture",
    gradient: ["#667eea", "#764ba2"],
    detailsRoute: null,
  },
  rings: {
    slug: "rings",
    dbName: "Ringer",
    labelNo: "Ringer",
    labelEn: "Rings",
    icon: "heart",
    gradient: ["#fbc2eb", "#a18cd1"],
    detailsRoute: null,
  },
  accommodation: {
    slug: "accommodation",
    dbName: "Overnatting",
    labelNo: "Overnatting",
    labelEn: "Accommodation",
    icon: "home",
    gradient: ["#a18cd1", "#fbc2eb"],
    detailsRoute: null,
  },
  pets: {
    slug: "pets",
    dbName: "Husdyr",
    labelNo: "Husdyr",
    labelEn: "Pets",
    icon: "heart",
    gradient: ["#43e97b", "#38f9d7"],
    detailsRoute: null,
  },
};

// ── Helper: resolve category slug → info ─────────────────────
export function getVendorCategoryInfo(slug: string): VendorCategoryInfo | undefined {
  return VENDOR_CATEGORIES[slug as VendorCategorySlug];
}

/** Get Norwegian label for a category slug. Falls back to the slug itself. */
export function getVendorCategoryLabel(slug: string): string {
  return VENDOR_CATEGORIES[slug as VendorCategorySlug]?.labelNo ?? slug;
}

/** Get icon name for a category slug. Falls back to "briefcase". */
export function getVendorCategoryIcon(slug: string): string {
  return VENDOR_CATEGORIES[slug as VendorCategorySlug]?.icon ?? "briefcase";
}

/** Get gradient colors for a category slug. Falls back to default. */
export function getVendorCategoryGradient(slug: string): [string, string] {
  return VENDOR_CATEGORIES[slug as VendorCategorySlug]?.gradient ?? ["#667eea", "#764ba2"];
}

/** Get DB name for a category slug. Returns undefined for unknown slugs. */
export function getVendorCategoryDbName(slug: string): string | undefined {
  return VENDOR_CATEGORIES[slug as VendorCategorySlug]?.dbName;
}

/** Get the vendor-details route name for a category slug. */
export function getVendorDetailsRoute(slug: string): string | null {
  return VENDOR_CATEGORIES[slug as VendorCategorySlug]?.detailsRoute ?? null;
}

/** Build slug → DB name map (for server-side slug resolution). */
export function buildCategorySlugMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [slug, info] of Object.entries(VENDOR_CATEGORIES)) {
    map[slug] = info.dbName;
  }
  return map;
}

/** Get gradient colors by DB name (Norwegian). Falls back to default. */
export function getVendorCategoryGradientByDbName(dbName: string): [string, string] {
  for (const info of Object.values(VENDOR_CATEGORIES)) {
    if (info.dbName === dbName) return info.gradient;
  }
  return ["#667eea", "#764ba2"];
}

// ─── Vendor Category → Event Type Mapping ───────────────────────
// Which vendor categories are relevant for which event types
export const VENDOR_CATEGORY_EVENT_MAP: Record<string, EventType[]> = {
  "Fotograf": ["wedding", "confirmation", "birthday", "anniversary", "engagement", "baby_shower", "conference", "kickoff", "summer_party", "christmas_party", "product_launch", "trade_fair", "corporate_anniversary", "awards_night", "employee_day", "corporate_event"],
  "Videograf": ["wedding", "confirmation", "anniversary", "conference", "kickoff", "product_launch", "corporate_anniversary", "awards_night", "corporate_event"],
  "Foto & Video": ["wedding", "confirmation", "birthday", "anniversary", "engagement", "conference", "kickoff", "product_launch", "corporate_anniversary", "awards_night", "corporate_event"],
  "Blomster": ["wedding", "confirmation", "anniversary", "engagement", "awards_night", "corporate_anniversary"],
  "Catering": ["wedding", "confirmation", "birthday", "anniversary", "engagement", "baby_shower", "conference", "seminar", "kickoff", "summer_party", "christmas_party", "team_building", "product_launch", "corporate_anniversary", "awards_night", "employee_day", "onboarding_day", "corporate_event"],
  "Musikk": ["wedding", "confirmation", "birthday", "anniversary", "engagement", "summer_party", "christmas_party", "awards_night", "corporate_anniversary", "corporate_event"],
  "Venue": ["wedding", "confirmation", "birthday", "anniversary", "engagement", "baby_shower", "conference", "seminar", "kickoff", "summer_party", "christmas_party", "team_building", "product_launch", "trade_fair", "corporate_anniversary", "awards_night", "employee_day", "onboarding_day", "corporate_event"],
  "Kake": ["wedding", "confirmation", "birthday", "baby_shower", "corporate_anniversary"],
  "Planlegger": ["wedding", "conference", "kickoff", "product_launch", "awards_night", "corporate_anniversary", "corporate_event"],
  "Hår & Makeup": ["wedding", "confirmation", "engagement", "awards_night", "christmas_party"],
  "Transport": ["wedding", "conference", "kickoff", "awards_night", "corporate_event"],
  "Invitasjoner": ["wedding", "confirmation", "birthday", "anniversary", "engagement", "christmas_party", "awards_night", "corporate_anniversary", "corporate_event"],
  "Underholdning": ["wedding", "confirmation", "birthday", "anniversary", "summer_party", "christmas_party", "team_building", "awards_night", "corporate_anniversary", "employee_day", "corporate_event"],
  "Dekorasjon": ["wedding", "confirmation", "birthday", "anniversary", "engagement", "christmas_party", "product_launch", "awards_night", "corporate_anniversary", "corporate_event"],
  "Konfektyrer": ["wedding", "confirmation", "birthday", "baby_shower", "corporate_anniversary"],
  "Bar & Drikke": ["wedding", "birthday", "anniversary", "summer_party", "christmas_party", "product_launch", "awards_night", "corporate_anniversary", "corporate_event"],
  "Fotoboks": ["wedding", "confirmation", "birthday", "summer_party", "christmas_party", "awards_night", "corporate_event"],
  "Ringer": ["wedding", "engagement"],
  "Drakt & Dress": ["wedding", "confirmation", "birthday", "anniversary", "engagement", "baby_shower", "conference", "seminar", "kickoff", "summer_party", "christmas_party", "team_building", "product_launch", "trade_fair", "corporate_anniversary", "awards_night", "employee_day", "onboarding_day", "corporate_event"],
  "Overnatting": ["wedding", "conference", "kickoff", "awards_night", "corporate_event"],
  "Husdyr": ["wedding"],
};

/** Check if a vendor category is applicable for a given event type */
export function isVendorCategoryApplicable(categoryName: string, eventType: EventType): boolean {
  const applicableEvents = VENDOR_CATEGORY_EVENT_MAP[categoryName];
  if (!applicableEvents) return true; // Unknown categories default to applicable
  return applicableEvents.includes(eventType);
}
