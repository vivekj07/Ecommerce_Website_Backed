import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility-class.js";
import { TryCatch } from "./error.js";

export const adminOnly = TryCatch(
    async (req, res, next) => {

        const { id } = req.query;
        if (!id) return next(new ErrorHandler("Please login first", 400));
        let user = await User.findById(id);

        if (!user) return next(new ErrorHandler("Invalid id", 400))

        if (user.role === "user") return next(new ErrorHandler("Data is not accesible to you.", 400))

        next();
    }
)

