const express = require("express");
const cors = require("cors");
const searchRouter = require("./routes/search");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/search", searchRouter);
app.get("/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Zeerostock API running on http://localhost:${PORT}`);
});
