const express = require('express');
const app = express();
const port = 8000;

app.get('/', (req, res) => {
  res.send("✅ Server is alive and working!");
});

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});