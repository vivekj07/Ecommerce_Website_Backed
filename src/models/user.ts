import mongoose from "mongoose"
import validator from "validator"

interface IUser extends Document {
    _id: string,
    name: string,
    photo: string,
    email: string,
    role: string,
    gender: string,
    createdAt: Date,
    updatedAt: Date,
    dob: Date,
    age: number

}

const schema = new mongoose.Schema(
    {
        _id: {
            type: String,
            required: [true, "Please enter Id"]
        },
        name: {
            type: String,
            required: [true, "Please enter name"]
        },
        photo: {
            type: String,
            required: [true, "Please add photo"]
        },
        email: {
            type: String,
            required: [true, "Please enter email"],
            unique: [true, "Email already exist"],
            validate: validator.default.isEmail
        },
        role: {
            type: String,
            enum: ["admin", "user"],
            default: "user"
        },
        gender: {
            type: String,
            enum: ["male", "female"],
        },
        dob: {
            type: Date,
            required: [true, "Please enter dob"]
        }

    },
    {
        timestamps: true,
    }
);

schema.virtual("age").get(function () {
    const today = new Date();
    const dob = this.dob;

    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--

    return age;

})

export const User = mongoose.model<IUser>("User", schema);
