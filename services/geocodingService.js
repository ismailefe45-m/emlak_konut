/**
 * ─── Geocoding Service ───
 * Converts a full text address into latitude/longitude coordinates.
 * Uses OpenStreetMap Nominatim (free, no API key required).
 *
 * Interface: async enrich(propertyData) → { lat, lng, displayName }
 */

const axios = require('axios');
const config = require('../config');

const geocodingService = {
  name: 'geocoding',

  async enrich(propertyData) {
    const { address, district, neighborhood } = propertyData;
    const query = address || `${neighborhood}, ${district}, İstanbul, Turkey`;

    try {
      const response = await axios.get(`${config.nominatim.baseUrl}/search`, {
        params: {
          q: query,
          format: 'json',
          limit: 1,
          'accept-language': 'tr',
        },
        headers: {
          'User-Agent': 'EmlakAI/1.0 (real-estate-valuation)',
        },
        timeout: 10000,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error(`Geocoding returned no results for: ${query}`);
      }

      const result = response.data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        displayName: result.display_name,
      };
    } catch (error) {
      console.error(`[GeocodingService] Error: ${error.message}`);
      // Fallback: central İstanbul coordinates for demo purposes
      return {
        lat: 41.0082,
        lng: 28.9784,
        displayName: 'İstanbul, Turkey (fallback)',
        isFallback: true,
      };
    }
  },
};

module.exports = geocodingService;
