// =====================================================
// server.js — Entry point
// =====================================================
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const apiRoutes = require("./routes/api");
const dashboardRoutes = require("./routes/dashboard");
const templateRoutes = require("./routes/templates");
const plansRoutes = require("./routes/plans");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:5500"], methods: ['GET','POST','OPTIONS','PATCH', 'DELETE', 'PUT'], credentials: true }));
app.use(express.json());

// Routes publiques (pas d'auth nécessaire pour /api/v1/send)
app.use("/auth", authRoutes);
app.use("/api/v1", apiRoutes);

// Routes protégées (nécessitent une session OAuth)
app.use("/dashboard", dashboardRoutes);
app.use("/dashboard/templates", templateRoutes);

app.use("/plans", plansRoutes);

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
