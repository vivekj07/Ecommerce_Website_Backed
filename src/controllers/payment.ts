import { stripe } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility-class.js";


export const createPaymentIntent = TryCatch(
    async (req, res, next) => {
        const { amount } = req.body;
        if (!amount)
            return next(new ErrorHandler("Please enter all fields", 400))

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Number(amount) * 100,
            currency: "inr"
        })

        return res.status(201).json({
            success: true,
            clientsecret: paymentIntent.client_secret

        })
    }
)


export const newCoupon = TryCatch(
    async (req, res, next) => {
        const { code, amount } = req.body;

        // console.log(amount, code);
        if (!code || !amount)
            return next(new ErrorHandler("Please enter all fields", 400))

        await Coupon.create({
            code, amount
        })

        return res.status(201).json({
            success: true,
            message: "Coupon created Successfully"

        })
    }
)

export const applyDiscount = TryCatch(
    async (req, res, next) => {
        const { code } = req.query;
        if (!code)
            return next(new ErrorHandler("Please enter coupon code", 400))

        const coupons = await Coupon.find({ code });
        const coupon = coupons[0];

        //Or use 
        // const coupon = (await Coupon.find({ code })).pop();


        if (!coupon) return next(new ErrorHandler("Invalid Coupncode", 404))

        return res.status(200).json({
            success: true,
            message: "Coupon applied Successfully",
            discount: coupon.amount

        })
    }
)

export const allCoupons = TryCatch(
    async (req, res, next) => {


        const coupons = await Coupon.find().sort({ createdAt: -1 });


        if (!coupons) return next(new ErrorHandler("No coupons available", 404))

        return res.status(200).json({
            success: true,

            coupons

        })
    }
)

export const deleteCoupon = TryCatch(
    async (req, res, next) => {
        const { id } = req.params;

        const deletedCoupon = await Coupon.findByIdAndDelete(id);


        if (!deletedCoupon) return next(new ErrorHandler("Coupon not found", 404))

        return res.status(200).json({
            success: true,
            message: "Deleted Coupon",
            deletedCoupon

        })
    }
)