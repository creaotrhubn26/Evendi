import { config } from "dotenv";
import { faqItems } from "../shared/schema";
import { db } from "../server/db";

// Load environment variables from .env.local
config({ path: ".env.local" });

const vendorFAQs = [
  {
    question: "Hvordan oppdaterer jeg min profil?",
    answer: "Gå til Dashboard og klikk på 'Min profil'-knappen. Her kan du oppdatere all informasjon om virksomheten din, inkludert beskrivelse, bilder, priser og kontaktinformasjon.",
    icon: "user",
    category: "vendor" as const,
    sortOrder: 1,
  },
  {
    question: "Hvordan legger jeg til tilbud for par?",
    answer: "Fra Dashboard, klikk på 'Tilbud'-fanen. Her kan du opprette nye tilbud med beskrivelse, pris, gyldighetsperiode og eventuelle rabatter. Tilbudene vil være synlige for alle par som ser på din profil.",
    icon: "tag",
    category: "vendor" as const,
    sortOrder: 2,
  },
  {
    question: "Hvordan håndterer jeg meldinger fra par?",
    answer: "Du finner alle meldinger under 'Meldinger'-fanen i Dashboard. Her kan du svare direkte på henvendelser fra par, sende kontrakter, og holde oversikt over alle samtaler.",
    icon: "message-circle",
    category: "vendor" as const,
    sortOrder: 3,
  },
  {
    question: "Hva er inspirasjonsgalleriet?",
    answer: "Inspirasjonsgalleriet lar deg dele bilder fra tidligere arrangementer. Dette hjelper par med å se kvaliteten på arbeidet ditt og får ideer til sitt eget bryllup. Jo flere gode bilder, jo bedre synlighet!",
    icon: "image",
    category: "vendor" as const,
    sortOrder: 4,
  },
  {
    question: "Hvordan sender jeg kontrakter til par?",
    answer: "I meldingsvinduet med et par kan du klikke på 'Send kontrakt'. Last opp kontraktsdokumentet, og paret vil motta en varsling. De kan signere digitalt direkte i appen.",
    icon: "file-text",
    category: "vendor" as const,
    sortOrder: 5,
  },
  {
    question: "Kan jeg tilpasse mine produkter og tjenester?",
    answer: "Ja! Under 'Produkter' kan du legge til alle tjenestene du tilbyr med egendefinerte priser, beskrivelser og varianter. Du kan også kategorisere dem for enklere navigasjon for parene.",
    icon: "package",
    category: "vendor" as const,
    sortOrder: 6,
  },
  {
    question: "Hvordan får jeg bedre synlighet i appen?",
    answer: "Hold profilen din oppdatert med gode bilder, detaljerte beskrivelser og relevante priser. Svar raskt på henvendelser fra par. Legg ut tilbud og del bilder i inspirasjonsgalleriet regelmessig. Par kan finne deg direkte via leverandørsøket i planleggingsskjermene.",
    icon: "trending-up",
    category: "vendor" as const,
    sortOrder: 7,
  },
  {
    question: "Hva koster det å bruke Wedflow?",
    answer: "Wedflow er gratis for leverandører! Vi tar kun en liten kommisjon ved bookinger gjort gjennom plattformen. Ingen skjulte kostnader eller månedlige avgifter.",
    icon: "dollar-sign",
    category: "vendor" as const,
    sortOrder: 8,
  },
  {
    question: "Hvordan kontakter jeg Wedflow support?",
    answer: "Du kan kontakte oss via 'Wedflow Support'-knappen i Dashboard. Vi svarer vanligvis innen 24 timer. For akutte saker, send e-post til support@wedflow.no.",
    icon: "help-circle",
    category: "vendor" as const,
    sortOrder: 9,
  },
  {
    question: "Kan jeg se statistikk over min profil?",
    answer: "Ja! Dashboard viser visninger av profilen din, antall henvendelser, og annen relevant statistikk. Dette hjelper deg med å forstå hvordan du presterer på plattformen.",
    icon: "bar-chart-2",
    category: "vendor" as const,
    sortOrder: 10,
  },
  {
    question: "Hvordan mottar jeg henvendelser fra par?",
    answer: "Når et par finner deg via leverandørsøket i en planleggingsskjerm (f.eks. Blomster, Catering, Transport), kan de sende deg en melding direkte. Du finner alle nye samtaler under 'Meldinger'-fanen i Dashboard. Svar raskt for å gjøre et godt førsteinntrykk!",
    icon: "inbox",
    category: "vendor" as const,
    sortOrder: 11,
  },
  {
    question: "Hva skjer når et par velger meg som leverandør?",
    answer: "Når et par søker etter leverandører i planleggingsskjermene sine og velger din bedrift, kan de se profilen din, starte en chat, eller booke en avtale. Du vil se den nye samtalen i Dashboard under 'Meldinger' umiddelbart.",
    icon: "user-check",
    category: "vendor" as const,
    sortOrder: 12,
  },
];

