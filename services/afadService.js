/**
 * ─── AFAD Service ───
 * Queries the AFAD (Disaster and Emergency Management Authority) WFS layer
 * to determine the seismic hazard zone for the property coordinates.
 *
 * The Turkish seismic hazard map classifies areas into zones based on
 * Peak Ground Acceleration (PGA) values.
 *
 * Interface: async enrich(propertyData) → { seismicZone, peakGroundAcceleration, hazardDescription }
 */

const axios = require('axios');
const config = require('../config');

// ── Zone classification based on PGA (Turkish Building Code 2018) ──
const ZONE_TABLE = [
  { maxPGA: 0.1, zone: 5, desc: 'Çok Düşük Tehlike' },
  { maxPGA: 0.2, zone: 4, desc: 'Düşük Tehlike' },
  { maxPGA: 0.3, zone: 3, desc: 'Orta Tehlike' },
  { maxPGA: 0.4, zone: 2, desc: 'Yüksek Tehlike' },
  { maxPGA: Infinity, zone: 1, desc: 'Çok Yüksek Tehlike' },
];

function classifyZone(pga) {
  for (const entry of ZONE_TABLE) {
    if (pga <= entry.maxPGA) return entry;
  }
  return ZONE_TABLE[ZONE_TABLE.length - 1];
}

// ── Known PGA values for Istanbul districts (TBDY 2018 reference) ──
// These serve as fallback when the WFS query fails.
const ISTANBUL_PGA = {
  'kadıköy': 0.42, 'beşiktaş': 0.41, 'üsküdar': 0.43, 'ataşehir': 0.38,
  'bakırköy': 0.39, 'sarıyer': 0.35, 'beyoğlu': 0.40, 'maltepe': 0.37,
  'pendik': 0.33, 'kartal': 0.35, 'şişli': 0.39, 'fatih': 0.41,
  'beylikdüzü': 0.31, 'esenyurt': 0.30, 'başakşehir': 0.28,
  'çekmeköy': 0.29, 'sultanbeyli': 0.32, 'tuzla': 0.34,
  'zeytinburnu': 0.40, 'bağcılar': 0.35, 'güngören': 0.37,
  'esenler': 0.34, 'bahçelievler': 0.36, 'küçükçekmece': 0.33,
  'avcılar': 0.38, 'büyükçekmece': 0.30, 'silivri': 0.27,
  'çatalca': 0.25, 'arnavutköy': 0.26, 'eyüpsultan': 0.36,
  'kağıthane': 0.38, 'gaziosmanpaşa': 0.35, 'sultangazi': 0.33,
  'bayrampaşa': 0.37, 'beykoz': 0.36, 'adalar': 0.40,
  'sancaktepe': 0.31, 'ümraniye': 0.36, 'şile': 0.24,
};

const afadService = {
  name: 'afad',

  async enrich(propertyData) {
    const { lat, lng, district } = propertyData;

    // Try WFS query first
    if (lat && lng) {
      try {
        const response = await axios.get(config.afad.wfsUrl, {
          params: {
            service: 'WFS',
            version: '2.0.0',
            request: 'GetFeature',
            typeName: 'deprem:zeminsinifi',
            outputFormat: 'application/json',
            CQL_FILTER: `INTERSECTS(geom, POINT(${lng} ${lat}))`,
          },
          timeout: 10000,
        });

        const features = response.data?.features;
        if (features && features.length > 0) {
          const props = features[0].properties;
          const pga = props.pga || props.PGA || 0.35;
          const zone = classifyZone(pga);
          return {
            seismicZone: zone.zone,
            peakGroundAcceleration: pga,
            hazardDescription: zone.desc,
            source: 'AFAD WFS',
          };
        }
      } catch (error) {
        console.warn(`[AFADService] WFS query failed: ${error.message}. Using fallback.`);
      }
    }

    // Fallback: use district-based PGA lookup
    const districtKey = (district || '').toLowerCase().trim();
    const pga = ISTANBUL_PGA[districtKey] || 0.35;
    const zone = classifyZone(pga);

    return {
      seismicZone: zone.zone,
      peakGroundAcceleration: pga,
      hazardDescription: zone.desc,
      source: 'district-lookup',
    };
  },
};

module.exports = afadService;
