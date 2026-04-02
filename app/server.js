const express = require('express');
const client = require('prom-client');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Enable Prometheus metrics collection
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

// 1. Required GET Endpoint
app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'System is running smoothly',
    uptime: process.uptime()
  });
});

// 2. Required POST Endpoint
app.post('/data', (req, res) => {
  const payload = req.body;
  res.status(201).json({
    message: 'Data received successfully',
    receivedData: payload
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});