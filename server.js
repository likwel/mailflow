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
const contactRoutes = require("./routes/contacts"); 
const contactListsRoutes = require("./routes/contactLists");

const automationRoutes = require("./routes/automations");

const { startScheduledWorkflows } = require('./scheduler/workerschedule');
const { runWorkflow } = require('./routes/automations');

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ["http://localhost:3000","http://localhost:3001", "http://localhost:5500"], methods: ['GET','POST','OPTIONS','PATCH', 'DELETE', 'PUT'], credentials: true }));
app.use(express.json());

// Routes publiques (pas d'auth nécessaire pour /api/v1/send)
app.use("/auth", authRoutes);
app.use("/api/v1", apiRoutes);

// Routes protégées (nécessitent une session OAuth)
app.use("/dashboard", dashboardRoutes);
app.use("/dashboard/templates", templateRoutes);

app.use("/plans", plansRoutes);
app.use("/contacts", contactRoutes);

app.use("/contact-lists", contactListsRoutes);

app.use("/automations", automationRoutes);

app.listen(PORT, async () => {
    await startScheduledWorkflows(prisma, runWorkflow);
        console.log(`✅ Server running on port ${PORT}`)
    }
);
