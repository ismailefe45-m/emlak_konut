/**
 * ─── API Routes ───
 * POST /api/valuate — accepts property data, runs enrichment + valuation, returns result
 */

const express = require('express');
const { runPipeline } = require('../pipeline/enrichmentPipeline');
const { computeValuation } = require('../engine/valuationEngine');

const router = express.Router();

// ── Input validation ──
function validateInput(body) {
  const errors = [];
  if (!body.grossSqm || body.grossSqm <= 0) errors.push('Brüt m² gerekli');
  if (!body.netSqm || body.netSqm <= 0) errors.push('Net m² gerekli');
  if (!body.rooms) errors.push('Oda sayısı gerekli');
  if (body.floor == null) errors.push('Bulunduğu kat gerekli');
  if (!body.totalFloors || body.totalFloors <= 0) errors.push('Toplam kat sayısı gerekli');
  if (body.buildingAge == null || body.buildingAge < 0) errors.push('Bina yaşı gerekli');
  if (!body.district) errors.push('İlçe gerekli');
  return errors;
}

/**
 * POST /api/valuate
 * Body: { grossSqm, netSqm, rooms, floor, totalFloors, buildingAge,
 *         facade, hasView, viewType, district, neighborhood, address }
 */
router.post('/valuate', async (req, res) => {
  try {
    const validationErrors = validateInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    // Normalise input
    const propertyData = {
      grossSqm: parseFloat(req.body.grossSqm),
      netSqm: parseFloat(req.body.netSqm),
      rooms: req.body.rooms,
      floor: parseInt(req.body.floor, 10),
      totalFloors: parseInt(req.body.totalFloors, 10),
      buildingAge: parseInt(req.body.buildingAge, 10),
      facade: req.body.facade || 'south',
      hasView: req.body.hasView === true || req.body.hasView === 'true',
      viewType: req.body.viewType || null,
      district: req.body.district,
      neighborhood: req.body.neighborhood || '',
      address: req.body.address || `${req.body.neighborhood || ''}, ${req.body.district}, İstanbul`,
    };

    console.log('\n══════════════════════════════════════');
    console.log('  New valuation request');
    console.log('══════════════════════════════════════');
    console.log(JSON.stringify(propertyData, null, 2));

    // Run enrichment pipeline
    const { enrichedData, errors: enrichmentErrors } = await runPipeline(propertyData);

    // Run valuation engine
    const valuation = computeValuation(enrichedData);

    res.json({
      success: true,
      valuation,
      enrichmentErrors: enrichmentErrors.length > 0 ? enrichmentErrors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    res.status(500).json({
      success: false,
      errors: ['Sunucu hatası: ' + error.message],
    });
  }
});

module.exports = router;
