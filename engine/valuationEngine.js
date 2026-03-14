/**
 * ─── Valuation Engine ───
 * Computes an estimated property value from enriched data using a
 * transparent weighted scoring model.
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  ML INTEGRATION POINT                                          ║
 * ║  Replace the `computeValuation()` function body with an ML     ║
 * ║  model inference call. The input (enrichedData) and output      ║
 * ║  shape ({ estimatedValue, confidence, riskLevel, breakdown })  ║
 * ║  should stay the same so no other file needs to change.        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Interface: computeValuation(enrichedData) → { estimatedValue, confidence, riskLevel, breakdown }
 */

// ═══════════════════════════════════════════════════════════════
// WEIGHTS — Replace these with ML model outputs when ready
// ═══════════════════════════════════════════════════════════════

const WEIGHTS = {
  // ── Positive adjustments (multipliers > 1 increase value) ──
  view: {
    sea:    1.20,   // +20% for sea view
    city:   1.08,   // +8% for city view
    garden: 1.05,   // +5% for garden view
    none:   1.00,
  },

  // Floor advantage: higher floors = premium (up to a point)
  floorBonus: {
    high:   1.10,   // top third of building
    mid:    1.05,   // middle third
    low:    1.00,   // bottom third
    ground: 0.95,   // ground floor slight discount
  },

  // Facade direction preference
  facade: {
    south: 1.05,
    east:  1.03,
    west:  1.01,
    north: 0.97,
  },

  // Transit proximity (walking distance in metres)
  transitProximity: {
    under500m:  1.08,
    under1000m: 1.04,
    under2000m: 1.01,
    far:        0.97,
  },

  // Amenity proximity bonuses (distance in metres)
  amenityBonus: {
    schoolNear:   1.03,   // school within 500m
    hospitalNear: 1.02,   // hospital within 1km
    mallNear:     1.04,   // mall within 1km
    parkNear:     1.03,   // park within 300m
  },

  // ── Negative adjustments (risk multipliers < 1 decrease value) ──
  buildingAge: {
    perYear: 0.005,       // -0.5% per year of age (max ~25% reduction)
    maxReduction: 0.25,
  },

  // Seismic zone risk multiplier
  seismicZone: {
    1: 0.85,  // Zone 1: very high risk → -15%
    2: 0.90,  // Zone 2: high risk → -10%
    3: 0.95,  // Zone 3: moderate → -5%
    4: 0.98,  // Zone 4: low → -2%
    5: 1.00,  // Zone 5: very low → no change
  },

  // Fault distance risk multiplier (km)
  faultDistance: {
    under5km:  0.85,
    under15km: 0.92,
    under30km: 0.96,
    over30km:  1.00,
  },

  // VS30 / soil class multiplier
  soilClass: {
    A: 1.00,   // hard rock — no adjustment
    B: 0.99,   // rock — minimal
    C: 0.97,   // dense soil
    D: 0.93,   // stiff soil — noticeable
    E: 0.87,   // soft soil — significant
  },

  // Gross/net ratio efficiency
  areaEfficiency: {
    above85: 1.03,   // >85% net/gross = efficient
    above75: 1.00,   // normal
    below75: 0.96,   // <75% = wasteful layout
  },
};

// ═══════════════════════════════════════════════════════════════
// VALUATION LOGIC
// ═══════════════════════════════════════════════════════════════

