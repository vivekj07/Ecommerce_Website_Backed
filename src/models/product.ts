import mongoose from "mongoose"

const schema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Please enter name"]
    },
    photo: {
        type: String,
        required: [true, "Please add photo"]
    },
    stock: {
        type: Number,
        required: [true, "Please enter stock"]
    },
    price: {
        type: Number,
        required: [true, "Please enter price"]
    },
    category: {
        type: String,
        required: [true, "Please add category"],
        trim: true
    },


},
    {
        timestamps: true,
    }
)

export const Product = mongoose.model("Product", schema)