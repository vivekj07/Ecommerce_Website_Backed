import dotenv from "dotenv";
import express from "express";
import NodeCache from "node-cache";
import { errorMiddleware } from "./middlewares/error.js";
import productRoute from "./routes/product.js";
import userRoute from "./routes/user.js";
import orderRoute from "./routes/order.js";
import { connectDB } from "./utils/features.js";
import morgan from "morgan";
import paymentRoute from "./routes/payment.js";
import dashboardRoute from "./routes/stats.js";
import Stripe from "stripe";
import cors from "cors";



dotenv.config({
    path: "./.env"
})

const mongo_uri = process.env.MONGO_URI || "";
const stripekey = process.env.STRIPE_KEY || "";
const port = process.env.PORT || 4000;

connectDB(mongo_uri);
export const stripe = new Stripe(stripekey);

export const myCache = new NodeCache();

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors());


app.get("/", (req, res) => {
    res.send("API Working..")
})

app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);

app.use("/uploads", express.static("uploads"))
app.use(errorMiddleware)
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
})