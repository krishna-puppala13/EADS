const express = require('express');
const app = express();

const PORT = 3001;

app.use(express.json());

// Request logging 
app.use((req, res, next) => {
  const rid = req.header('X-Request-Id') || 'no-id';

  console.log(JSON.stringify({
    requestId: rid,
    service: "pricing",
    method: req.method,
    path: req.path
  }));
  next();
});

// Health endpoint 
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Pricing logic
app.post('/price', (req, res) => {
  const { subtotal } = req.body;

  if (!subtotal) {
    return res.status(400).json({ error: 'subtotal required' });
  }

  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return res.json({
    subtotal,
    tax,
    total
  });
});

app.listen(PORT, () => {
  console.log(`pricing-service running on ${PORT}`);
});