import { Request } from "express";
import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { NewOrderRequestBody } from "../types/types.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";

export const newOrder = TryCatch(
    async (req: Request<{}, {}, NewOrderRequestBody>, res, next) => {
        const { ShippingInfo, user, subtotal, total, shippingcharges,
            orderItems, tax, discount } = req.body;

        if (!ShippingInfo || !user || !subtotal || !total ||
            !orderItems || !tax)
            return next(new ErrorHandler("Please enter all fields", 404))

        const order = await Order.create({
            ShippingInfo, user, subtotal, total, shippingcharges,
            orderItems, tax, discount
        })

        let productIds: string[] = [];
        for (let i = 0; i < order.orderItems.length; i++) {

            productIds.push(String(order.orderItems[i].productId));

        }


        await reduceStock(orderItems);

        invalidateCache({
            product: true, order: true, admin: true,
            userId: user,
            productId: productIds
        })


        return res.status(201).json({
            success: true,
            message: "Order placed successfully",

        })
    }
)

export const myOrder = TryCatch(
    async (req, res, next) => {
        const { id } = req.query;
        if (!id) return next(new ErrorHandler("Id not found", 400));

        let orders = [];

        if (myCache.has(`my-order-${id}`)) {
            orders = JSON.parse(myCache.get(`my-order-${id}`)!)
        } else {
            orders = await Order.find({ user: id });
            if (orders.length == 0) return next(new ErrorHandler("Orders not found", 404));
            myCache.set(`my-order-${id}`, JSON.stringify(orders));
        }

        return res.status(200).json({
            success: true,
            orders
        })
    }
)

export const getSingleOrder = TryCatch(
    async (req, res, next) => {
        const { id } = req.params;
        let order;

        if (myCache.has(`order-${id}`)) {

            order = JSON.parse(myCache.get(`order-${id}`)!);

        } else {
            order = await Order.findOne({ _id: id }).populate("user", "name");
            if (!order) return next(new ErrorHandler("Order not found", 404));
            myCache.set(`order-${id}`, JSON.stringify(order));


        }

        return res.status(200).json({
            success: true,
            order
        })
    }
)

export const allOrders = TryCatch(
    async (req, res, next) => {

        let orders = [];

        if (myCache.has("all-orders")) {
            orders = JSON.parse(myCache.get("all-orders")!)
        } else {
            orders = await Order.find().populate("user", "name");
            if (orders.length == 0) return next(new ErrorHandler("Orders not found", 404));
            myCache.set("all-orders", JSON.stringify(orders));
        }

        return res.status(200).json({
            success: true,
            orders
        })
    }
)

export const proccessOrder = TryCatch(
    async (req, res, next) => {
        const { id } = req.params;

        const order = await Order.findById(id);

        if (!order) return next(new ErrorHandler("Orders not found", 404));

        if (order.status == "Proccessing") {
            order.status = "Shipped";
        } else if (order.status == "Shipped") {
            order.status = "Delivered"
        } else {
            order.status = "Delivered"
        }

        await order.save();

        invalidateCache({
            product: false, order: true, admin: true,
            ordertId: id, userId: order.user
        });

        return res.status(200).json({
            success: true,
            message: "Order Processed"
        })
    }
)

export const deleteOrder = TryCatch(
    async (req, res, next) => {
        const { id } = req.params;

        const order = await Order.findById(id)
        if (!order) return next(new ErrorHandler("Order not found", 404))

        await order.deleteOne();

        invalidateCache({
            product: false, order: true, admin: true,
            ordertId: id, userId: order.user
        });

        return res.status(200).json({
            success: true,
            message: " Order deleted Successfully"
        })
    }
)
