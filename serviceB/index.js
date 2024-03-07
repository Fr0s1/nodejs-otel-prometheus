// Service B - index.js
const otelSDK = require("./instrumentation")
otelSDK.start()

const express = require("express");
const multer  = require('multer');
const path = require('path');
const morgan = require('morgan');

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

// Logging middleware
app.use(morgan('combined'));

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'images/') // Save uploaded images to 'images' directory
  },
  filename: function (req, file, cb) {
      cb(null, file.originalname)
  }
});
const upload = multer({ storage: storage });

// Endpoint to handle image upload
app.post('/images/upload', upload.single('image'), (req, res) => {
  const file = req.file;
  if (!file) {
      res.status(400).send('No file uploaded');
      return;
  }
  res.send('Image uploaded successfully');
});

app.get("/data", (req, res) => {
  const data = {
    message: "This is data from Service B",
  };
  res.json(data);
});

app.get("/status", (req, res) => {
  const status = {
    message: "Service B is up and running",
  };
  res.json(status);
});

app.listen(PORT, () => {
  console.log(`Service B listening at http://localhost:${PORT}`);
});
