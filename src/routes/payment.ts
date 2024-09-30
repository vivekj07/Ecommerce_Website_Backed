import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { allCoupons, applyDiscount, createPaymentIntent, deleteCoupon, newCoupon } from "../controllers/payment.js";

const app = express.Router();
app.post("/create", createPaymentIntent);

app.post("/coupon/new", adminOnly, newCoupon);
app.get("/discount", applyDiscount);
app.get("/coupons", adminOnly, allCoupons);
app.delete("/coupons/:id", adminOnly, deleteCoupon);


export default app;