function computeValuation(enrichedData) {
  const breakdown = {};
  let confidence = 100;

  // ── 1. Base price from comparable listings ──
  const listings = enrichedData.listings;
  let basePricePerSqm;
  if (listings && listings.medianPricePerSqm) {
    basePricePerSqm = listings.medianPricePerSqm;
    breakdown.basePriceSource = listings.isSimulated ? 'Simülasyon Verisi' : 'Piyasa Verisi';
    if (listings.isSimulated) confidence -= 15;
  } else {
    basePricePerSqm = 50000; // absolute fallback ₺/m²
    breakdown.basePriceSource = 'Varsayılan';
    confidence -= 30;
  }
  breakdown.basePricePerSqm = basePricePerSqm;

  const netSqm = enrichedData.netSqm || enrichedData.grossSqm || 100;
  let estimatedValue = basePricePerSqm * netSqm;
  breakdown.baseValue = estimatedValue;

  // ── 2. View multiplier ──
  const viewType = enrichedData.hasView ? (enrichedData.viewType || 'city') : 'none';
  const viewMult = WEIGHTS.view[viewType] || 1.0;
  estimatedValue *= viewMult;
  breakdown.viewMultiplier = viewMult;
  breakdown.viewType = viewType;

  // ── 3. Floor advantage ──
  const floor = enrichedData.floor || 1;
  const totalFloors = enrichedData.totalFloors || 5;
  let floorMult;
  if (floor <= 0 || floor === 1) {
    floorMult = WEIGHTS.floorBonus.ground;
  } else if (floor / totalFloors > 0.66) {
    floorMult = WEIGHTS.floorBonus.high;
  } else if (floor / totalFloors > 0.33) {
    floorMult = WEIGHTS.floorBonus.mid;
  } else {
    floorMult = WEIGHTS.floorBonus.low;
  }
  estimatedValue *= floorMult;
  breakdown.floorMultiplier = floorMult;

  // ── 4. Facade ──
  const facadeKey = (enrichedData.facade || 'south').toLowerCase();
  const facadeMult = WEIGHTS.facade[facadeKey] || 1.0;
  estimatedValue *= facadeMult;
  breakdown.facadeMultiplier = facadeMult;

  // ── 5. Area efficiency (net/gross ratio) ──
  const grossSqm = enrichedData.grossSqm || netSqm;
  const efficiency = netSqm / grossSqm;
  let effMult;
  if (efficiency > 0.85) effMult = WEIGHTS.areaEfficiency.above85;
  else if (efficiency > 0.75) effMult = WEIGHTS.areaEfficiency.above75;
  else effMult = WEIGHTS.areaEfficiency.below75;
  estimatedValue *= effMult;
  breakdown.areaEfficiencyMultiplier = effMult;
  breakdown.areaEfficiencyRatio = Math.round(efficiency * 100);

  // ── 6. Transit proximity ──
  const route = enrichedData.route;
  if (route && route.transitWalkingDist != null) {
    let transitMult;
    if (route.transitWalkingDist < 500) transitMult = WEIGHTS.transitProximity.under500m;
    else if (route.transitWalkingDist < 1000) transitMult = WEIGHTS.transitProximity.under1000m;
    else if (route.transitWalkingDist < 2000) transitMult = WEIGHTS.transitProximity.under2000m;
    else transitMult = WEIGHTS.transitProximity.far;
    estimatedValue *= transitMult;
    breakdown.transitMultiplier = transitMult;
    breakdown.transitDist = route.transitWalkingDist;
    breakdown.nearestStop = route.nearestStopName;
  } else {
    confidence -= 5;
    breakdown.transitMultiplier = 1.0;
  }

  // ── 7. Amenity proximity bonuses ──
  const osm = enrichedData.osm;
  let amenityMult = 1.0;
  if (osm) {
    if (osm.schoolDist != null && osm.schoolDist < 500) amenityMult *= WEIGHTS.amenityBonus.schoolNear;
    if (osm.hospitalDist != null && osm.hospitalDist < 1000) amenityMult *= WEIGHTS.amenityBonus.hospitalNear;
    if (osm.mallDist != null && osm.mallDist < 1000) amenityMult *= WEIGHTS.amenityBonus.mallNear;
    if (osm.parkDist != null && osm.parkDist < 300) amenityMult *= WEIGHTS.amenityBonus.parkNear;
    breakdown.amenities = {
      schoolDist: osm.schoolDist,
      hospitalDist: osm.hospitalDist,
      mallDist: osm.mallDist,
      parkDist: osm.parkDist,
    };
  } else {
    confidence -= 5;
  }
  estimatedValue *= amenityMult;
  breakdown.amenityMultiplier = Math.round(amenityMult * 1000) / 1000;

  // ── 8. Building age reduction ──
  const age = enrichedData.buildingAge || 0;
  const ageReduction = Math.min(age * WEIGHTS.buildingAge.perYear, WEIGHTS.buildingAge.maxReduction);
  const ageMult = 1 - ageReduction;
  estimatedValue *= ageMult;
  breakdown.ageMultiplier = Math.round(ageMult * 1000) / 1000;

  // ── 9. Seismic zone risk ──
  const afad = enrichedData.afad;
  let seismicMult = 1.0;
  if (afad && afad.seismicZone) {
    seismicMult = WEIGHTS.seismicZone[afad.seismicZone] || 1.0;
    breakdown.seismicZone = afad.seismicZone;
    breakdown.seismicPGA = afad.peakGroundAcceleration;
    breakdown.seismicDescription = afad.hazardDescription;
  } else {
    confidence -= 5;
  }
  estimatedValue *= seismicMult;
  breakdown.seismicMultiplier = seismicMult;

  // ── 10. Fault distance risk ──
  const fault = enrichedData.fault;
  let faultMult = 1.0;
  if (fault && fault.nearestFaultDist != null) {
    if (fault.nearestFaultDist < 5) faultMult = WEIGHTS.faultDistance.under5km;
    else if (fault.nearestFaultDist < 15) faultMult = WEIGHTS.faultDistance.under15km;
    else if (fault.nearestFaultDist < 30) faultMult = WEIGHTS.faultDistance.under30km;
    else faultMult = WEIGHTS.faultDistance.over30km;
    breakdown.faultDist = fault.nearestFaultDist;
    breakdown.faultName = fault.faultName;
  } else {
    confidence -= 5;
  }
  estimatedValue *= faultMult;
  breakdown.faultMultiplier = faultMult;

  // ── 11. Soil class (VS30) risk ──
  const vs30 = enrichedData.vs30;
  let soilMult = 1.0;
  if (vs30 && vs30.soilClass) {
    soilMult = WEIGHTS.soilClass[vs30.soilClass] || 1.0;
    breakdown.vs30Value = vs30.vs30Value;
    breakdown.soilClass = vs30.soilClass;
    breakdown.soilDescription = vs30.soilDescription;
    breakdown.amplificationRisk = vs30.amplificationRisk;
  } else {
    confidence -= 5;
  }
  estimatedValue *= soilMult;
  breakdown.soilMultiplier = soilMult;

  // ── 12. Compute overall risk level ──
  const riskScore = (1 - seismicMult) + (1 - faultMult) + (1 - soilMult);
  let riskLevel;
  if (riskScore > 0.25) riskLevel = 'high';
  else if (riskScore > 0.10) riskLevel = 'medium';
  else riskLevel = 'low';
  breakdown.riskScore = Math.round(riskScore * 100) / 100;

  // Clamp confidence
  confidence = Math.max(10, Math.min(100, confidence));

  return {
    estimatedValue: Math.round(estimatedValue),
    confidence,
    riskLevel,
    breakdown,
  };
}

module.exports = { computeValuation };
