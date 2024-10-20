import { NextFunction, Request, Response } from "express"
import { User } from "../models/user.js"
import { NewUserRequestBody } from "../types/types.js";
import { Error } from "mongoose";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";
import { invalidateCache } from "../utils/features.js";

export const newUser = TryCatch(
    async (
        req: Request<{}, {}, NewUserRequestBody>,
        res: Response,
        next: NextFunction) => {
        const { name, email, photo, gender, _id, dob } = req.body;
        let user = await User.findById(_id);
        console.log("user",user)
        if (user) {
            return res.status(201).json({
                success: true,
                message: `Welcome again ${name}`
            })
        }

        if (!name || !email || !photo || !_id || !dob || !gender) {
            return next(new ErrorHandler("Please add all feilds", 400))
        }


        user = await User.create({
            name,
            email,
            photo,
            gender,
            _id,
            dob: new Date(dob),
        });
        console.log("New user created")
        invalidateCache({ admin: true });

        return res.status(201).json({
            success: true,
            message: `Welcome ${name}`
        })
    });

export const getAllUsers = TryCatch(
    async (req, res, next) => {
        const users = await User.find({});
        return res.status(200).json({
            success: true,
            users
        })
    }
)

export const getSingleUser = TryCatch(
    async (req, res, next) => {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return next(new ErrorHandler("Invalid user id", 400))
        }
        return res.status(200).json({
            success: true,
            user
        })
    }
)

export const deleteUser = TryCatch(
    async (req, res, next) => {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return next(new ErrorHandler("Invalid user id", 400))
        }
        await user.deleteOne();
        return res.status(200).json({
            success: true,
            message: "User deleted Successfully",
            user
        })
    }
)






