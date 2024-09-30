import mongoose from "mongoose"

const schema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true,

    }
}, {
    timestamps: true
})

export const Coupon = mongoose.model("Coupon", schema);