const coupleFAQs = [
  {
    question: "Hvordan lager jeg en bryllupsplan?",
    answer: "Start med å gå til 'Planlegging'-fanen. Her finner du verktøy for sjekkliste, budsjett, timeplan, gjesteliste og mer. Du kan tilpasse alt etter dine behov.",
    icon: "clipboard",
    category: "couple" as const,
    sortOrder: 1,
  },
  {
    question: "Hvordan finner jeg leverandører?",
    answer: "Du kan finne leverandører på to måter: 1) Bruk 'Leverandører'-fanen for å se alle tilgjengelige leverandører med filtrering, eller 2) Søk direkte i planleggingsskjermene (Blomster, Brudekjole, Hår & Makeup, Catering, Transport, Planlegger) — skriv inn et leverandørnavn, og registrerte leverandører vises automatisk med mulighet for profil, chat og booking.",
    icon: "search",
    category: "couple" as const,
    sortOrder: 2,
  },
  {
    question: "Hvordan kontakter jeg en leverandør?",
    answer: "Du kan finne leverandører direkte i planleggingsskjermene (Blomster, Brudekjole, Hår & Makeup, Catering, Transport, Planlegger). Skriv inn leverandørnavnet i søkefeltet, og registrerte leverandører vises automatisk. Velg en leverandør for å se profilen, sende melding eller booke avtale.",
    icon: "mail",
    category: "couple" as const,
    sortOrder: 3,
  },
  {
    question: "Hvordan søker jeg etter leverandører i planleggingen?",
    answer: "I hver planleggingsskjerm (Blomster, Brudekjole, Hår & Makeup, Catering, Transport, Planlegger) finner du et søkefelt for leverandør. Begynn å skrive navnet, og matchende registrerte leverandører vises. Du kan trykke 'Profil' for å se detaljer, eller velge leverandøren for å koble dem til planleggingen din.",
    icon: "search",
    category: "couple" as const,
    sortOrder: 4,
  },
  {
    question: "Hva skjer etter at jeg har valgt en leverandør?",
    answer: "Etter at du velger en registrert leverandør vises en handlingslinje med to knapper: 'Se profil' åpner leverandørens detaljside med anmeldelser og produkter, og 'Send melding' starter en chat direkte med leverandøren. Du kan også fjerne valget og søke på nytt.",
    icon: "check-square",
    category: "couple" as const,
    sortOrder: 5,
  },
  {
    question: "Hvordan starter jeg en chat med en leverandør?",
    answer: "Du kan starte en chat på to måter: 1) Velg en leverandør fra søket i planleggingsskjermen og trykk 'Send melding', eller 2) Gå til leverandørens profilside og trykk 'Send melding'. En automatisk velkomstmelding sendes, og leverandøren kan svare direkte.",
    icon: "message-circle",
    category: "couple" as const,
    sortOrder: 6,
  },
  {
    question: "Hva er inspirasjonsgalleriet?",
    answer: "Inspirasjonsgalleriet er samlingen av bilder fra virkelige bryllup og arrangementer. Du kan lagre favoritter, dele med partneren din, og få ideer til eget bryllup.",
    icon: "heart",
    category: "couple" as const,
    sortOrder: 7,
  },
  {
    question: "Hvordan holder jeg oversikt over budsjettet?",
    answer: "Under 'Budsjett' kan du sette totalbudsjett og fordele penger på ulike kategorier. Appen oppdaterer automatisk når du registrerer kostnader, så du alltid ser hvor mye du har igjen.",
    icon: "dollar-sign",
    category: "couple" as const,
    sortOrder: 8,
  },
  {
    question: "Kan jeg dele planleggingen med min partner?",
    answer: "Ja! Inviter partneren din via 'Profil' > 'Del tilgang'. Dere får begge tilgang til samme informasjon og kan planlegge sammen i sanntid.",
    icon: "users",
    category: "couple" as const,
    sortOrder: 9,
  },
  {
    question: "Hvordan fungerer gjestelisten?",
    answer: "Under 'Gjester' kan du legge til alle inviterte, spore RSVP-svar, registrere matpreferanser og bordplassering. Du kan også sende digitale invitasjoner direkte fra appen.",
    icon: "user-plus",
    category: "couple" as const,
    sortOrder: 10,
  },
  {
    question: "Kan jeg bruke Wedflow gratis?",
    answer: "Ja! Wedflow er helt gratis for brudepar. Du får tilgang til alle planleggingsverktøy, leverandørsøk, chat med leverandører, og inspirasjon uten noen kostnader.",
    icon: "check-circle",
    category: "couple" as const,
    sortOrder: 11,
  },
  {
    question: "Hvordan får jeg varsler om viktige frister?",
    answer: "Appen sender automatiske påminnelser om sjekkliste-oppgaver, betalingsfrister og andre viktige datoer. Du kan tilpasse varslings innstillinger under 'Profil' > 'Innstillinger'.",
    icon: "bell",
    category: "couple" as const,
    sortOrder: 12,
  },
  {
    question: "Trenger jeg hjelp med planleggingen?",
    answer: "Wedflow har en innebygd AI-assistent som kan gi deg tips og forslag basert på ditt bryllup. Du finner den under 'AI-hjelp' i planleggingsseksjonen.",
    icon: "zap",
    category: "couple" as const,
    sortOrder: 13,
  },
  {
    question: "Kan jeg se leverandørens profil før jeg tar kontakt?",
    answer: "Ja! Når leverandøren dukker opp i søkeresultatene, kan du trykke på 'Profil'-knappen for å se fullstendig informasjon inkludert beskrivelse, anmeldelser, produkter, beliggenhet, og prisklasse — alt uten å sende melding først.",
    icon: "eye",
    category: "couple" as const,
    sortOrder: 14,
  },
];

async function seedFAQ() {
  console.log("🌱 Starting FAQ seed...");

  try {
    // Insert vendor FAQs
    console.log("📝 Adding vendor FAQs...");
    for (const faq of vendorFAQs) {
      await db.insert(faqItems).values({
        ...faq,
        isActive: true,
      });
    }
    console.log(`✅ Added ${vendorFAQs.length} vendor FAQs`);

    // Insert couple FAQs
    console.log("💑 Adding couple FAQs...");
    for (const faq of coupleFAQs) {
      await db.insert(faqItems).values({
        ...faq,
        isActive: true,
      });
    }
    console.log(`✅ Added ${coupleFAQs.length} couple FAQs`);

    console.log("🎉 FAQ seed completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding FAQ:", error);
    throw error;
  }
}

seedFAQ().catch((error) => {
  console.error(error);
  process.exit(1);
});
