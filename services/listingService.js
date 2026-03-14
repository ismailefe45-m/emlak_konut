/**
 * ─── Listing Service ───
 * Fetches comparable property listings for the same district.
 * Returns median price per m², average days on market, and
 * urgency/sentiment signals extracted via simple NLP keyword scanning.
 *
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ML INTEGRATION POINT                                       ║
 * ║  Replace the simulated data below with a real scraper or    ║
 * ║  a microservice call that returns the same interface shape. ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * Interface: async enrich(propertyData) → { medianPricePerSqm, avgDaysOnMarket, listingCount, sentimentSignals[] }
 */

const config = require('../config');

// ── Urgency / sentiment keywords (Turkish) ──
const URGENCY_KEYWORDS = [
  { keyword: 'acil satılık', weight: 0.9, label: 'Acil Satılık' },
  { keyword: 'acil', weight: 0.7, label: 'Acil' },
  { keyword: 'pazarlık yok', weight: 0.3, label: 'Pazarlık Yok' },
  { keyword: 'fiyat düştü', weight: 0.8, label: 'Fiyat Düştü' },
  { keyword: 'son fiyat', weight: 0.4, label: 'Son Fiyat' },
  { keyword: 'kelepir', weight: 0.9, label: 'Kelepir' },
  { keyword: 'yatırımlık', weight: -0.3, label: 'Yatırımlık' },
  { keyword: 'lüks', weight: -0.5, label: 'Lüks' },
];

/**
 * Scan a listing description for sentiment signals
 */
function extractSentiment(text) {
  const lower = text.toLowerCase();
  return URGENCY_KEYWORDS.filter(kw => lower.includes(kw.keyword));
}

// ── Simulated comparable listings by district ──
// In production, replace this function body with a real scraper
// (e.g. axios + cheerio against Sahibinden) or an API call.
const SIMULATED_DATA = {
  'kadıköy':    { medianPricePerSqm: 85000, avgDaysOnMarket: 32, listingCount: 47 },
  'beşiktaş':   { medianPricePerSqm: 95000, avgDaysOnMarket: 28, listingCount: 38 },
  'üsküdar':    { medianPricePerSqm: 65000, avgDaysOnMarket: 41, listingCount: 55 },
  'ataşehir':   { medianPricePerSqm: 58000, avgDaysOnMarket: 38, listingCount: 62 },
  'bakırköy':   { medianPricePerSqm: 72000, avgDaysOnMarket: 35, listingCount: 43 },
  'sarıyer':    { medianPricePerSqm: 110000, avgDaysOnMarket: 45, listingCount: 29 },
  'beyoğlu':    { medianPricePerSqm: 78000, avgDaysOnMarket: 30, listingCount: 51 },
  'maltepe':    { medianPricePerSqm: 52000, avgDaysOnMarket: 42, listingCount: 58 },
  'pendik':     { medianPricePerSqm: 38000, avgDaysOnMarket: 50, listingCount: 71 },
  'kartal':     { medianPricePerSqm: 45000, avgDaysOnMarket: 44, listingCount: 63 },
  'şişli':      { medianPricePerSqm: 88000, avgDaysOnMarket: 27, listingCount: 34 },
  'fatih':      { medianPricePerSqm: 55000, avgDaysOnMarket: 48, listingCount: 66 },
  'beylikdüzü': { medianPricePerSqm: 35000, avgDaysOnMarket: 55, listingCount: 82 },
  'esenyurt':   { medianPricePerSqm: 25000, avgDaysOnMarket: 60, listingCount: 95 },
  'başakşehir': { medianPricePerSqm: 42000, avgDaysOnMarket: 46, listingCount: 57 },
};
const DEFAULT_DATA = { medianPricePerSqm: 50000, avgDaysOnMarket: 40, listingCount: 30 };

// Simulated listing descriptions for sentiment extraction demo
const SIMULATED_DESCRIPTIONS = [
  'Kadıköy merkezde acil satılık 3+1 daire, pazarlık yok.',
  'Deniz manzaralı lüks daire, yatırımlık fırsat.',
  'Fiyat düştü! Bakımlı daire uygun fiyata.',
  'Sahibinden kelepir daire, son fiyat.',
  'Aile yaşamına uygun, ferah ve aydınlık.',
];

const listingService = {
  name: 'listings',

  async enrich(propertyData) {
    const district = (propertyData.district || '').toLowerCase().trim();

    // ─── SCRAPER PLUG-IN POINT ───
    // To use a real scraper, replace the block below with:
    //   const listings = await scrapeListings(district, propertyData);
    //   const medianPricePerSqm = computeMedian(listings.map(l => l.pricePerSqm));
    //   ...
    // The return shape must stay the same.

    const data = SIMULATED_DATA[district] || DEFAULT_DATA;

    // Add some realistic variance (±10 %)
    const variance = 0.9 + Math.random() * 0.2;
    const medianPricePerSqm = Math.round(data.medianPricePerSqm * variance);

    // Extract sentiment from simulated descriptions
    const allSignals = [];
    for (const desc of SIMULATED_DESCRIPTIONS) {
      allSignals.push(...extractSentiment(desc));
    }
    // Deduplicate by label
    const uniqueSignals = [...new Map(allSignals.map(s => [s.label, s])).values()];

    return {
      medianPricePerSqm,
      avgDaysOnMarket: data.avgDaysOnMarket,
      listingCount: data.listingCount,
      sentimentSignals: uniqueSignals,
      isSimulated: true, // flag so the UI can indicate this is demo data
    };
  },
};

module.exports = listingService;
