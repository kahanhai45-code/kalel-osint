import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Shield, AlertTriangle, Crosshair, Activity, Radio,
  ChevronRight, RefreshCw, Loader2, MapPin, Users, Zap,
  Eye, Target, Flame, TrendingUp, Clock, FileText, Send
} from "lucide-react";

// === TYPES ===
interface Country {
  id: string;
  name: string;
  flag: string;
  capital: string;
  threatLevel: "CRITICAL" | "HIGH" | "ELEVATED" | "MODERATE" | "LOW";
  tlp: string;
  population: string;
  regime: string;
  military: string;
  nuclearStatus: string;
  alliances: string[];
  adversaries: string[];
  activeConflicts: string[];
  keyBases: { name: string; type: string; lat: number; lng: number }[];
  intelSummary: string;
  recentEvents: { date: string; event: string; severity: "critical" | "high" | "medium" | "low" }[];
  economicData: { gdp: string; sanctions: string; oilProduction: string; currency: string };
  cyberCapability: "Advanced" | "Moderate" | "Basic";
  proxyForces: string[];
}

interface NewsItem {
  title: string;
  source: string;
  time: string;
  severity: "critical" | "high" | "medium" | "low";
  region: string;
}

// === DONNÉES GÉOPOLITIQUES ===
const COUNTRIES: Country[] = [
  {
    id: "israel",
    name: "Israël",
    flag: "🇮🇱",
    capital: "Jérusalem",
    threatLevel: "CRITICAL",
    tlp: "RED",
    population: "9.8M",
    regime: "Démocratie parlementaire",
    military: "Forces de Défense d'Israël (Tsahal) — 170 000 actifs + 465 000 réservistes",
    nuclearStatus: "Capacité présumée (80-400 ogives, politique d'ambiguïté)",
    alliances: ["États-Unis", "Accords d'Abraham (EAU, Bahreïn, Maroc)", "OTAN (partenaire)"],
    adversaries: ["Iran", "Hezbollah", "Hamas", "Houthis", "Syrie"],
    activeConflicts: ["Gaza (Hamas)", "Liban (Hezbollah)", "Cisjordanie", "Front Nord (Syrie)", "Houthis (Yémen)"],
    keyBases: [
      { name: "Base Nevatim", type: "Aérienne (F-35)", lat: 31.208, lng: 34.938 },
      { name: "Base Ramat David", type: "Aérienne", lat: 32.665, lng: 35.179 },
      { name: "Dimona", type: "Nucléaire", lat: 31.002, lng: 35.145 },
      { name: "Haïfa Naval", type: "Navale", lat: 32.820, lng: 34.980 },
      { name: "Palmachim", type: "Missiles/Espace", lat: 31.897, lng: 34.691 },
    ],
    intelSummary: "Israël mène des opérations militaires sur plusieurs fronts simultanés. L'offensive à Gaza se poursuit avec des opérations terrestres intensives. Le front nord avec le Hezbollah reste actif avec des échanges de tirs quotidiens. Le Dôme de Fer et Arrow-3 assurent la défense antimissile. Les services de renseignement (Mossad, Shin Bet, Aman) maintiennent des opérations offensives contre l'Iran et ses proxies.",
    recentEvents: [
      { date: "2026-03-10", event: "Frappes aériennes sur des positions Hezbollah au Sud-Liban", severity: "critical" },
      { date: "2026-03-09", event: "Interception de drones en provenance d'Irak", severity: "high" },
      { date: "2026-03-08", event: "Opération terrestre à Rafah — Phase 3", severity: "critical" },
      { date: "2026-03-07", event: "Tir de missile balistique intercepté (Arrow-3)", severity: "high" },
      { date: "2026-03-05", event: "Cyber-attaque repoussée sur infrastructure électrique", severity: "medium" },
    ],
    economicData: { gdp: "$564B", sanctions: "Aucune", oilProduction: "Négligeable", currency: "ILS (Shekel)" },
    cyberCapability: "Advanced",
    proxyForces: [],
  },
  {
    id: "iran",
    name: "Iran",
    flag: "🇮🇷",
    capital: "Téhéran",
    threatLevel: "CRITICAL",
    tlp: "RED",
    population: "88.5M",
    regime: "République islamique — Guide suprême + Président",
    military: "Armée régulière (Artesh) + Corps des Gardiens (CGRI/Pasdaran) — 610 000 actifs",
    nuclearStatus: "Programme enrichissement uranium (60%+) — seuil nucléaire",
    alliances: ["Russie", "Chine", "Syrie", "Axe de la Résistance"],
    adversaries: ["Israël", "États-Unis", "Arabie Saoudite", "EAU"],
    activeConflicts: ["Confrontation avec Israël", "Soutien proxies (Hezbollah, Hamas, Houthis)", "Tensions détroit d'Ormuz"],
    keyBases: [
      { name: "Natanz", type: "Enrichissement uranium", lat: 33.725, lng: 51.727 },
      { name: "Fordow", type: "Enrichissement souterrain", lat: 34.883, lng: 51.583 },
      { name: "Isfahan", type: "Conversion nucléaire", lat: 32.657, lng: 51.680 },
      { name: "Bandar Abbas", type: "Navale CGRI", lat: 27.186, lng: 56.280 },
      { name: "Parchin", type: "Missiles balistiques", lat: 35.520, lng: 51.770 },
    ],
    intelSummary: "L'Iran poursuit son programme nucléaire avec un enrichissement dépassant 60%. Le CGRI coordonne les opérations de l'Axe de la Résistance : Hezbollah (Liban), Hamas (Gaza), Houthis (Yémen), milices en Irak et Syrie. La Force Quds dirige les opérations extérieures. Capacité balistique significative (Shahab-3, Khorramshahr, Fattah hypersonique). Programme spatial servant de couverture au développement ICBM.",
    recentEvents: [
      { date: "2026-03-10", event: "Test missile balistique Fattah-2 hypersonique", severity: "critical" },
      { date: "2026-03-08", event: "Enrichissement uranium détecté à 63.5% (AIEA)", severity: "critical" },
      { date: "2026-03-07", event: "Transfert d'armes vers le Hezbollah via la Syrie", severity: "high" },
      { date: "2026-03-06", event: "Exercice naval dans le détroit d'Ormuz", severity: "high" },
      { date: "2026-03-04", event: "Cyber-opération contre infrastructure israélienne", severity: "medium" },
    ],
    economicData: { gdp: "$388B", sanctions: "Lourdes (USA, UE)", oilProduction: "3.2M barils/jour", currency: "IRR (Rial)" },
    cyberCapability: "Advanced",
    proxyForces: ["Hezbollah (Liban)", "Hamas (Gaza)", "Houthis (Yémen)", "Hashd al-Shaabi (Irak)", "Milices en Syrie"],
  },
  {
    id: "lebanon",
    name: "Liban",
    flag: "🇱🇧",
    capital: "Beyrouth",
    threatLevel: "HIGH",
    tlp: "AMBER",
    population: "5.5M",
    regime: "République parlementaire confessionnelle",
    military: "Forces Armées Libanaises (FAL) — 80 000 actifs + Hezbollah (force paramilitaire)",
    nuclearStatus: "Aucun programme",
    alliances: ["Iran (via Hezbollah)", "Syrie (historique)", "France (partenaire)"],
    adversaries: ["Israël"],
    activeConflicts: ["Conflit frontalier avec Israël", "Crise politique interne", "Présence Hezbollah"],
    keyBases: [
      { name: "Dahieh (QG Hezbollah)", type: "Commandement", lat: 33.854, lng: 35.510 },
      { name: "Vallée de la Bekaa", type: "Stockage missiles Hezbollah", lat: 33.850, lng: 35.900 },
      { name: "Tyr (Sud-Liban)", type: "Positions avancées", lat: 33.270, lng: 35.196 },
      { name: "Base Rayak", type: "Aérienne FAL", lat: 33.851, lng: 35.987 },
      { name: "Port de Beyrouth", type: "Logistique", lat: 33.902, lng: 35.518 },
    ],
    intelSummary: "Le Liban est au centre du conflit Israël-Hezbollah. Le Hezbollah, bras armé de l'Iran, dispose d'un arsenal estimé à 130 000+ roquettes et missiles. Les frappes israéliennes ciblent régulièrement le sud du Liban et la banlieue sud de Beyrouth (Dahieh). Le pays traverse une crise économique sans précédent. La FINUL maintient une présence au sud. L'armée libanaise reste neutre mais affaiblie.",
    recentEvents: [
      { date: "2026-03-10", event: "Frappes israéliennes sur Dahieh — 12 bâtiments touchés", severity: "critical" },
      { date: "2026-03-09", event: "Tirs de roquettes Hezbollah vers la Galilée", severity: "high" },
      { date: "2026-03-08", event: "Évacuation civile du sud-Liban en cours", severity: "high" },
      { date: "2026-03-06", event: "Convoi humanitaire bloqué à Sidon", severity: "medium" },
      { date: "2026-03-05", event: "Explosion suspecte dans le port de Beyrouth", severity: "medium" },
    ],
    economicData: { gdp: "$23B", sanctions: "Ciblées (Hezbollah)", oilProduction: "Aucune", currency: "LBP (Livre)" },
    cyberCapability: "Basic",
    proxyForces: ["Hezbollah — 30 000+ combattants", "Amal (milice chiite)"],
  },
  {
    id: "syria",
    name: "Syrie",
    flag: "🇸🇾",
    capital: "Damas",
    threatLevel: "HIGH",
    tlp: "AMBER",
    population: "23M (estimé)",
    regime: "Post-Assad — Gouvernement de transition",
    military: "Forces gouvernementales fragmentées + milices diverses",
    nuclearStatus: "Aucun programme actif",
    alliances: ["Russie (base Tartous/Hmeimim)", "Iran", "Hezbollah"],
    adversaries: ["Israël", "Turquie (partiel)", "Opposition armée"],
    activeConflicts: ["Frappes israéliennes régulières", "Présence iranienne", "Kurdes (SDF)", "Résidus Daech"],
    keyBases: [
      { name: "Hmeimim", type: "Base aérienne russe", lat: 35.411, lng: 35.948 },
      { name: "Tartous", type: "Base navale russe", lat: 34.889, lng: 35.886 },
      { name: "T4 (Tiyas)", type: "Base aérienne (CGRI)", lat: 34.522, lng: 37.627 },
      { name: "Damas Sud", type: "Positions iraniennes", lat: 33.450, lng: 36.300 },
      { name: "Deir ez-Zor", type: "Milices pro-Iran", lat: 35.336, lng: 40.146 },
    ],
    intelSummary: "La Syrie reste un théâtre d'opérations complexe. Israël mène des frappes régulières contre les positions iraniennes et les transferts d'armes vers le Hezbollah. La Russie maintient ses bases à Tartous et Hmeimim. Les Forces Démocratiques Syriennes (SDF/kurdes) contrôlent le nord-est. La Turquie maintient une zone tampon au nord. Des cellules de Daech persistent dans le désert central.",
    recentEvents: [
      { date: "2026-03-09", event: "Frappes israéliennes sur un convoi d'armes près de Damas", severity: "high" },
      { date: "2026-03-07", event: "Mouvement de troupes iraniennes vers le Golan", severity: "high" },
      { date: "2026-03-06", event: "Attaque Daech contre un checkpoint à Palmyre", severity: "medium" },
      { date: "2026-03-04", event: "Rotation de forces russes à Hmeimim", severity: "low" },
      { date: "2026-03-03", event: "Négociations turco-kurdes à Qamishli", severity: "medium" },
    ],
    economicData: { gdp: "$12B (estimé)", sanctions: "Lourdes (Caesar Act)", oilProduction: "80K barils/jour", currency: "SYP (Livre)" },
    cyberCapability: "Basic",
    proxyForces: ["Milices iraniennes", "Hezbollah (déploiement)", "Forces NDF"],
  },
  {
    id: "yemen",
    name: "Yémen (Houthis)",
    flag: "🇾🇪",
    capital: "Sanaa (Houthis) / Aden (Gouv.)",
    threatLevel: "ELEVATED",
    tlp: "AMBER",
    population: "34M",
    regime: "Divisé — Houthis (Nord) vs Gouvernement reconnu (Sud)",
    military: "Houthis: 30 000+ combattants + missiles balistiques et drones",
    nuclearStatus: "Aucun",
    alliances: ["Iran (soutien Houthis)", "Arabie Saoudite (soutien gouvernement)"],
    adversaries: ["Israël", "Coalition arabe", "États-Unis (frappes)"],
    activeConflicts: ["Attaques maritimes en Mer Rouge", "Tirs de missiles vers Israël", "Guerre civile"],
    keyBases: [
      { name: "Sanaa", type: "QG Houthis", lat: 15.369, lng: 44.191 },
      { name: "Hodeidah", type: "Port / Drones navals", lat: 14.798, lng: 42.954 },
      { name: "Saada", type: "Fief Houthi", lat: 16.940, lng: 43.764 },
      { name: "Marib", type: "Ligne de front", lat: 15.454, lng: 45.326 },
      { name: "Bab el-Mandeb", type: "Zone de blocus", lat: 12.583, lng: 43.333 },
    ],
    intelSummary: "Les Houthis, soutenus par l'Iran, mènent des attaques maritimes en Mer Rouge perturbant le commerce mondial. Ils disposent de missiles balistiques (Toufan), drones (Samad) et missiles de croisière capables d'atteindre Israël. La coalition US/UK mène des frappes de représailles. Le détroit de Bab el-Mandeb est partiellement bloqué. Les Houthis revendiquent la solidarité avec Gaza.",
    recentEvents: [
      { date: "2026-03-10", event: "Attaque drone contre un pétrolier en Mer Rouge", severity: "high" },
      { date: "2026-03-08", event: "Tir missile balistique vers Eilat (intercepté)", severity: "critical" },
      { date: "2026-03-07", event: "Frappes US sur des sites de lancement à Hodeidah", severity: "high" },
      { date: "2026-03-05", event: "Nouveau transfert d'armes iraniennes détecté", severity: "medium" },
      { date: "2026-03-03", event: "Blocus renforcé du détroit de Bab el-Mandeb", severity: "high" },
    ],
    economicData: { gdp: "$21B (estimé)", sanctions: "Ciblées (Houthis)", oilProduction: "Minimal", currency: "YER (Rial)" },
    cyberCapability: "Basic",
    proxyForces: ["Ansar Allah (Houthis)", "Milices tribales affiliées"],
  },
  {
    id: "saudi",
    name: "Arabie Saoudite",
    flag: "🇸🇦",
    capital: "Riyad",
    threatLevel: "MODERATE",
    tlp: "GREEN",
    population: "36.4M",
    regime: "Monarchie absolue — Roi Salman / MBS",
    military: "Forces Armées Royales — 227 000 actifs + Garde Nationale 100 000",
    nuclearStatus: "Programme civil — coopération avec la Chine et Pakistan",
    alliances: ["États-Unis", "GCC", "Égypte", "Pakistan"],
    adversaries: ["Iran", "Houthis"],
    activeConflicts: ["Défense contre missiles Houthis", "Rivalité Iran"],
    keyBases: [
      { name: "Base Prince Sultan", type: "Aérienne (USAF)", lat: 24.062, lng: 47.580 },
      { name: "King Abdulaziz Naval", type: "Navale", lat: 21.340, lng: 39.172 },
      { name: "King Fahd AB", type: "Aérienne", lat: 26.265, lng: 50.152 },
      { name: "Tabuk", type: "Aérienne", lat: 28.365, lng: 36.618 },
      { name: "NEOM", type: "Projet stratégique", lat: 27.950, lng: 35.300 },
    ],
    intelSummary: "L'Arabie Saoudite poursuit sa transformation Vision 2030 sous MBS. Le royaume maintient une défense antimissile contre les Houthis (Patriot PAC-3). Relations complexes avec les USA. Normalisation avec Israël suspendue depuis Gaza. Rapprochement diplomatique avec l'Iran (accord de Pékin 2023). Production pétrolière utilisée comme levier géopolitique. Programme spatial et nucléaire civil en développement.",
    recentEvents: [
      { date: "2026-03-09", event: "Interception missile Houthi au-dessus de Riyad", severity: "high" },
      { date: "2026-03-07", event: "Accord de défense élargi avec les USA", severity: "medium" },
      { date: "2026-03-05", event: "Réduction production OPEC+ de 500K barils", severity: "medium" },
      { date: "2026-03-03", event: "Exercice naval conjoint avec l'Égypte", severity: "low" },
      { date: "2026-03-01", event: "Normalisation Israël : négociations reprises", severity: "high" },
    ],
    economicData: { gdp: "$1.1T", sanctions: "Aucune", oilProduction: "9.5M barils/jour", currency: "SAR (Riyal)" },
    cyberCapability: "Moderate",
    proxyForces: [],
  },
  {
    id: "iraq",
    name: "Irak",
    flag: "🇮🇶",
    capital: "Bagdad",
    threatLevel: "HIGH",
    tlp: "AMBER",
    population: "44M",
    regime: "République fédérale parlementaire",
    military: "Forces Armées Irakiennes — 193 000 + PMF/Hashd 150 000",
    nuclearStatus: "Aucun programme",
    alliances: ["Iran (influence)", "États-Unis (présence militaire)"],
    adversaries: ["Daech (résiduel)", "Tensions internes"],
    activeConflicts: ["Milices pro-Iran vs bases US", "Résidus Daech", "Tensions Kurdistan"],
    keyBases: [
      { name: "Al-Asad", type: "Base aérienne (US)", lat: 33.786, lng: 42.441 },
      { name: "Camp Victory/Bagdad", type: "Base US", lat: 33.295, lng: 44.235 },
      { name: "Erbil", type: "Base coalition", lat: 36.237, lng: 43.963 },
      { name: "Bassorah", type: "Port stratégique", lat: 30.508, lng: 47.783 },
      { name: "Kirkouk", type: "Zone pétrolière", lat: 35.468, lng: 44.392 },
    ],
    intelSummary: "L'Irak est tiraillé entre l'influence iranienne et la présence américaine. Les milices du Hashd al-Shaabi (PMF), soutenues par l'Iran, mènent des attaques régulières contre les bases US. Daech maintient des cellules dormantes dans les zones rurales. Le Kurdistan irakien conserve une autonomie de facto. Les revenus pétroliers de Bassorah sont vitaux pour l'économie. La corruption reste systémique.",
    recentEvents: [
      { date: "2026-03-10", event: "Attaque drone sur la base Al-Asad", severity: "high" },
      { date: "2026-03-08", event: "Opération anti-Daech dans le désert d'Anbar", severity: "medium" },
      { date: "2026-03-06", event: "Manifestations à Bagdad contre la présence iranienne", severity: "medium" },
      { date: "2026-03-04", event: "Tensions Bagdad-Erbil sur les revenus pétroliers", severity: "low" },
      { date: "2026-03-02", event: "Frappes US de représailles sur milices pro-Iran", severity: "high" },
    ],
    economicData: { gdp: "$264B", sanctions: "Aucune", oilProduction: "4.5M barils/jour", currency: "IQD (Dinar)" },
    cyberCapability: "Basic",
    proxyForces: ["Hashd al-Shaabi (PMF)", "Kata'ib Hezbollah", "Asa'ib Ahl al-Haq"],
  },
  {
    id: "egypt",
    name: "Égypte",
    flag: "🇪🇬",
    capital: "Le Caire",
    threatLevel: "MODERATE",
    tlp: "GREEN",
    population: "109M",
    regime: "République présidentielle — Président al-Sissi",
    military: "Forces Armées Égyptiennes — 438 000 actifs (plus grande armée arabe)",
    nuclearStatus: "Centrale El-Dabaa en construction (Rosatom)",
    alliances: ["États-Unis", "Israël (traité de paix)", "Arabie Saoudite", "EAU"],
    adversaries: ["Frères Musulmans", "Daech-Sinaï"],
    activeConflicts: ["Insurrection Sinaï", "Crise Gaza (frontière Rafah)", "Tensions Éthiopie (barrage GERD)"],
    keyBases: [
      { name: "Base Mohamed Naguib", type: "Plus grande base ME", lat: 31.050, lng: 27.900 },
      { name: "Canal de Suez", type: "Stratégique mondial", lat: 30.580, lng: 32.265 },
      { name: "Berenice", type: "Base navale/aérienne", lat: 23.946, lng: 35.473 },
      { name: "Rafah", type: "Frontière Gaza", lat: 31.280, lng: 34.240 },
      { name: "Sinaï Nord", type: "Zone opérations anti-terrorisme", lat: 31.000, lng: 33.800 },
    ],
    intelSummary: "L'Égypte joue un rôle de médiateur dans le conflit Gaza tout en sécurisant sa frontière à Rafah. Le canal de Suez, vital pour le commerce mondial, est affecté par les attaques Houthis en Mer Rouge. L'armée mène des opérations anti-terrorisme dans le Sinaï. La tension avec l'Éthiopie sur le barrage GERD reste un enjeu existentiel. L'aide militaire US ($1.3B/an) maintient l'alliance stratégique.",
    recentEvents: [
      { date: "2026-03-09", event: "Médiation égyptienne pour un cessez-le-feu à Gaza", severity: "high" },
      { date: "2026-03-07", event: "Revenus du canal de Suez en baisse de 40%", severity: "medium" },
      { date: "2026-03-05", event: "Opération anti-terrorisme dans le Sinaï Nord", severity: "medium" },
      { date: "2026-03-03", event: "Exercice naval Bright Star avec les USA", severity: "low" },
      { date: "2026-03-01", event: "Aide humanitaire acheminée via Rafah", severity: "medium" },
    ],
    economicData: { gdp: "$476B", sanctions: "Aucune", oilProduction: "600K barils/jour", currency: "EGP (Livre)" },
    cyberCapability: "Moderate",
    proxyForces: [],
  },
  {
    id: "turkey",
    name: "Turquie",
    flag: "🇹🇷",
    capital: "Ankara",
    threatLevel: "ELEVATED",
    tlp: "AMBER",
    population: "85.3M",
    regime: "République présidentielle — Président Erdogan",
    military: "Forces Armées Turques — 355 000 actifs (2e armée OTAN)",
    nuclearStatus: "Armes nucléaires US à Incirlik (B61) + centrale Akkuyu",
    alliances: ["OTAN", "Azerbaïdjan", "Qatar", "Libye (GNA)"],
    adversaries: ["PKK/YPG", "Syrie (partiel)", "Grèce (tensions)"],
    activeConflicts: ["Opérations anti-PKK (Irak/Syrie)", "Zone tampon nord-Syrie", "Tensions Méditerranée"],
    keyBases: [
      { name: "Incirlik", type: "Base aérienne OTAN/US", lat: 37.002, lng: 35.426 },
      { name: "Base navale Aksaz", type: "Navale", lat: 36.960, lng: 28.380 },
      { name: "Nord-Syrie", type: "Zone occupation", lat: 36.800, lng: 38.000 },
      { name: "Nord-Irak", type: "Bases anti-PKK", lat: 37.100, lng: 43.500 },
      { name: "Aksaray", type: "Drones Bayraktar", lat: 38.370, lng: 34.030 },
    ],
    intelSummary: "La Turquie maintient une position ambiguë dans le conflit. Membre de l'OTAN mais relations tendues avec les USA et l'UE. Opérations militaires continues contre le PKK en Irak et Syrie. Industrie de défense en plein essor (Bayraktar TB2/TB3, Kaan F-16 Block 80). Contrôle du détroit du Bosphore. Relations commerciales maintenues avec la Russie malgré les sanctions. Médiation proposée dans le conflit Israël-Hamas.",
    recentEvents: [
      { date: "2026-03-10", event: "Opération aérienne anti-PKK dans le nord de l'Irak", severity: "high" },
      { date: "2026-03-08", event: "Livraison de drones Bayraktar TB3 à la marine", severity: "medium" },
      { date: "2026-03-06", event: "Erdogan condamne les frappes sur Gaza", severity: "medium" },
      { date: "2026-03-04", event: "Exercice naval en Méditerranée orientale", severity: "low" },
      { date: "2026-03-02", event: "Tensions diplomatiques avec Israël — rappel ambassadeur", severity: "high" },
    ],
    economicData: { gdp: "$1.1T", sanctions: "Ciblées (CAATSA)", oilProduction: "70K barils/jour", currency: "TRY (Livre)" },
    cyberCapability: "Moderate",
    proxyForces: ["SNA (Armée Nationale Syrienne)", "Milices libyennes alliées"],
  },
  {
    id: "uae",
    name: "Émirats Arabes Unis",
    flag: "🇦🇪",
    capital: "Abu Dhabi",
    threatLevel: "LOW",
    tlp: "GREEN",
    population: "10M",
    regime: "Fédération de monarchies — Président MBZ",
    military: "Forces Armées des EAU — 63 000 actifs + équipement avancé",
    nuclearStatus: "Centrale Barakah (4 réacteurs civils)",
    alliances: ["États-Unis", "Israël (Abraham)", "Arabie Saoudite", "France"],
    adversaries: ["Iran (tensions)", "Frères Musulmans"],
    activeConflicts: ["Aucun conflit direct actif"],
    keyBases: [
      { name: "Al Dhafra", type: "Base aérienne (USAF)", lat: 24.248, lng: 54.547 },
      { name: "Jebel Ali", type: "Port naval", lat: 25.007, lng: 55.058 },
      { name: "Barakah", type: "Nucléaire civil", lat: 23.960, lng: 52.260 },
      { name: "Assab (Érythrée)", type: "Base extérieure", lat: 13.070, lng: 42.740 },
      { name: "Dubaï", type: "Hub logistique", lat: 25.276, lng: 55.296 },
    ],
    intelSummary: "Les EAU sont un hub stratégique et économique du Golfe. Normalisation avec Israël via les Accords d'Abraham. Présence militaire US à Al Dhafra. Industrie de défense en croissance (EDGE Group). Politique étrangère assertive sous MBZ. Relations pragmatiques avec l'Iran. Hub de renseignement et technologie de surveillance (NSO Group, DarkMatter). Investissements massifs dans l'IA et le spatial.",
    recentEvents: [
      { date: "2026-03-09", event: "Exercice conjoint avec Israël (Blue Flag)", severity: "low" },
      { date: "2026-03-07", event: "Contrat THAAD supplémentaire avec les USA", severity: "medium" },
      { date: "2026-03-05", event: "Sommet diplomatique Iran-EAU à Abu Dhabi", severity: "medium" },
      { date: "2026-03-03", event: "Lancement satellite espion Falcon Eye 3", severity: "low" },
      { date: "2026-03-01", event: "Investissement $2B dans l'IA militaire", severity: "low" },
    ],
    economicData: { gdp: "$509B", sanctions: "Aucune", oilProduction: "3.2M barils/jour", currency: "AED (Dirham)" },
    cyberCapability: "Advanced",
    proxyForces: ["Forces soutenues au Yémen (STC)"],
  },
  {
    id: "jordan",
    name: "Jordanie",
    flag: "🇯🇴",
    capital: "Amman",
    threatLevel: "MODERATE",
    tlp: "GREEN",
    population: "11.5M",
    regime: "Monarchie constitutionnelle — Roi Abdallah II",
    military: "Forces Armées Jordaniennes — 100 000 actifs",
    nuclearStatus: "Aucun programme",
    alliances: ["États-Unis", "Israël (traité de paix)", "Arabie Saoudite", "Royaume-Uni"],
    adversaries: ["Daech (résiduel)", "Instabilité régionale"],
    activeConflicts: ["Trafic d'armes/drogue depuis la Syrie", "Tensions internes (Gaza)"],
    keyBases: [
      { name: "Muwaffaq Salti", type: "Base aérienne (US)", lat: 32.356, lng: 36.782 },
      { name: "KASOTC", type: "Centre entraînement SOF", lat: 31.800, lng: 36.100 },
      { name: "Aqaba", type: "Port naval", lat: 29.527, lng: 35.008 },
      { name: "Frontière syrienne", type: "Zone tampon", lat: 32.500, lng: 37.000 },
      { name: "Amman", type: "QG commandement", lat: 31.956, lng: 35.945 },
    ],
    intelSummary: "La Jordanie est un pilier de stabilité régionale et un allié clé des USA. Le royaume accueille 1.3M de réfugiés syriens. La frontière nord est une zone de trafic d'armes et de captagon depuis la Syrie. Les manifestations pro-Gaza mettent la monarchie sous pression. Les forces spéciales jordaniennes sont parmi les meilleures de la région. Le GID (renseignement) coopère étroitement avec la CIA et le Mossad.",
    recentEvents: [
      { date: "2026-03-09", event: "Interception de drones iraniens dans l'espace aérien", severity: "high" },
      { date: "2026-03-07", event: "Saisie de captagon à la frontière syrienne", severity: "medium" },
      { date: "2026-03-05", event: "Manifestation pro-Gaza à Amman (50 000 personnes)", severity: "medium" },
      { date: "2026-03-03", event: "Exercice conjoint avec les forces spéciales US", severity: "low" },
      { date: "2026-03-01", event: "Aide humanitaire larguée sur Gaza par l'armée", severity: "medium" },
    ],
    economicData: { gdp: "$50B", sanctions: "Aucune", oilProduction: "Aucune", currency: "JOD (Dinar)" },
    cyberCapability: "Moderate",
    proxyForces: [],
  },
  {
    id: "qatar",
    name: "Qatar",
    flag: "🇶🇦",
    capital: "Doha",
    threatLevel: "LOW",
    tlp: "GREEN",
    population: "2.9M",
    regime: "Monarchie absolue — Émir Tamim",
    military: "Forces Armées du Qatar — 16 000 actifs",
    nuclearStatus: "Aucun programme",
    alliances: ["États-Unis (Al Udeid)", "Turquie", "Iran (relations)"],
    adversaries: ["Tensions historiques avec Arabie Saoudite/EAU"],
    activeConflicts: ["Aucun conflit direct"],
    keyBases: [
      { name: "Al Udeid", type: "Base aérienne CENTCOM/USAF", lat: 25.117, lng: 51.315 },
      { name: "Camp As Sayliyah", type: "Base US pré-positionnement", lat: 25.280, lng: 51.380 },
      { name: "Base turque", type: "Garnison turque", lat: 25.300, lng: 51.400 },
      { name: "Doha Port", type: "Naval", lat: 25.290, lng: 51.530 },
      { name: "Al Jazeera HQ", type: "Média stratégique", lat: 25.315, lng: 51.496 },
    ],
    intelSummary: "Le Qatar héberge la plus grande base aérienne US au Moyen-Orient (Al Udeid/CENTCOM). Médiateur clé dans le conflit Gaza (bureau politique Hamas à Doha). Relations avec l'Iran (champ gazier partagé). Al Jazeera comme outil d'influence médiatique. Richesse gazière colossale (3e réserves mondiales). Diplomatie de médiation active dans tous les conflits régionaux.",
    recentEvents: [
      { date: "2026-03-10", event: "Médiation Qatar pour libération d'otages à Gaza", severity: "high" },
      { date: "2026-03-08", event: "Visite du chef politique Hamas à Doha", severity: "medium" },
      { date: "2026-03-06", event: "Contrat GNL record avec la Chine", severity: "low" },
      { date: "2026-03-04", event: "Exercice aérien conjoint US-Qatar", severity: "low" },
      { date: "2026-03-02", event: "Aide humanitaire $100M pour Gaza", severity: "medium" },
    ],
    economicData: { gdp: "$236B", sanctions: "Aucune", oilProduction: "1.8M barils/jour (gaz)", currency: "QAR (Riyal)" },
    cyberCapability: "Moderate",
    proxyForces: [],
  },
  {
    id: "bahrain",
    name: "Bahreïn",
    flag: "🇧🇭",
    capital: "Manama",
    threatLevel: "MODERATE",
    tlp: "GREEN",
    population: "1.5M",
    regime: "Monarchie constitutionnelle — Roi Hamad",
    military: "Forces de Défense de Bahreïn — 13 000 + 5e Flotte US",
    nuclearStatus: "Aucun programme",
    alliances: ["États-Unis (5e Flotte)", "Arabie Saoudite", "Israël (Abraham)"],
    adversaries: ["Iran (influence chiite)"],
    activeConflicts: ["Tensions sectaires internes"],
    keyBases: [
      { name: "NSA Bahrain", type: "QG 5e Flotte US", lat: 26.236, lng: 50.565 },
      { name: "Isa Air Base", type: "Aérienne", lat: 26.157, lng: 50.548 },
      { name: "Khalifa Port", type: "Naval", lat: 26.000, lng: 50.600 },
    ],
    intelSummary: "Bahreïn héberge le QG de la 5e Flotte US, pivot naval au Moyen-Orient. Normalisation avec Israël via les Accords d'Abraham. Population à majorité chiite gouvernée par une monarchie sunnite, source de tensions internes. L'Iran est accusé de soutenir l'opposition. Position stratégique dans le Golfe Persique.",
    recentEvents: [
      { date: "2026-03-08", event: "Exercice naval combiné avec la 5e Flotte", severity: "low" },
      { date: "2026-03-05", event: "Accord de coopération renseignement avec Israël", severity: "medium" },
      { date: "2026-03-02", event: "Manifestation chiite réprimée à Manama", severity: "medium" },
    ],
    economicData: { gdp: "$44B", sanctions: "Aucune", oilProduction: "190K barils/jour", currency: "BHD (Dinar)" },
    cyberCapability: "Basic",
    proxyForces: [],
  },
  {
    id: "palestine",
    name: "Palestine (Gaza/Cisjordanie)",
    flag: "🇵🇸",
    capital: "Ramallah (AP) / Gaza (Hamas)",
    threatLevel: "CRITICAL",
    tlp: "RED",
    population: "5.4M",
    regime: "Divisé — AP (Cisjordanie) / Hamas (Gaza)",
    military: "Hamas: Brigades Qassam 30 000+ / Jihad Islamique / AP: Forces de sécurité",
    nuclearStatus: "Aucun",
    alliances: ["Iran (Hamas)", "Qatar (aide)", "Turquie (soutien)"],
    adversaries: ["Israël"],
    activeConflicts: ["Guerre à Gaza", "Raids en Cisjordanie", "Blocus"],
    keyBases: [
      { name: "Gaza City", type: "Zone de combat", lat: 31.500, lng: 34.467 },
      { name: "Khan Younis", type: "Zone de combat", lat: 31.346, lng: 34.302 },
      { name: "Rafah", type: "Frontière/Tunnels", lat: 31.280, lng: 34.250 },
      { name: "Jénine", type: "Camp/Résistance", lat: 32.460, lng: 35.300 },
      { name: "Ramallah", type: "QG Autorité Palestinienne", lat: 31.903, lng: 35.204 },
    ],
    intelSummary: "Gaza subit une offensive militaire israélienne massive depuis octobre 2023. Le Hamas maintient une capacité de résistance via un réseau de tunnels. La crise humanitaire est catastrophique. En Cisjordanie, les raids israéliens s'intensifient. L'Autorité Palestinienne est affaiblie. Le Jihad Islamique Palestinien opère en parallèle du Hamas avec le soutien iranien.",
    recentEvents: [
      { date: "2026-03-10", event: "Offensive terrestre israélienne à Rafah — Phase 3", severity: "critical" },
      { date: "2026-03-09", event: "Tirs de roquettes depuis Gaza vers Tel Aviv", severity: "high" },
      { date: "2026-03-07", event: "Crise humanitaire : famine déclarée par l'ONU", severity: "critical" },
      { date: "2026-03-05", event: "Raid israélien à Jénine — 12 arrestations", severity: "high" },
      { date: "2026-03-03", event: "Négociations otages via Qatar — impasse", severity: "high" },
    ],
    economicData: { gdp: "$18B (estimé)", sanctions: "Blocus (Gaza)", oilProduction: "Aucune", currency: "ILS/JOD" },
    cyberCapability: "Basic",
    proxyForces: ["Brigades Qassam (Hamas)", "Brigades Al-Quds (JIP)", "Brigades des Martyrs d'Al-Aqsa"],
  },
];

