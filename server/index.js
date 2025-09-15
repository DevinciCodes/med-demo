const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'med-demo', time: new Date().toISOString() });
});

app.get('/api/message', (req, res) => {
  res.json({ message: 'Hello from the server!' });
});

// helpful 404 to confirm what path you’re actually hitting
app.use((req, res) => {
  res.status(404).json({ error: 'not found', path: req.url });
});

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
