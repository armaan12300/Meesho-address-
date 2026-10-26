import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (_req, res) => {
  return res.json({
    status: 'ok',
    service: 'Meesho Address Manager & Mini App',
    timestamp: new Date().toISOString(),
  });
});

// Sample Address Template Endpoint
app.get('/api/addresses/sample', (_req, res) => {
  return res.json({
    success: true,
    note: 'Sample simulated address records for testing validation and formatting.',
    addresses: [
      {
        name: 'Amit Sharma',
        phone: '+91 6221468377',
        house: '50, Radha Duplex',
        road: 'Vijayanagar, Gandhi Chowk',
        city: 'Mysuru',
        state: 'Karnataka',
        pincode: '570008',
        isDemo: true,
      },
      {
        name: 'Pooja Verma',
        phone: '+91 9876543210',
        house: 'Flat 304, Green Palms',
        road: 'Ring Road Sector 4',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        isDemo: true,
      },
      {
        name: 'Rahul Kumar',
        phone: '+91 9876543210',
        house: 'House 12',
        road: 'Station Road',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        isDemo: true,
      },
      {
        name: 'Incomplete Entry',
        phone: '+91 9123456789',
        house: 'Shop 4',
        road: 'Main Bazaar',
        city: '',
        state: 'Rajasthan',
        pincode: '99',
        isDemo: true,
      },
    ],
  });
});

// Safe Address Validation & Deduplication Endpoint
app.post('/api/addresses/parse-and-validate', (req, res) => {
  try {
    const rawList = Array.isArray(req.body.addresses)
      ? req.body.addresses
      : Array.isArray(req.body)
      ? req.body
      : [];

    if (rawList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No address records provided in payload.',
      });
    }

    const phoneMap = new Map<string, number>();
    let validCount = 0;
    let duplicateCount = 0;

    const validated = rawList.map((raw: any, index: number) => {
      const idx = index + 1;
      const name = String(raw.name || raw.recipient_name || raw.fullName || '').trim();
      const phone = String(raw.phone || raw.mobile || raw.number || raw.contact_number || '').trim();
      const house = String(raw.house || raw.house_no || raw.address || raw.building || '').trim();
      const road = String(raw.road || raw.road_name || raw.colony || raw.area || raw.street || '').trim();
      const city = String(raw.city || raw.town || '').trim();
      const state = String(raw.state || raw.region || '').trim();
      const pincode = String(raw.pincode || raw.pin || raw.postal_code || '').trim();

      const missing: string[] = [];
      if (!name) missing.push('name');
      if (!phone) missing.push('phone');
      if (!house && !road) missing.push('address_or_street');
      if (!city) missing.push('city');
      if (!pincode) missing.push('pincode');

      const pincodeDigits = pincode.replace(/\D/g, '');
      if (pincode && pincodeDigits.length !== 6) {
        missing.push('pincode_must_be_6_digits');
      }

      const isValid = missing.length === 0;

      // Duplicate check
      let isDuplicate = false;
      let duplicateReason = '';
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length >= 10) {
        const last10 = cleanPhone.slice(-10);
        if (phoneMap.has(last10)) {
          isDuplicate = true;
          duplicateCount++;
          duplicateReason = `Duplicate phone number with Record #${phoneMap.get(last10)}`;
        } else {
          phoneMap.set(last10, idx);
        }
      }

      if (isValid && !isDuplicate) {
        validCount++;
      }

      return {
        id: `rec_${idx}_${Date.now()}`,
        index: idx,
        name,
        phone,
        house,
        road,
        city,
        state,
        pincode,
        isValid,
        missingFields: missing,
        isDuplicate,
        duplicateReason,
        isDemo: Boolean(raw.isDemo),
      };
    });

    return res.json({
      success: true,
      totalCount: validated.length,
      validCount,
      duplicateCount,
      invalidCount: validated.length - validCount - duplicateCount,
      records: validated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Mount Vite or static files
async function startServer() {
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'))) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Meesho Address Manager server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
