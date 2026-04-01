const express = require('express');
const app = express();

const PORT = 3003;

app.use(express.json());

// Request logging (for tracing)
app.use((req, res, next) => {
  const rid = req.header('X-Request-Id') || 'no-id';
  console.log(`[rid=${rid}] ${req.method} ${req.path}`);
  next();
});

const PRICING_URL = 'http://pricing-svc';
const INVENTORY_URL = 'http://inventory-svc';

const TIMEOUT_MS = 2000;

// Helper: fetch with timeout
async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });

    return res;
  } catch (err) {
    console.error('Request failed:', err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Checkout endpoint
app.post('/checkout', async (req, res) => {
  const { sku, subtotal } = req.body;

  const requestId = req.header('X-Request-Id') || 'no-id';

  if (!sku || !subtotal) {
    return res.status(400).json({ error: 'sku and subtotal required' });
  }

  // 1️⃣ Check inventory (WITH HEADER)
  const invRes = await fetchWithTimeout(
    `${INVENTORY_URL}/stock/${sku}`,
    {
      headers: {
        'X-Request-Id': requestId
      }
    }
  );

  if (!invRes || !invRes.ok) {
    return res.status(503).json({
      error: 'Inventory service unavailable'
    });
  }

  const inventory = await invRes.json();

  if (!inventory.inStock) {
    return res.status(400).json({
      error: 'Item out of stock'
    });
  }

  // 2️⃣ Get pricing (WITH HEADER)
  const priceRes = await fetchWithTimeout(
    `${PRICING_URL}/price`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': requestId
      },
      body: JSON.stringify({ subtotal })
    }
  );

  if (!priceRes || !priceRes.ok) {
    return res.status(503).json({
      error: 'Pricing service unavailable'
    });
  }

  const pricing = await priceRes.json();

  // 3️⃣ Success response
  return res.json({
    sku,
    ...pricing,
    message: 'Checkout successful'
  });
});

app.listen(PORT, () => {
  console.log(`checkout-service running on ${PORT}`);
});