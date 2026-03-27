import cors from "cors";
import express from "express";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", routes);
app.use(notFoundHandler);
app.use(errorHandler);
