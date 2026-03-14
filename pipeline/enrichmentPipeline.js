/**
 * ─── Enrichment Pipeline ───
 * Orchestrates all data-enrichment services.
 *
 * Flow:
 *   1. Geocode the address → lat/lng
 *   2. Run all remaining services in parallel (Promise.allSettled)
 *   3. Merge results into a single enrichedData object
 *   4. Return { enrichedData, errors[] }
 *
 * Partial failures are tolerated — the valuation engine receives whatever
 * data is available and adjusts confidence accordingly.
 */

const geocodingService = require('../services/geocodingService');
const listingService   = require('../services/listingService');
const osmService       = require('../services/osmService');
const routeService     = require('../services/routeService');
const afadService      = require('../services/afadService');
const faultService     = require('../services/faultService');
const vs30Service      = require('../services/vs30Service');

// ── All services except geocoding (which runs first) ──
const ENRICHMENT_SERVICES = [
  listingService,
  osmService,
  routeService,
  afadService,
  faultService,
  vs30Service,
];

/**
 * Run the full enrichment pipeline.
 * @param {Object} propertyData - Raw user input from the form
 * @returns {{ enrichedData: Object, errors: Array }}
 */
async function runPipeline(propertyData) {
  const errors = [];

  // ── Step 1: Geocode ──
  console.log('[Pipeline] Step 1 — Geocoding address...');
  const geo = await geocodingService.enrich(propertyData);
  const enrichedInput = {
    ...propertyData,
    lat: geo.lat,
    lng: geo.lng,
    geocoding: geo,
  };

  // ── Step 2: Run all other services in parallel ──
  console.log(`[Pipeline] Step 2 — Running ${ENRICHMENT_SERVICES.length} enrichment services in parallel...`);
  const results = await Promise.allSettled(
    ENRICHMENT_SERVICES.map(service => service.enrich(enrichedInput))
  );

  // ── Step 3: Merge results ──
  const enrichedData = { ...enrichedInput };

  results.forEach((result, index) => {
    const serviceName = ENRICHMENT_SERVICES[index].name;
    if (result.status === 'fulfilled') {
      enrichedData[serviceName] = result.value;
      console.log(`[Pipeline]   ✓ ${serviceName}`);
    } else {
      errors.push({ service: serviceName, error: result.reason?.message || 'Unknown error' });
      enrichedData[serviceName] = null;
      console.error(`[Pipeline]   ✗ ${serviceName}: ${result.reason?.message}`);
    }
  });

  console.log(`[Pipeline] Complete. ${ENRICHMENT_SERVICES.length - errors.length}/${ENRICHMENT_SERVICES.length} services succeeded.`);

  return { enrichedData, errors };
}

module.exports = { runPipeline };
