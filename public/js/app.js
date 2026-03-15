/**
 * ─── EV360 Frontend ───
 * Form submission, API call, and rich results rendering.
 */

(function () {
  'use strict';

  // ── DOM refs ──
  const form = document.getElementById('valuationForm');
  const submitBtn = document.getElementById('submitBtn');
  const formSection = document.getElementById('formSection');
  const resultsSection = document.getElementById('resultsSection');
  const backBtn = document.getElementById('backBtn');
  const errorToast = document.getElementById('errorToast');
  const errorMsg = document.getElementById('errorMsg');

  // ── Helpers ──
  function formatCurrency(val) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  }

  function formatDist(metres) {
    if (metres == null) return '—';
    if (metres >= 1000) return (metres / 1000).toFixed(1) + ' km';
    return metres + ' m';
  }

  function multToPercent(mult) {
    if (mult == null) return '—';
    const pct = ((mult - 1) * 100).toFixed(1);
    return (pct >= 0 ? '+' : '') + pct + '%';
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorToast.classList.remove('hidden');
    setTimeout(() => errorToast.classList.add('hidden'), 5000);
  }

  // ── Form submit ──
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear previous errors
    form.querySelectorAll('.field.error').forEach(f => f.classList.remove('error'));

    // Collect data
    const data = {
      grossSqm: parseFloat(form.grossSqm.value),
      netSqm: parseFloat(form.netSqm.value),
      rooms: form.rooms.value,
      floor: parseInt(form.floor.value, 10),
      totalFloors: parseInt(form.totalFloors.value, 10),
      buildingAge: parseInt(form.buildingAge.value, 10),
      facade: form.facade.value,
      hasView: form.viewType.value !== '',
      viewType: form.viewType.value || null,
      district: form.district.value.trim(),
      neighborhood: form.neighborhood.value.trim(),
      address: form.address.value.trim(),
    };

    // Basic client-side validation
    let hasErrors = false;
    ['grossSqm', 'netSqm', 'rooms', 'floor', 'totalFloors', 'buildingAge', 'district'].forEach(field => {
      const input = form[field];
      if (!input.value || (input.type === 'number' && isNaN(parseFloat(input.value)))) {
        input.closest('.field').classList.add('error');
        hasErrors = true;
      }
    });
    if (hasErrors) {
      showError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    // Show loading
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const resp = await fetch('/api/valuate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await resp.json();

      if (!result.success) {
        showError(result.errors ? result.errors.join(', ') : 'Bilinmeyen hata');
        return;
      }

      renderResults(result);
    } catch (err) {
      showError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
      console.error(err);
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  // ── Back button ──
  backBtn.addEventListener('click', () => {
    resultsSection.classList.add('hidden');
    formSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ── Render results ──
  function renderResults(result) {
    const v = result.valuation;
    const b = v.breakdown;

    // Show results, hide form
    formSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Estimated value (animated count-up)
    const valueEl = document.getElementById('estimatedValue');
    animateValue(valueEl, 0, v.estimatedValue, 1200);

    // Confidence bar
    document.getElementById('confidenceFill').style.width = v.confidence + '%';
    document.getElementById('confidencePct').textContent = '%' + v.confidence;

    // ── Risk badge ──
    const riskBadge = document.getElementById('riskBadge');
    riskBadge.className = 'risk-badge risk-' + v.riskLevel;

    const riskIcon = document.getElementById('riskIcon');
    const riskTitle = document.getElementById('riskTitle');
    const riskDesc = document.getElementById('riskDesc');

    if (v.riskLevel === 'low') {
      riskIcon.textContent = '🛡️';
      riskTitle.textContent = 'Düşük Risk Bölgesi';
      riskDesc.textContent = 'Bu bölge deprem riski açısından nispeten güvenli. Zemin koşulları kabul edilebilir düzeyde.';
    } else if (v.riskLevel === 'medium') {
      riskIcon.textContent = '⚠️';
      riskTitle.textContent = 'Orta Risk Bölgesi';
      riskDesc.textContent = 'Bu bölge orta düzey deprem riski taşımaktadır. Yapısal güçlendirme önerilir.';
    } else {
      riskIcon.textContent = '🚨';
      riskTitle.textContent = 'Yüksek Risk Bölgesi';
      riskDesc.textContent = 'Bu bölge yüksek deprem riski taşımaktadır. Deprem sigortası ve yapısal değerlendirme önemle önerilir.';
    }

    // ── Risk detail cards ──
    // Seismic
    const seismicVal = document.getElementById('seismicValue');
    const seismicSub = document.getElementById('seismicSub');
    const seismicCard = document.getElementById('seismicCard');
    if (b.seismicZone) {
      seismicVal.textContent = 'Bölge ' + b.seismicZone;
      seismicSub.textContent = b.seismicDescription + ' (PGA: ' + (b.seismicPGA || '—') + ')';
      seismicCard.className = 'risk-card ' + (b.seismicZone <= 2 ? 'danger' : b.seismicZone <= 3 ? 'warning' : 'safe');
    }

    // Fault
    const faultVal = document.getElementById('faultValue');
    const faultSub = document.getElementById('faultSub');
    const faultCard = document.getElementById('faultCard');
    if (b.faultDist != null) {
      faultVal.textContent = b.faultDist + ' km';
      faultSub.textContent = b.faultName || '';
      faultCard.className = 'risk-card ' + (b.faultDist < 5 ? 'danger' : b.faultDist < 15 ? 'warning' : 'safe');
    }

    // Soil
    const soilVal = document.getElementById('soilValue');
    const soilSub = document.getElementById('soilSub');
    const soilCard = document.getElementById('soilCard');
    if (b.soilClass) {
      soilVal.textContent = 'Sınıf ' + b.soilClass;
      soilSub.textContent = b.soilDescription + ' (VS30: ' + (b.vs30Value || '—') + ')';
      soilCard.className = 'risk-card ' + (['D', 'E'].includes(b.soilClass) ? 'danger' : b.soilClass === 'C' ? 'warning' : 'safe');
    }

    // ── Breakdown grid ──
    const breakdownGrid = document.getElementById('breakdownGrid');
    breakdownGrid.innerHTML = '';

    const breakdownItems = [
      { label: 'Baz Fiyat (m²)', value: formatCurrency(b.basePricePerSqm), note: b.basePriceSource },
      { label: 'Baz Değer', value: formatCurrency(b.baseValue), note: 'Net m² × Baz Fiyat' },
      { label: 'Manzara Etkisi', value: multToPercent(b.viewMultiplier), note: b.viewType || 'Yok', cls: b.viewMultiplier > 1 ? 'positive' : 'neutral' },
      { label: 'Kat Avantajı', value: multToPercent(b.floorMultiplier), cls: b.floorMultiplier > 1 ? 'positive' : b.floorMultiplier < 1 ? 'negative' : 'neutral' },
      { label: 'Cephe Yönü', value: multToPercent(b.facadeMultiplier), cls: b.facadeMultiplier > 1 ? 'positive' : b.facadeMultiplier < 1 ? 'negative' : 'neutral' },
      { label: 'Alan Verimliliği', value: '%' + b.areaEfficiencyRatio, note: multToPercent(b.areaEfficiencyMultiplier), cls: b.areaEfficiencyMultiplier > 1 ? 'positive' : b.areaEfficiencyMultiplier < 1 ? 'negative' : 'neutral' },
      { label: 'Ulaşım Etkisi', value: multToPercent(b.transitMultiplier), note: b.nearestStop || '', cls: b.transitMultiplier > 1 ? 'positive' : 'neutral' },
      { label: 'Çevre Tesisleri', value: multToPercent(b.amenityMultiplier), cls: b.amenityMultiplier > 1 ? 'positive' : 'neutral' },
      { label: 'Bina Yaşı Etkisi', value: multToPercent(b.ageMultiplier), cls: 'negative' },
      { label: 'Deprem Bölgesi Etkisi', value: multToPercent(b.seismicMultiplier), cls: b.seismicMultiplier < 0.95 ? 'negative' : 'neutral' },
      { label: 'Fay Hattı Etkisi', value: multToPercent(b.faultMultiplier), cls: b.faultMultiplier < 0.95 ? 'negative' : 'neutral' },
      { label: 'Zemin Etkisi', value: multToPercent(b.soilMultiplier), cls: b.soilMultiplier < 0.95 ? 'negative' : 'neutral' },
    ];

    breakdownItems.forEach(item => {
      const el = document.createElement('div');
      el.className = 'breakdown-item';
      el.innerHTML = `
        <div class="item-label">${item.label}</div>
        <div class="item-value ${item.cls || ''}">${item.value}</div>
        ${item.note ? `<div class="item-note">${item.note}</div>` : ''}
      `;
      breakdownGrid.appendChild(el);
    });

    // ── Listings section ──
    const listingsGrid = document.getElementById('listingsGrid');
    listingsGrid.innerHTML = '';

    const listingItems = [
      { label: 'Medyan m² Fiyatı', value: formatCurrency(b.basePricePerSqm) },
    ];

    // Pull from the enrichedData if available
    if (result.valuation.breakdown.basePriceSource) {
      listingItems.push({ label: 'Veri Kaynağı', value: b.basePriceSource });
    }

    listingItems.forEach(item => {
      const el = document.createElement('div');
      el.className = 'listing-item';
      el.innerHTML = `
        <div class="item-label">${item.label}</div>
        <div class="item-value">${item.value}</div>
      `;
      listingsGrid.appendChild(el);
    });

    // ── Location section ──
    const locationGrid = document.getElementById('locationGrid');
    locationGrid.innerHTML = '';

    const locationItems = [];
    if (b.transitDist != null) {
      locationItems.push({ label: 'Toplu Taşıma', value: formatDist(b.transitDist), note: b.nearestStop });
    }
    if (b.amenities) {
      if (b.amenities.schoolDist != null) locationItems.push({ label: 'En Yakın Okul', value: formatDist(b.amenities.schoolDist) });
      if (b.amenities.hospitalDist != null) locationItems.push({ label: 'En Yakın Hastane', value: formatDist(b.amenities.hospitalDist) });
      if (b.amenities.mallDist != null) locationItems.push({ label: 'En Yakın AVM', value: formatDist(b.amenities.mallDist) });
      if (b.amenities.parkDist != null) locationItems.push({ label: 'En Yakın Park', value: formatDist(b.amenities.parkDist) });
    }
    if (b.faultDist != null) {
      locationItems.push({ label: 'Fay Hattı Mesafesi', value: b.faultDist + ' km', note: b.faultName });
    }

    locationItems.forEach(item => {
      const el = document.createElement('div');
      el.className = 'location-item';
      el.innerHTML = `
        <div class="item-label">${item.label}</div>
        <div class="item-value">${item.value}</div>
        ${item.note ? `<div class="item-note">${item.note}</div>` : ''}
      `;
      locationGrid.appendChild(el);
    });
  }

  // ── Animated count-up ──
  function animateValue(el, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(start + (end - start) * eased);
      el.textContent = formatCurrency(current);
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

})();
