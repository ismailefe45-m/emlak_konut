<div align="center">

# 🏠 EmlakAI — Akıllı Gayrimenkul Değerleme

**Yapay zeka destekli, şeffaf ve kapsamlı gayrimenkul değerleme motoru**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![License: MIT](https://img.shields.io/badge/Lisans-MIT-blue.svg)](LICENSE)

</div>

--- 

## 📖 Proje Hakkında

**EmlakAI**, Türkiye'deki gayrimenkullerin tahmini piyasa değerini hesaplayan, yapay zeka destekli bir web uygulamasıdır. Kullanıcıdan alınan mülk bilgilerini çeşitli dış servislerle zenginleştirerek (konum, deprem riski, fay hattı, zemin sınıfı, çevre analizi vb.) ağırlıklı bir puanlama modeli ile değerleme yapar.

### ✨ Temel Özellikler

- 🏗️ **Modüler Servis Mimarisi** — Her veri kaynağı bağımsız bir servis olarak çalışır, kolayca değiştirilebilir veya genişletilebilir.
- 🌍 **Deprem Risk Analizi** — AFAD sismik tehlike verileri, fay hattı mesafesi ve zemin sınıfı (VS30) analizi.
- 📊 **Şeffaf Değerleme** — Her çarpanın (manzara, kat, cephe, bina yaşı, ulaşım vb.) sonucu nasıl etkilediği detaylı olarak gösterilir.
- 🎯 **Güven Skoru** — Eksik veri kaynaklarını tespit eder ve güvenilirlik yüzdesini buna göre hesaplar.
- 🖥️ **Premium Dark-Mode Arayüz** — Modern, responsive ve animasyonlu kullanıcı arayüzü.
- 🔌 **ML Entegrasyon Noktası** — Değerleme motoru, gelecekte bir makine öğrenmesi modeli ile kolayca değiştirilebilecek şekilde tasarlanmıştır.

---

## 🗂️ Proje Yapısı

```
EmlakAI/
├── server.js                    # Express uygulama giriş noktası
├── package.json                 # Bağımlılıklar ve npm komutları
├── .env                         # Ortam değişkenleri (Git'e eklenmez)
├── .env.example                 # Örnek ortam değişkenleri dosyası
│
├── config/
│   └── index.js                 # Merkezi konfigürasyon (tüm API URL ve key'ler)
│
├── services/                    # Dış servis entegrasyonları
│   ├── geocodingService.js      # Nominatim — Adres → koordinat dönüşümü
│   ├── listingService.js        # Sahibinden — Emsal ilan verileri
│   ├── osmService.js            # Overpass API — Çevre analizi (okul, hastane, AVM, park)
│   ├── routeService.js          # OpenRouteService — Ulaşım & toplu taşıma mesafesi
│   ├── afadService.js           # AFAD WFS — Deprem tehlike haritası
│   ├── faultService.js          # Fay hattı — En yakın fay hattı mesafesi
│   └── vs30Service.js           # USGS VS30 — Zemin sınıfı analizi
│
├── pipeline/
│   └── enrichmentPipeline.js    # Veri zenginleştirme boru hattı (tüm servisleri orkestra eder)
│
├── engine/
│   └── valuationEngine.js       # Ağırlıklı puanlama ile değerleme hesaplama motoru
│
├── routes/
│   └── api.js                   # REST API endpoint'leri
│
├── public/                      # Statik frontend dosyaları
│   ├── index.html               # Ana sayfa (SPA)
│   ├── css/
│   │   └── style.css            # Dark-mode temalı CSS
│   └── js/
│       └── app.js               # Frontend JavaScript mantığı
│
└── data/
    └── faults.geojson           # Türkiye fay hatları (GeoJSON)
```

---

## 🔄 Nasıl Çalışır?

Aşağıdaki diyagram, bir değerleme isteğinin baştan sona nasıl işlendiğini gösterir:

```
  Kullanıcı Formu
       │
       ▼
  POST /api/valuate
       │
       ▼
  ┌─────────────────────────────┐
  │   Enrichment Pipeline       │
  │                             │
  │  1. Geocoding (adres → GPS) │
  │          │                  │
  │          ▼                  │
  │  2. Paralel Servisler:      │
  │     ├─ Listing (emsal ilan) │
  │     ├─ OSM (çevre analizi)  │
  │     ├─ Route (ulaşım)      │
  │     ├─ AFAD (deprem riski)  │
  │     ├─ Fault (fay hattı)   │
  │     └─ VS30 (zemin sınıfı) │
  └─────────────────────────────┘
       │
       ▼
  ┌─────────────────────────────┐
  │   Valuation Engine          │
  │                             │
  │  Baz Fiyat × Çarpanlar =    │
  │  Tahmini Değer + Güven %   │
  └─────────────────────────────┘
       │
       ▼
  JSON Sonuç → Arayüzde Gösterim
```

> **Not:** Herhangi bir servis başarısız olursa, pipeline diğer servislere devam eder ve güven skorunu buna göre düşürür. Kısmi başarısızlıklar tolere edilir.

---

## 🚀 Kurulum

### Gereksinimler

| Araç     | Minimum Versiyon | Açıklama                              |
| -------- | ---------------- | ------------------------------------- |
| Node.js  | 18.0+            | JavaScript çalıştırma ortamı          |
| npm      | 9.0+             | Paket yöneticisi (Node.js ile gelir)  |

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/<kullanıcı-adınız>/EmlakAI.git
cd EmlakAI
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın

```bash
# .env.example dosyasını kopyalayarak .env oluşturun
cp .env.example .env
```

`.env` dosyasını bir metin editörü ile açın ve gerekli API anahtarlarını girin:

```env
# ── Server ──
PORT=3000

# ── OpenRouteService (ulaşım analizi için gerekli) ──
ORS_API_KEY=buraya_api_anahtarinizi_girin

# ── Diğer servisler (varsayılan URL'ler kullanılır, değiştirmek opsiyoneldir) ──
NOMINATIM_BASE_URL=https://nominatim.openstreetmap.org
OVERPASS_BASE_URL=https://overpass-api.de/api/interpreter
AFAD_WFS_URL=https://tdth.afad.gov.tr/geoserver/wfs
USGS_VS30_URL=https://earthquake.usgs.gov/ws/vs30
SAHIBINDEN_BASE_URL=https://www.sahibinden.com
```

#### 🔑 API Anahtarları

| Servis               | API Anahtarı Gerekli? | Nereden Alınır                                                  |
| -------------------- | --------------------- | --------------------------------------------------------------- |
| Nominatim (Geocoding)| ❌ Hayır              | Açık kaynak, ücretsiz                                           |
| Overpass (OSM)       | ❌ Hayır              | Açık kaynak, ücretsiz                                           |
| OpenRouteService     | ✅ Evet               | [openrouteservice.org/sign-up](https://openrouteservice.org/dev/#/signup) |
| AFAD                 | ❌ Hayır              | Kamusal WFS servisi                                             |
| USGS VS30            | ❌ Hayır              | Kamusal REST servisi                                            |

> **Önemli:** OpenRouteService API anahtarı olmadan ulaşım analizi çalışmaz, ancak diğer servisler yine de çalışacaktır.

### 4. Uygulamayı Başlatın

```bash
# Geliştirme modu (otomatik yeniden başlatma ile)
npm run dev

# veya Normal mod
npm start
```

Uygulama başarıyla başladığında terminalde şu çıktıyı göreceksiniz:

```
  ╔══════════════════════════════════════════════╗
  ║   🏠 EmlakAI - Gayrimenkul Değerleme        ║
  ║   Server running on port 3000               ║
  ║   http://localhost:3000                      ║
  ╚══════════════════════════════════════════════╝
```

Tarayıcınızda **http://localhost:3000** adresine giderek uygulamayı kullanmaya başlayabilirsiniz.

---

## 🔌 API Kullanımı

### `POST /api/valuate`

Bir gayrimenkulün değerlemesini gerçekleştirir.

#### İstek Gövdesi (Request Body)

```json
{
  "grossSqm": 120,
  "netSqm": 100,
  "rooms": "3+1",
  "floor": 5,
  "totalFloors": 10,
  "buildingAge": 8,
  "facade": "south",
  "hasView": true,
  "viewType": "sea",
  "district": "Kadıköy",
  "neighborhood": "Caferağa",
  "address": "Moda Caddesi 15, Kadıköy, İstanbul"
}
```

#### Alan Açıklamaları

| Alan            | Tip     | Zorunlu | Açıklama                                                      |
| --------------- | ------- | ------- | ------------------------------------------------------------- |
| `grossSqm`     | number  | ✅      | Brüt metrekare                                                |
| `netSqm`       | number  | ✅      | Net metrekare                                                 |
| `rooms`         | string  | ✅      | Oda sayısı (ör: `"3+1"`, `"2+1"`)                            |
| `floor`         | number  | ✅      | Bulunduğu kat                                                 |
| `totalFloors`   | number  | ✅      | Binanın toplam kat sayısı                                     |
| `buildingAge`   | number  | ✅      | Bina yaşı (yıl)                                              |
| `facade`        | string  | ❌      | Cephe yönü (`south`, `east`, `west`, `north`). Varsayılan: `south` |
| `hasView`       | boolean | ❌      | Manzara var mı? Varsayılan: `false`                           |
| `viewType`      | string  | ❌      | Manzara tipi (`sea`, `city`, `garden`)                        |
| `district`      | string  | ✅      | İlçe adı                                                     |
| `neighborhood`  | string  | ❌      | Mahalle adı                                                   |
| `address`       | string  | ❌      | Tam adres (geocoding için)                                    |

#### Başarılı Yanıt Örneği

```json
{
  "success": true,
  "valuation": {
    "estimatedValue": 7250000,
    "confidence": 75,
    "riskLevel": "medium",
    "breakdown": {
      "basePricePerSqm": 55000,
      "basePriceSource": "Simülasyon Verisi",
      "baseValue": 5500000,
      "viewMultiplier": 1.20,
      "floorMultiplier": 1.10,
      "facadeMultiplier": 1.05,
      "areaEfficiencyMultiplier": 1.03,
      "transitMultiplier": 1.08,
      "amenityMultiplier": 1.06,
      "ageMultiplier": 0.96,
      "seismicMultiplier": 0.90,
      "faultMultiplier": 0.92,
      "soilMultiplier": 0.97
    }
  },
  "timestamp": "2026-03-14T18:30:00.000Z"
}
```

#### cURL Örneği

```bash
curl -X POST http://localhost:3000/api/valuate \
  -H "Content-Type: application/json" \
  -d '{
    "grossSqm": 120,
    "netSqm": 100,
    "rooms": "3+1",
    "floor": 5,
    "totalFloors": 10,
    "buildingAge": 8,
    "district": "Kadıköy"
  }'
```

---

## ⚖️ Değerleme Çarpanları

Motor, baz fiyatı aşağıdaki çarpanlarla düzenleyerek nihai değeri hesaplar:

### 📈 Artıran Çarpanlar

| Çarpan           | Koşul                    | Etki     |
| ---------------- | ------------------------ | -------- |
| Deniz Manzarası  | `viewType = sea`         | **+20%** |
| Şehir Manzarası  | `viewType = city`        | +8%      |
| Bahçe Manzarası  | `viewType = garden`      | +5%      |
| Üst Katlar       | Binanın üst 1/3'ü        | +10%     |
| Güney Cephe      | `facade = south`         | +5%      |
| Yakın Metro      | < 500m yürüme mesafesi   | +8%      |
| AVM Yakınlığı    | < 1km mesafede            | +4%      |
| Verimli Alan     | Net/Brüt oranı > %85     | +3%      |

### 📉 Azaltan Çarpanlar

| Çarpan           | Koşul                    | Etki     |
| ---------------- | ------------------------ | -------- |
| Bina Yaşı        | Yılda -%0.5 (maks %25)   | -%0.5/yıl|
| Deprem Bölgesi 1 | Çok yüksek risk          | **-15%** |
| Fay Hattı < 5km  | Çok yakın                | **-15%** |
| Yumuşak Zemin (E)| VS30 < 180 m/s           | **-13%** |
| Kuzey Cephe      | `facade = north`         | -3%      |

---

## 🛠️ Teknoloji Yığını

| Katman      | Teknoloji                                 | Amaç                               |
| ----------- | ----------------------------------------- | ----------------------------------- |
| **Backend** | [Express.js](https://expressjs.com/)      | REST API sunucusu                   |
| **HTTP**    | [Axios](https://axios-http.com/)          | Dış servis istekleri                |
| **Geo**     | [Turf.js](https://turfjs.org/)            | Coğrafi hesaplamalar (mesafe vb.)   |
| **Scraping**| [Cheerio](https://cheerio.js.org/)        | HTML ayrıştırma (ilan verileri)     |
| **Config**  | [dotenv](https://www.npmjs.com/package/dotenv) | Ortam değişkenleri yönetimi    |
| **Frontend**| Vanilla HTML/CSS/JS                       | Premium dark-mode SPA arayüzü      |

---

## 🤝 Katkıda Bulunma

Katkılarınızı memnuniyetle karşılıyoruz! Katkıda bulunmak için:

1. Bu repoyu **fork** edin.
2. Yeni bir **branch** oluşturun:
   ```bash
   git checkout -b feature/yeni-ozellik
   ```
3. Değişikliklerinizi yapın ve **commit** edin:
   ```bash
   git commit -m "feat: yeni özellik açıklaması"
   ```
4. Branch'inizi **push** edin:
   ```bash
   git push origin feature/yeni-ozellik
   ```
5. Bir **Pull Request** açın.

### 🧩 Yeni Servis Ekleme

Yeni bir veri kaynağı eklemek çok kolaydır:

1. `services/` klasörüne yeni bir servis dosyası ekleyin (ör: `newDataService.js`).
2. Servisinizin bir `enrich(propertyData)` fonksiyonu ve `name` özelliği export ettiğinden emin olun:
   ```js
   const name = 'newData';
   async function enrich(propertyData) {
     // Dış API çağrısı yapın, veriyi döndürün
     return { /* zenginleştirilmiş veri */ };
   }
   module.exports = { name, enrich };
   ```
3. `pipeline/enrichmentPipeline.js` dosyasındaki `ENRICHMENT_SERVICES` dizisine servisinizi ekleyin.
4. Gerekirse `engine/valuationEngine.js` dosyasında yeni bir çarpan tanımlayın.

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır — detaylar için `LICENSE` dosyasına bakabilirsiniz.

---

<div align="center">

**EmlakAI** ile akıllı gayrimenkul değerlemesi yapın 🏠✨

</div>
