import { NextFunction, Request, Response } from "express";
import { Error } from "mongoose";
import ErrorHandler from "../utils/utility-class.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleware = (err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {

    err.message = err.message || "Internal server Error";
    err.statuscode = err.statuscode || 500
    if (err.name == "CastError") err.message = "Invalid id"
    if (err.code == 11000) err.message = "Duplicate key error"


    res.status(err.statuscode).json({
        success: false,
        message: err.message
    })
}


export const TryCatch = (func: ControllerType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        return Promise.resolve(func(req, res, next)).catch(next);
    }
}

