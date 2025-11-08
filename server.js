const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let count = 0; // our counter variable

app.get('/', (req, res) => {
  res.render('index', { count });
});

app.get('/add', (req, res) => {
  count++;
  res.json({ people: 'increase', count });
});

app.get('/sub', (req, res) => {
  count--;
  res.json({ people: 'decrease', count });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
