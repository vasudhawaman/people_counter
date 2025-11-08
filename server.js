const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

let count = 0;
let clients = []; // all connected clients for live updates

// Main page
app.get("/", (req, res) => {
  res.render("index", { count });
});

// SSE endpoint — keeps a live connection open
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // send initial count immediately
  res.write(`data: ${JSON.stringify({ count })}\n\n`);

  clients.push(res);

  req.on("close", () => {
    clients = clients.filter(c => c !== res);
  });
});

// Function to notify all clients
function broadcastCount() {
  for (const client of clients) {
    client.write(`data: ${JSON.stringify({ count })}\n\n`);
  }
}

// Routes that change count
app.get("/add", (req, res) => {
  count++;
  broadcastCount();
  res.json({ people: "increase", count });
});

app.get("/sub", (req, res) => {
  count--;
  broadcastCount();
  res.json({ people: "decrease", count });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