const THREAT_COLORS: Record<string, string> = {
  CRITICAL: "#ef4444",
  HIGH: "#f97316",
  ELEVATED: "#eab308",
  MODERATE: "#22c55e",
  LOW: "#06b6d4",
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

const LIVE_NEWS: NewsItem[] = [
  { title: "Frappes massives sur Dahieh — Beyrouth", source: "Al Jazeera", time: "Il y a 12 min", severity: "critical", region: "Liban" },
  { title: "Test missile Fattah-2 confirmé par le CGRI", source: "IRNA", time: "Il y a 34 min", severity: "critical", region: "Iran" },
  { title: "Offensive terrestre à Rafah — Phase 3", source: "IDF", time: "Il y a 45 min", severity: "critical", region: "Palestine" },
  { title: "Interception de 3 drones au-dessus du Golan", source: "IDF", time: "Il y a 1h", severity: "high", region: "Israël" },
  { title: "Attaque maritime Houthi en Mer Rouge — cargo touché", source: "CENTCOM", time: "Il y a 2h", severity: "high", region: "Yémen" },
  { title: "Attaque drone sur base Al-Asad en Irak", source: "CENTCOM", time: "Il y a 2h30", severity: "high", region: "Irak" },
  { title: "Mouvement de troupes iraniennes près de Deir ez-Zor", source: "OSINT", time: "Il y a 3h", severity: "high", region: "Syrie" },
  { title: "Interception missile Houthi au-dessus de Riyad", source: "SPA", time: "Il y a 3h30", severity: "high", region: "Arabie Saoudite" },
  { title: "Enrichissement uranium : AIEA confirme 63.5%", source: "Reuters", time: "Il y a 4h", severity: "critical", region: "Iran" },
  { title: "Opération anti-PKK turque dans le nord de l'Irak", source: "Anadolu", time: "Il y a 4h30", severity: "medium", region: "Turquie" },
  { title: "Médiation Qatar pour libération d'otages", source: "Al Jazeera", time: "Il y a 5h", severity: "high", region: "Qatar" },
  { title: "Revenus canal de Suez en baisse de 40%", source: "Reuters", time: "Il y a 5h30", severity: "medium", region: "Égypte" },
  { title: "Évacuation de 50 000 civils du sud-Liban", source: "OCHA", time: "Il y a 5h", severity: "medium", region: "Liban" },
  { title: "Cyber-attaque repoussée sur le réseau électrique israélien", source: "Shin Bet", time: "Il y a 6h", severity: "medium", region: "Israël" },
];

export default function MiddleEastAnalysis() {
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [activeTab, setActiveTab] = useState<"overview" | "military" | "intel" | "events" | "economic">("overview");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuery, setAiQuery] = useState("");
  const [clock, setClock] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const requestAiAnalysis = useCallback(async (query?: string) => {
    setAiLoading(true);
    setAiAnalysis("");
    const prompt = query || `Analyse géopolitique et sécuritaire complète de la situation actuelle au ${selectedCountry.name} dans le contexte du conflit au Moyen-Orient. Inclure : menaces actives, capacités militaires, alliances, scénarios probables à court terme. Répondre en français de manière concise et opérationnelle.`;
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": "Bearer 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",
          "Content-Type": "application/json",
          "HTTP-Referer": "https://kal-el.group/",
          "X-Title": "Kal-El ME Analysis"
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: "Tu es un analyste géopolitique et militaire expert du Moyen-Orient. Réponds en français de manière concise, factuelle et opérationnelle. Utilise un style briefing de renseignement." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2048,
          stream: true
        })
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";
      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          const json = line.replace("data: ", "");
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content || "";
            full += content;
            setAiAnalysis(full);
          } catch {}
        }
      }
    } catch (e) {
      setAiAnalysis("Erreur de connexion au service d'analyse IA.");
    }
    setAiLoading(false);
  }, [selectedCountry]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-12 shrink-0 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#070d1a]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Globe size={16} className="text-red-500" />
          <h1 className="font-[Rajdhani] font-bold text-sm text-white/90 tracking-wider uppercase">Analyse Moyen-Orient</h1>
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] text-red-400 font-bold uppercase tracking-widest">LIVE</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono text-white/30">{clock.toLocaleTimeString("fr-FR")} UTC+0</span>
          <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold uppercase tracking-widest">DEFCON 3</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Country selector + News */}
        <div className="w-64 shrink-0 border-r border-white/[0.06] flex flex-col bg-[#070d1a]/40">
          <div className="p-3 border-b border-white/[0.06]">
            <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest mb-2">Pays surveillés</div>
            <div className="space-y-1">
              {COUNTRIES.map(c => (
                <button key={c.id} onClick={() => { setSelectedCountry(c); setAiAnalysis(""); }}
                  className={`w-full p-2 rounded-lg flex items-center gap-2.5 transition-all text-left ${selectedCountry.id === c.id ? "bg-white/[0.06] border border-white/[0.08]" : "border border-transparent hover:bg-white/[0.03]"}`}>
                  <span className="text-lg">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-white/80 truncate">{c.name}</div>
                    <div className="text-[8px] text-white/30 uppercase tracking-widest">{c.capital}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: THREAT_COLORS[c.threatLevel] }} />
                    <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: THREAT_COLORS[c.threatLevel] }}>{c.threatLevel}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Live News Feed */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex items-center gap-2 mb-2">
              <Radio size={10} className="text-red-500 animate-pulse" />
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Fil d'Alerte en Direct</span>
            </div>
            <div className="space-y-1.5">
              {LIVE_NEWS.map((n, i) => (
                <div key={i} className="p-2 rounded-lg bg-black/30 border border-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: SEVERITY_COLORS[n.severity] }} />
                    <div>
                      <div className="text-[10px] text-white/60 leading-tight">{n.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[8px] text-white/20">{n.source}</span>
                        <span className="text-[8px] text-white/15">{n.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Country Analysis */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Country Header */}
          <div className="p-4 border-b border-white/[0.06] bg-[#070d1a]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedCountry.flag}</span>
                <div>
                  <h2 className="font-[Rajdhani] font-bold text-xl text-white/90">{selectedCountry.name}</h2>
                  <div className="text-[10px] text-white/30">{selectedCountry.regime}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest" style={{ borderColor: THREAT_COLORS[selectedCountry.threatLevel] + "40", color: THREAT_COLORS[selectedCountry.threatLevel], backgroundColor: THREAT_COLORS[selectedCountry.threatLevel] + "10" }}>
                  Menace: {selectedCountry.threatLevel}
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  TLP:{selectedCountry.tlp}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-3">
              {(["overview", "military", "intel", "events", "economic"] as const).map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${activeTab === t ? "bg-[#00a8ff]/15 text-[#00a8ff] border border-[#00a8ff]/20" : "text-white/25 hover:text-white/40 border border-transparent"}`}>
                  {t === "overview" ? "Vue d'ensemble" : t === "military" ? "Militaire" : t === "intel" ? "Renseignement" : t === "events" ? "Événements" : "Économie"}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab + selectedCountry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                {activeTab === "overview" && (
                  <div className="space-y-4">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-1"><Users size={12} className="text-[#00a8ff]" /><span className="text-[9px] text-white/30 uppercase tracking-widest">Population</span></div>
                        <div className="text-lg font-bold text-white/80 font-[Rajdhani]">{selectedCountry.population}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-1"><Shield size={12} className="text-emerald-400" /><span className="text-[9px] text-white/30 uppercase tracking-widest">Nucléaire</span></div>
                        <div className="text-[11px] font-semibold text-white/60 leading-tight">{selectedCountry.nuclearStatus.split("(")[0]}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-1"><Zap size={12} className="text-amber-400" /><span className="text-[9px] text-white/30 uppercase tracking-widest">Cyber</span></div>
                        <div className="text-lg font-bold text-white/80 font-[Rajdhani]">{selectedCountry.cyberCapability}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-1"><Flame size={12} className="text-red-400" /><span className="text-[9px] text-white/30 uppercase tracking-widest">Conflits</span></div>
                        <div className="text-lg font-bold text-white/80 font-[Rajdhani]">{selectedCountry.activeConflicts.length}</div>
                      </div>
                    </div>

                    {/* Alliances & Adversaires */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                        <div className="text-[9px] font-bold text-emerald-400/60 uppercase tracking-widest mb-2">Alliances</div>
                        <div className="space-y-1">{selectedCountry.alliances.map((a, i) => (
                          <div key={i} className="text-[10px] text-white/50 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-emerald-500" />{a}</div>
                        ))}</div>
                      </div>
                      <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                        <div className="text-[9px] font-bold text-red-400/60 uppercase tracking-widest mb-2">Adversaires</div>
                        <div className="space-y-1">{selectedCountry.adversaries.map((a, i) => (
                          <div key={i} className="text-[10px] text-white/50 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-red-500" />{a}</div>
                        ))}</div>
                      </div>
                    </div>

                    {/* Conflits actifs */}
                    <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                      <div className="text-[9px] font-bold text-amber-400/60 uppercase tracking-widest mb-2">Conflits Actifs</div>
                      <div className="flex flex-wrap gap-1.5">{selectedCountry.activeConflicts.map((c, i) => (
                        <span key={i} className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/15 text-[9px] text-amber-400/70">{c}</span>
                      ))}</div>
                    </div>

                    {/* Proxy Forces */}
                    {selectedCountry.proxyForces.length > 0 && (
                      <div className="p-3 rounded-xl bg-black/30 border border-white/[0.04]">
                        <div className="text-[9px] font-bold text-purple-400/60 uppercase tracking-widest mb-2">Forces Proxy / Milices</div>
                        <div className="space-y-1">{selectedCountry.proxyForces.map((p, i) => (
                          <div key={i} className="text-[10px] text-white/50 flex items-center gap-2"><Target size={10} className="text-purple-400/50" />{p}</div>
                        ))}</div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "military" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                      <div className="text-[9px] font-bold text-[#00a8ff]/60 uppercase tracking-widest mb-2">Forces Armées</div>
                      <div className="text-[12px] text-white/60 leading-relaxed">{selectedCountry.military}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                      <div className="text-[9px] font-bold text-amber-400/60 uppercase tracking-widest mb-2">Statut Nucléaire</div>
                      <div className="text-[12px] text-white/60 leading-relaxed">{selectedCountry.nuclearStatus}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                      <div className="text-[9px] font-bold text-red-400/60 uppercase tracking-widest mb-3">Bases & Installations Clés</div>
                      <div className="space-y-2">{selectedCountry.keyBases.map((b, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                          <div className="flex items-center gap-2.5">
                            <Crosshair size={12} className="text-red-400/50" />
                            <div>
                              <div className="text-[11px] font-semibold text-white/60">{b.name}</div>
                              <div className="text-[9px] text-white/25">{b.type}</div>
                            </div>
                          </div>
                          <div className="text-[9px] font-mono text-white/15">{b.lat.toFixed(3)}, {b.lng.toFixed(3)}</div>
                        </div>
                      ))}</div>
                    </div>
                  </div>
                )}

                {activeTab === "intel" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                      <div className="text-[9px] font-bold text-[#00a8ff]/60 uppercase tracking-widest mb-2">Résumé Renseignement</div>
                      <div className="text-[12px] text-white/60 leading-relaxed">{selectedCountry.intelSummary}</div>
                    </div>

                    {/* AI Analysis */}
                    <div className="p-4 rounded-xl bg-[#00a8ff]/[0.03] border border-[#00a8ff]/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Activity size={12} className="text-[#00a8ff]" />
                          <span className="text-[9px] font-bold text-[#00a8ff]/60 uppercase tracking-widest">Analyse IA — Gemini</span>
                        </div>
                        <button onClick={() => requestAiAnalysis()} disabled={aiLoading}
                          className="px-3 py-1 rounded-md bg-[#00a8ff]/10 border border-[#00a8ff]/20 text-[9px] text-[#00a8ff] font-bold uppercase tracking-widest hover:bg-[#00a8ff]/15 transition-all flex items-center gap-1.5">
                          {aiLoading ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                          Analyser
                        </button>
                      </div>
                      <div className="flex gap-2 mb-3">
                        <input value={aiQuery} onChange={e => setAiQuery(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && aiQuery && requestAiAnalysis(aiQuery)}
                          placeholder="Question spécifique sur ce pays..."
                          className="flex-1 bg-black/30 border border-white/[0.06] rounded-lg px-3 py-1.5 text-[11px] text-white outline-none focus:border-[#00a8ff]/20 transition-all" />
                        <button onClick={() => aiQuery && requestAiAnalysis(aiQuery)} disabled={aiLoading || !aiQuery}
                          className="px-3 rounded-lg bg-[#00a8ff]/10 border border-[#00a8ff]/20 text-[#00a8ff] hover:bg-[#00a8ff]/15 transition-all disabled:opacity-30">
                          <Send size={12} />
                        </button>
                      </div>
                      {aiAnalysis ? (
                        <div className="text-[11px] text-white/50 leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto">{aiAnalysis}</div>
                      ) : (
                        <div className="text-[10px] text-white/15 text-center py-4">Cliquez "Analyser" pour un briefing IA complet</div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "events" && (
                  <div className="space-y-3">
                    <div className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Événements Récents</div>
                    {selectedCountry.recentEvents.map((e, i) => (
                      <div key={i} className="p-3 rounded-xl bg-black/30 border border-white/[0.04] flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ backgroundColor: SEVERITY_COLORS[e.severity] }} />
                        <div className="flex-1">
                          <div className="text-[11px] text-white/60 leading-tight">{e.event}</div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Clock size={9} className="text-white/20" />
                            <span className="text-[9px] text-white/20">{e.date}</span>
                            <span className="text-[8px] px-1.5 py-0.5 rounded uppercase tracking-widest font-bold" style={{ color: SEVERITY_COLORS[e.severity], backgroundColor: SEVERITY_COLORS[e.severity] + "15" }}>{e.severity}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "economic" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                        <div className="text-[9px] text-white/25 uppercase tracking-widest mb-1">PIB</div>
                        <div className="text-xl font-bold text-white/80 font-[Rajdhani]">{selectedCountry.economicData.gdp}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                        <div className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Production Pétrole</div>
                        <div className="text-xl font-bold text-white/80 font-[Rajdhani]">{selectedCountry.economicData.oilProduction}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                        <div className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Monnaie</div>
                        <div className="text-lg font-bold text-white/80 font-[Rajdhani]">{selectedCountry.economicData.currency}</div>
                      </div>
                      <div className="p-4 rounded-xl bg-black/30 border border-white/[0.04]">
                        <div className="text-[9px] text-white/25 uppercase tracking-widest mb-1">Sanctions</div>
                        <div className="text-[12px] font-semibold text-white/60">{selectedCountry.economicData.sanctions}</div>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
