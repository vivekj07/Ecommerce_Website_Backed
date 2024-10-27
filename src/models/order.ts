import mongoose from "mongoose";

const schema = new mongoose.Schema(
    {
        ShippingInfo: {
            address: {
                type: String,
                required: [true, "Please add address"]
            },
            country: {
                type: String,
                required: [true, "Please add country"]

            },
            state: {
                type: String,
                required: [true, "Please add state"]

            },
            city: {
                type: String,
                required: [true, "Please add city"]

            },
            pincode: {
                type: Number,
                required: [true, "Please add pincode"]

            },
        },
        user: {
            type: String,
            ref: "User",
            required: [true, "Please add user"]

        },
        subtotal: {
            type: Number,
            required: [true, "Please add subtotal"]

        },
        total: {
            type: Number,
            required: [true, "Please add total"]

        },
        shippingcharges: {
            type: Number,
            required: [true, "Please add shippingcharges"]

        },
        tax: {
            type: Number,
            required: [true, "Please add tax"]

        },
        discount: {
            type: Number,
            required: [true, "Please add discount"]

        },
        status: {
            type: String,
            enum: ["Proccessing", "Shipped", "Delivered"],
            default: "Proccessing"
        },
        orderItems: [
            {
                name: String,
                photo: {
                    url: {
                        type: String,
                        required: true,
                    },
                    public_id: {
                        type: String,
                        required: true,
                    }
                },
                price: Number,
                quantity: Number,
                productId: {
                    type: mongoose.Types.ObjectId,
                    ref: "Product"
                }

            }
        ]
    },
    {
        timestamps: true
    })

export const Order = mongoose.model("Order", schema);