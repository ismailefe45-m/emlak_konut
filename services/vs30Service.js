/**
 * ─── VS30 Service ───
 * Queries the USGS Global VS30 raster to get the shear-wave velocity at
 * the top 30m of soil at the property coordinates.
 *
 * VS30 is a standard measure of ground amplification:
 *   - Higher VS30 = harder rock = less amplification = safer
 *   - Lower VS30  = softer soil  = more amplification = riskier
 *
 * Soil Class (NEHRP):
 *   A: VS30 > 1500  (Hard rock)
 *   B: 760–1500     (Rock)
 *   C: 360–760      (Dense soil)
 *   D: 180–360      (Stiff soil)
 *   E: < 180        (Soft soil)
 *
 * Interface: async enrich(propertyData) → { vs30Value, soilClass, soilDescription, amplificationRisk }
 */

const axios = require('axios');
const config = require('../config');

const SOIL_CLASSES = [
  { maxVs30: 180,  cls: 'E', desc: 'Yumuşak Zemin',    risk: 'Çok Yüksek' },
  { maxVs30: 360,  cls: 'D', desc: 'Sert Zemin',        risk: 'Yüksek' },
  { maxVs30: 760,  cls: 'C', desc: 'Yoğun Zemin',       risk: 'Orta' },
  { maxVs30: 1500, cls: 'B', desc: 'Kaya',              risk: 'Düşük' },
  { maxVs30: Infinity, cls: 'A', desc: 'Sert Kaya',     risk: 'Çok Düşük' },
];

function classifySoil(vs30) {
  for (const entry of SOIL_CLASSES) {
    if (vs30 <= entry.maxVs30) return entry;
  }
  return SOIL_CLASSES[SOIL_CLASSES.length - 1];
}

// ── Approximate VS30 by district (Istanbul geological surveys) ──
const ISTANBUL_VS30 = {
  'kadıköy': 310, 'beşiktaş': 420, 'üsküdar': 350, 'ataşehir': 380,
  'bakırköy': 250, 'sarıyer': 480, 'beyoğlu': 400, 'maltepe': 340,
  'pendik': 360, 'kartal': 370, 'şişli': 430, 'fatih': 280,
  'beylikdüzü': 290, 'esenyurt': 220, 'başakşehir': 350,
  'avcılar': 190, 'zeytinburnu': 260, 'küçükçekmece': 240,
  'büyükçekmece': 300, 'sultanbeyli': 340, 'tuzla': 380,
  'çekmeköy': 400, 'sancaktepe': 370, 'ümraniye': 390,
};

const vs30Service = {
  name: 'vs30',

  async enrich(propertyData) {
    const { lat, lng, district } = propertyData;

    // Try USGS raster query first
    if (lat && lng) {
      try {
        const response = await axios.get(config.usgs.vs30Url, {
          params: { latitude: lat, longitude: lng },
          timeout: 10000,
        });

        const vs30 = response.data?.vs30;
        if (vs30 && vs30 > 0) {
          const soil = classifySoil(vs30);
          return {
            vs30Value: Math.round(vs30),
            soilClass: soil.cls,
            soilDescription: soil.desc,
            amplificationRisk: soil.risk,
            source: 'USGS',
          };
        }
      } catch (error) {
        console.warn(`[VS30Service] USGS query failed: ${error.message}. Using fallback.`);
      }
    }

    // Fallback: district-based VS30 lookup
    const districtKey = (district || '').toLowerCase().trim();
    const vs30 = ISTANBUL_VS30[districtKey] || 320;
    const soil = classifySoil(vs30);

    return {
      vs30Value: vs30,
      soilClass: soil.cls,
      soilDescription: soil.desc,
      amplificationRisk: soil.risk,
      source: 'district-lookup',
    };
  },
};

module.exports = vs30Service;
