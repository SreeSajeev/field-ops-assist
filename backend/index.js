import dotenv from "dotenv";
dotenv.config(); // 👈 MUST BE FIRST LINE

import express from "express";
import cors from "cors";
import { router as ticketRoutes } from "./tickets.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/tickets", ticketRoutes);

// health check (important for Render)
app.get("/", (_, res) => {
  res.send("Field Ops Assist Backend is running");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
