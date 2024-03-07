// Service A - index.js
const otelSDK = require("./instrumentation");
otelSDK.start();
const promMid = require("express-prometheus-middleware");
const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");
const fs = require("fs");
const morgan = require("morgan");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const SERVICE_B_URL = process.env.SERVICE_B_URL || "http://localhost:4000";

app.use(
  promMid({
    metricsPath: "/metrics",
    collectDefaultMetrics: true,
    requestDurationBuckets: [0.1, 0.5, 1, 1.5],
    requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
    responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
    customLabels: ["service"],
    transformLabels(labels, req) {
      // eslint-disable-next-line no-param-reassign
      labels.service = "express-prometheus";
    },
  })
);
// Logging middleware
app.use(morgan("combined"));

// Multer configuration for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Save uploaded files to 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

// Endpoint to upload image to Service B
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).send("No file uploaded");
      return;
    }

    // Create form data
    const formData = new FormData();
    formData.append("image", fs.createReadStream(file.path), {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    // Send image to Service B
    const response = await axios.post(
      `${SERVICE_B_URL}/images/upload`,
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    // Delete uploaded file after sending
    fs.unlinkSync(file.path);

    res.send(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/data", async (req, res) => {
  console.log("data endpoint");
  try {
    const response = await axios.get(`${SERVICE_B_URL}/data`);
    res.send(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get("/info", (req, res) => {
  const info = {
    message: "This is information from Service A",
  };
  res.json(info);
});

app.get("/metrics", (req, res) => {
  res.set("Content-Type", prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});

app.listen(PORT, () => {
  console.log(`Service A listening at http://localhost:${PORT}`);
});
