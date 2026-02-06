import "dotenv/config"; // 👈 MUST be first, no function call

import express from "express";
import cors from "cors";
import { router as ticketRoutes } from "./tickets.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/tickets", ticketRoutes);

app.listen(4000, () => {
  console.log("Backend running on http://localhost:4000");
});
