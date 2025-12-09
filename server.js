// server.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory state
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

// ---- Website API ----

// User 1 status
app.get("/user/user1/status", (req, res) => {
  res.json(state.user1);
});

// User 2 status
app.get("/user/user2/status", (req, res) => {
  res.json(state.user2);
});

// Leakage status
app.get("/leakage/status", (req, res) => {
  res.json(state.leakage);
});

// Motor status
app.get("/motor/status", (req, res) => {
  res.json(state.motor);
});

// Motor control (website)
app.post("/motor/control", (req, res) => {
  const { state: newState } = req.body || {};
  if (newState === "ON" || newState === "OFF") {
    state.motor.state = newState;
    return res.json({ state: state.motor.state });
  }
  return res.status(400).json({ error: "Invalid state" });
});

// Reset user1
app.post("/reset/user1", (req, res) => {
  state.user1.litres = 0;
  state.user1.bill = 0;
  res.json({ status: "reset user1" });
});

// Reset user2
app.post("/reset/user2", (req, res) => {
  state.user2.litres = 0;
  state.user2.bill = 0;
  res.json({ status: "reset user2" });
});

// ---- ESP32 API ----
app.post("/esp/update", (req, res) => {
  const body = req.body || {};

  if (body.user1) {
    state.user1.litres = body.user1.litres ?? state.user1.litres;
    state.user1.bill = body.user1.bill ?? state.user1.bill;
    state.user1.turbidity = body.user1.turbidity ?? state.user1.turbidity;
  }

  if (body.user2) {
    state.user2.litres = body.user2.litres ?? state.user2.litres;
    state.user2.bill = body.user2.bill ?? state.user2.bill;
    state.user2.turbidity = body.user2.turbidity ?? state.user2.turbidity;
  }

  if (body.leakage && Array.isArray(body.leakage.points)) {
    state.leakage.points = body.leakage.points;
  }

  if (body.motor && body.motor.state) {
    state.motor.state = body.motor.state;
  }

  res.json({ status: "ok" });
});

// Home
app.get("/", (req, res) => {
  res.send("DGR Water Backend Online");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
