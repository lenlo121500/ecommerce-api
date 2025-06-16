import express from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import connectDB from "./config/db";
import logger from "./utils/logger";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
app.use(helmet());

app.listen(PORT, async () => {
  try {
    await connectDB();
    logger.info(`Server running on port ${PORT}`);
  } catch (error) {
    logger.error(`Error connecting to the server: ${(error as Error).message}`);
    process.exit(1);
  }
});
