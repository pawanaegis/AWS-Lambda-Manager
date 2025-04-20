import express from "express";
import lambdaRoutes from "./lambda.js";

const router = express.Router();

router.use("/lambda", lambdaRoutes);

export default router;