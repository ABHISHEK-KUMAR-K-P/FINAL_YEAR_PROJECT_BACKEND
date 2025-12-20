// server.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let state = {
  user1: { litres: 0, bill: 0, turbidity: 0 },
  user2: { litres: 0, bill: 0, turbidity: 0 },
  leakage: {
    points: [
      { id: "P1", coords: "12.340,77.560", leak: false, loss_litres: 0 },
      { id: "P2", coords: "12.341,77.562", leak: false, loss_litres: 0 }
    ]
  },
  motor: { state: "OFF" }
};

/* ===== MONTHLY LOG STORAGE ===== */
let monthlyLogs = []; // safe in-memory storage

/* ===== EXISTING GET ROUTES (UNCHANGED) ===== */
app.get("/user/user1/status", (req, res) => res.json(state.user1));
app.get("/user/user2/status", (req, res) => res.json(state.user2));
app.get("/leakage/status", (req, res) => res.json(state.leakage));
app.get("/motor/status", (req, res) => res.json(state.motor));

/* ===== EXISTING MOTOR CONTROL (UNCHANGED) ===== */
app.post("/motor/control", (req, res) => {
  const { state: newState } = req.body;
  if (newState === "ON" || newState === "OFF") {
    state.motor.state = newState;
    return res.json({ state: newState });
  }
  res.status(400).json({ error: "Invalid state" });
});

/* ===== ESP UPDATE (UNCHANGED) ===== */
app.post("/esp/update", (req, res) => {
  const body = req.body || {};

  if (body.user1) state.user1 = body.user1;
  if (body.user2) state.user2 = body.user2;
  if (body.leakage && Array.isArray(body.leakage.points)) {
    state.leakage.points = body.leakage.points;
  }

  res.json({ status: "ok" });
});

/* ===== ✅ NEW: AUTO LOGGING EVERY 10 SECONDS ===== */
setInterval(() => {
  const litres = state.user1.litres;
  const bill = state.user1.bill;

  // skip useless logs
  if (litres === 0 && bill === 0) return;

  const now = new Date();

  monthlyLogs.push({
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    litres: litres,
    bill: bill,
    timestamp: now.toISOString()
  });

  // keep last ~2 years (10s interval ≈ 6 logs/min → ~52k/year)
  if (monthlyLogs.length > 110000) {
    monthlyLogs.shift();
  }

  console.log("LOGGED (10s):", litres, bill);
}, 10000);

/* ===== LOGS API (UNCHANGED) ===== */
app.get("/logs", (req, res) => {
  res.json(monthlyLogs);
});

/* ===== ROOT ===== */
app.get("/", (req, res) => res.send("DGR Water Backend Online"));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
