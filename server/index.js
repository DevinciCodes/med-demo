// server/index.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const providerRoutes = require("./routes/provider"); // <-- import the route (CommonJS)
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");


const app = express();

app.use(cors());
app.use(express.json());

// Mount routes
app.use("/api/provider", providerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/public", publicRoutes);

// Health check
app.get("/health", (_req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
