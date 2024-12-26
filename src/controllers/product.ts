import { Request } from "express";
import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Product } from "../models/product.js";
import { NewProductRequestBody, SearchQueryType, SearchRequestType } from "../types/types.js";
import { deleteFilesFromCloudinary, invalidateCache, uploadFilesToCloudinary } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";

// export const newProduct = TryCatch(async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
//     const { name, stock, price, category } = req.body;
//     const photo = req.file;

//     if (!photo) return next(new ErrorHandler("Please add Photo", 404));

//     if (!name || !stock || !price || !category) {
//         rm(photo.path, () => {
//             console.log("removed photo")
//         })

//         return next(new ErrorHandler("Please add all fields", 404));
//     }

//     await Product.create({
//         name, photo: photo.path, stock, price, category: category.toLowerCase()
//     })

//     invalidateCache({ product: true, admin: true })

//     return res.status(201).json({
//         success: true,
//         message: "Product created successfully"
//     })
// })

export const newProduct = TryCatch(async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
    const { name, stock, price, category } = req.body;
    const photo = req.file;

    if (!photo) return next(new ErrorHandler("Please add Photo", 404));

    const result= await uploadFilesToCloudinary([photo],"E-Commerce/Products")

    await Product.create({
        name,
        stock,
        price,
        category: category.toLowerCase(),
        photo: {
            url:result[0].url,
            public_id:result[0].public_id
        },

    })

    invalidateCache({ product: true, admin: true })

    return res.status(201).json({
        success: true,
        message: "Product created successfully"
    })
})

export const getLatestProducts = TryCatch(
    async (req: Request, res, next) => {
        let products;
        if (myCache.has("latest-products")) {
            products = JSON.parse(myCache.get("latest-products") as string);
        } else {
            products = await Product.find().sort({ createdAt: -1 }).limit(5);
            myCache.set("latest-products", JSON.stringify(products));
        }


        return res.status(201).json({
            success: true,
            products,
            message: "Latest products"
        })
    })

export const getAllCategories = TryCatch(
    async (req: Request, res, next) => {
        let categories;
        if (myCache.has("categories")) {
            categories = JSON.parse(myCache.get("categories") as string);
        }
        else {
            categories = await Product.distinct("category");
            myCache.set("categories", JSON.stringify(categories))
        }


        return res.status(201).json({
            success: true,
            categories,
            message: "All Categories"
        })
    })

export const getAdminProducts = TryCatch(
    async (req: Request<{}, {}, NewProductRequestBody>, res, next) => {
        let products;
        if (myCache.has("allproducts")) {
            products = JSON.parse(myCache.get("allproducts") as string);
        } else {
            products = await Product.find();
            myCache.set("allproducts", JSON.stringify(products));
        }


        return res.status(201).json({
            success: true,
            products,
            message: "Admin products"
        })
    })

export const getSingleProduct = TryCatch(
    async (req, res, next) => {
        const { id } = req.params;
        let product;

        if (myCache.has(`product-${id}`)) {
            product = JSON.parse(myCache.get(`product-${id}`) as string);
        }
        else {
            product = await Product.findById(id);
            if (!product) return next(new ErrorHandler("Product not found", 404));
            myCache.set(`product-${id}`, JSON.stringify(product));
            // console.log(`product-${id}`);
        }

        return res.status(201).json({
            success: true,
            product,
            message: "Admin products",

        })
    })

export const deleteProduct = TryCatch(async (req, res, next) => {
    const { id } = req.params;
    let product = await Product.findById(id);

    if (!product) return next(new ErrorHandler("Product not found", 404));

    // rm(product.photo, () => {
    //     console.log("Removed photo of deleted product.")
    // })

    // Now remove photo from cloudinary
    // await cloudinary.uploader.destroy(product.photo!.public_id);
    await deleteFilesFromCloudinary([product.photo!.public_id])

    await product.deleteOne();
    invalidateCache({ product: true, admin: true, productId: id });

    return res.status(201).json({
        success: true,
        message: "Product deleted",

    })
})

// export const updateProduct = TryCatch(async (req, res, next) => {
//     const { name, stock, price, category } = req.body;
//     const photo = req.file;

//     const { id } = req.params;
//     let product = await Product.findById(id);
//     if (!product) return next(new ErrorHandler("Product not found", 404));



//     if (photo) {
//         rm(product.photo, () => {
//             console.log("removed old photo")
//         })
//         product.photo = photo.path;

//     }

//     if (name) product.name = name;
//     if (price) product.price = price;
//     if (stock) product.stock = stock;
//     if (category) product.category = category;


//     await product.save();

//     invalidateCache({ product: true, admin: true, productId: id });

//     return res.status(201).json({
//         success: true,
//         message: "Product updated successfully"
//     })
// })

export const updateProduct = TryCatch(async (req, res, next) => {
    const { name, stock, price, category } = req.body;
    const photo = req.file;
   

    const { id } = req.params;
    let product = await Product.findById(id);
    if (!product) return next(new ErrorHandler("Product not found", 404));

    if (photo) {
        await deleteFilesFromCloudinary([product.photo!.public_id])
        const result = await uploadFilesToCloudinary([photo]);

        product.photo = {
            url: result[0].url,
            public_id: result[0].public_id
        };
    }

    if (name) product.name = name;
    if (price) product.price = price;
    if (stock) product.stock = stock;
    if (category) product.category = category;


    await product.save();

    invalidateCache({ product: true, admin: true, productId: id });

    return res.status(201).json({
        success: true,
        message: "Product updated successfully"
    })
})

export const getFilteredProducts = TryCatch(
    async (req: Request<{}, {}, {}, SearchRequestType>, res, next) => {
        const { search, price, category, sort } = req.query;
        const page = req.query.page || 1;
        const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;


        const skipped = (page - 1) * limit;

        let queryObj: SearchQueryType = {};

        if (search) {
            queryObj.name = {
                $regex: search,
                $options: "i"
            };
        }
        if (price) {
            queryObj.price = {
                $lte: Number(price),
            };
        }
        if (category) {
            queryObj.category = category;
        }

        let productPromise = Product.find(queryObj)
            .sort(sort && { price: sort === "asc" ? 1 : -1 }).limit(limit).skip(skipped);

        let AllFilteredproductsPromise = Product.find(queryObj)

        const [products, AllFilteredproducts] = await Promise.all(
            [productPromise, AllFilteredproductsPromise])

        const totalpages = Math.ceil(AllFilteredproducts.length / limit);

        return res.status(201).json({
            success: true,
            products,
            totalpages,
            message: "All searched products"
        })
    })