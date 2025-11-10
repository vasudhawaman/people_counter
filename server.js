const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// --- Two chairs with counts and occupancy ---
let chairs = [
  { id: 1, count: 0, occupied: false },
  { id: 2, count: 0, occupied: false }
];

let clients = []; // SSE connections

// Helper to get total count
function getTotal() {
  return chairs.reduce((sum, c) => sum + c.count, 0);
}

// Home page
app.get("/", (req, res) => {
  res.render("index", { cells: chairs, total: getTotal() });
});

// SSE endpoint
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Send initial state immediately
  res.write(`data: ${JSON.stringify({ total: getTotal(), cells: chairs })}\n\n`);

  clients.push(res);
  req.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
});

// Broadcast helper
function broadcastUpdate() {
  const payload = JSON.stringify({ total: getTotal(), cells: chairs });
  for (const client of clients) {
    client.write(`data: ${payload}\n\n`);
  }
}

// Add person to chair
app.get("/add/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const chair = chairs.find(c => c.id === id);
  if (chair) {
    chair.count++;
    chair.occupied = true;
    broadcastUpdate();
    res.json({ success: true, message: `Chair ${id} +1`, chair, total: getTotal() });
  } else {
    res.status(404).json({ error: "Chair not found" });
  }
});

// Subtract person from chair
app.get("/sub/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const chair = chairs.find(c => c.id === id);
  if (chair) {
    chair.count--;
    chair.count = Math.max(0, chair.count);
    chair.occupied = chair.count > 0;
    broadcastUpdate();
    res.json({ success: true, message: `Chair ${id} -1`, chair, total: getTotal() });
  } else {
    res.status(404).json({ error: "Chair not found" });
  }
});

// Optional: reset all chairs
app.get("/reset", (req, res) => {
  chairs.forEach(c => {
    c.count = 0;
    c.occupied = false;
  });
  broadcastUpdate();
  res.json({ message: "All chairs reset", chairs, total: getTotal() });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
