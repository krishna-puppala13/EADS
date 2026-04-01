const express = require('express');
const app = express();

const PORT = 3002;

app.use(express.json());

// Request logging (for tracing later)
app.use((req, res, next) => {
  const rid = req.header('X-Request-Id') || 'no-id';
  console.log(`[rid=${rid}] ${req.method} ${req.path}`);
  next();
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Simple inventory check
app.get('/stock/:sku', (req, res) => {
  const sku = Number(req.params.sku);

  // fake stock logic
  if (sku === 1) {
    return res.json({ sku, inStock: true, quantity: 10 });
  }

  return res.json({ sku, inStock: false, quantity: 0 });
});

app.listen(PORT, () => {
  console.log(`inventory-service running on ${PORT}`);
});