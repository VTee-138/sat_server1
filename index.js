const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const router = require("./routes/index.js");
const app = express();
const PORT = 4000;

app.set("trust proxy", "127.0.0.1");

app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://test.10sat.edu.vn",
    "https://admin.10sat.edu.vn",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};

// const corsOptions = {
//   origin: "*",
//   // credentials: true,
//   optionSuccessStatus: 200,
// };
app.use(cors(corsOptions));

// Serve static files (images)
app.use("/api/v2/uploads", express.static(path.join(__dirname, "uploads")));

// Connect MongoDB
mongoose.promise = global.Promise;
mongoose.connect(
  "mongodb://root:10sat@100.68.84.62:27017/10satdb?authSource=admin"
);
const connection = mongoose.connection;
connection.once("open", () =>
  console.log("MongoDB --  Kết nối cơ sở dữ liệu thành công!")
);
connection.on("error", (err) => {
  console.log("MongoDB lỗi kết nối. Hãy đảm bảo rằng mongodb đang chạy." + err);
  process.exit();
});

//Configure Route
app.use("/api/v2", router);

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}/api/v2`);
});
