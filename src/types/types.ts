import { NextFunction, Request, Response } from "express"

export interface NewUserRequestBody {
    _id: string,
    name: string,
    photo: string,
    email: string,
    gender: string,
    dob: Date,

}
export interface NewProductRequestBody {

    name: string,
    category: string,
    stock: number,
    price: number,


}

export interface SearchQueryType {

    name?: {},
    price?: {},
    sort?: "asc" | "dsc",
    category?: string,
}
export interface SearchRequestType {

    search?: string,
    price?: number,
    sort?: "asc" | "dsc",
    category?: string,
    page?: number

}

export interface invalidateCacheProps {
    product?: boolean,
    order?: boolean,
    admin?: boolean,
    ordertId?: string,
    userId?: string,
    productId?: string | string[],


}

export type ControllerType = (
    req: Request,
    res: Response,
    next: NextFunction)
    => Promise<void | Response<any, Record<string, any>>>

export type orderItemsType = {
    name: string,
    photo: string,
    price: number,
    quantity: number,
    productId: string
}

export type ShippingInfoType = {
    address: string;
    city: string;
    state: string;
    country: string;
    pinCode: number;
};
export interface NewOrderRequestBody {
    ShippingInfo: ShippingInfoType;
    user: string;
    subtotal: number;
    tax: number;
    shippingcharges: number;
    discount: number;
    total: number;
    orderItems: orderItemsType[];
}