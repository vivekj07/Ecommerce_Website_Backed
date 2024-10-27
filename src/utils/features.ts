import mongoose, { Document } from "mongoose"
import { v4 } from 'uuid'; 
import {v2 as cloudinary} from 'cloudinary'; 

import { myCache } from "../app.js"
import { Product } from "../models/product.js"
import { invalidateCacheProps, orderItemsType } from "../types/types.js"
export const connectDB = (uri: string) => {
    mongoose.connect(uri, {
        dbName: "Ecommerce_24"
    }).then(() => {
        console.log("Database connected...")
    }).catch((err) => {
        console.log("error during database connection.")
    })
}

export const invalidateCache = (
    { product, order, admin, ordertId, userId, productId }: invalidateCacheProps) => {

    if (product) {
        const productkeys: string[] = [
            "latest-products",
            "categories",
            "allproducts"
        ];

        if (typeof productId === "string") productkeys.push(`product-${productId}`)

        if (typeof productId === "object") {
            productId.forEach((ele) => {
                productkeys.push(`product-${ele}`)
            })
        }


        myCache.del(productkeys)
    }

    if (order) {

        const orderkeys: string[] = [
            "all-orders",
            `order-${ordertId}`,
            `my-order-${userId}`,
        ];

        myCache.del(orderkeys)
    }

    if (admin) {
        const adminkeys: string[] = [
            "admin-stats",
            "admin-pie-charts",
            "admin-bar-charts",
            "admin-line-charts"
        ];

        myCache.del(adminkeys)
    }
}

export const reduceStock = async (orderItems: orderItemsType[]) => {
    for (let i = 0; i < orderItems.length; i++) {
        const order = orderItems[i];
        const product = await Product.findById(order.productId);
        if (!product) throw new Error("Product not found");

        product.stock -= order.quantity;

        await product.save();
    }
}

export const calculateChanePercent = (thisMonth: number, lastMonth: number) => {
    if (lastMonth == 0) return thisMonth * 100;
    if (thisMonth == 0) return lastMonth * (-100);

    const percent = ((thisMonth) / lastMonth) * 100;
    return Math.round(percent);
}

export const getInventories = async ({
    categories,
    productsCount,
}: {
    categories: string[];
    productsCount: number;
}) => {
    const categoriesCountPromise = categories.map((category) => {
        return Product.countDocuments({ category })
    }
    );

    const categoriesCount = await Promise.all(categoriesCountPromise);

    const categoryCount: Record<string, number>[] = [];

    categories.forEach((category, i) => {
        categoryCount.push({
            [category]: Math.round((categoriesCount[i] / productsCount) * 100),
        });
    });

    return categoryCount;
};

export interface MyDocument extends Document {
    createdAt: Date,
    discount?: number,
    total?: number,

}

export const getBarChartData = ({ arr, length, property }:
    {
        arr: MyDocument[],
        length: number,
        property?: "discount" | "total"
    }) => {

    const data: number[] = new Array(length).fill(0);
    const today = new Date();

    arr.forEach((ele) => {
        const creationDate = ele.createdAt;
        const monthDifference =
            (today.getMonth() - creationDate.getMonth()) + 12 * (today.getFullYear() - creationDate.getFullYear());

        if (monthDifference < length) {

            if (property) {

                data[length - monthDifference - 1] += ele[property]!
            }
            else {
                data[length - monthDifference - 1] += 1;
            }

        }
    }

    )

    return data;
}



interface File {
    mimetype: string;
    buffer: Buffer; 
}

interface UploadResult {
    public_id: string;
    url: string;
}

export const getBase64 = (file:File): string => 
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

export const uploadFilesToCloudinary = async (files: File[],folder?:string): Promise<{ public_id: string; url: string }[]> => {
    const uploadPromises = files.map(async (file) => {
        try {
            const result = await cloudinary.uploader.upload(getBase64(file), {
                public_id: v4(), 
                resource_type: "auto" ,
                folder
            });

            return {
                public_id: result.public_id,
                url: result.secure_url
            };
        } catch (error) {
            throw new Error(`Error in uploading file`);
        }
    });

    try {
        const results = await Promise.all(uploadPromises);
        return results; 
    } catch (err) {
        console.log(err)
        throw new Error("Error in uploading files to Cloudinary");
    }
};


export const deleteFilesFromCloudinary = async (publicIds: string[]) => {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      
      if (result.deleted) {
        console.log('Deleted resources:', result.deleted);
      } else {
        console.error('Error deleting files from Cloudinary:', result);
      }
    } catch (error) {
      console.error('Error deleting files from Cloudinary:', error);
      throw new Error("Error in deleting files from Cloudinary");
    }
  };
