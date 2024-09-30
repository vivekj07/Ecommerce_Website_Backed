import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { MyDocument, calculateChanePercent, getBarChartData, getInventories } from "../utils/features.js";

export const getDashboardStats = TryCatch(
    async (req, res, next) => {
        let stats = {};

        if (myCache.has("admin-stats")) {
            stats = JSON.parse(myCache.get("admin-stats")!)
        }
        else {
            const today = new Date();

            const sixMonthAgo = new Date();


            sixMonthAgo.setMonth(today.getMonth() - 6);


            const thisMonth = {
                start: new Date(today.getFullYear(), today.getMonth(), 1),
                end: today

            }
            const lastMonth = {
                start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
                end: new Date(today.getFullYear(), today.getMonth(), 0)

            }


            const thisMonthProductsPromise = Product.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end
                }
            })

            const lastMonthProductsPromise = Product.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end
                }
            })

            const thisMonthUsersPromise = User.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end
                }
            })


            const lastMonthUsersPromise = User.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end
                }
            })

            const thisMonthOrdersPromise = Order.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end
                }
            })

            const lastMonthOrdersPromise = Order.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end
                }
            })

            const lastSixMonthOrdersPromise = Order.find({
                createdAt: {
                    $gte: sixMonthAgo,
                    $lte: today
                }
            })

            const latestTransactionsPromise = Order.find().
                select(["_id", "orderItems", "discount", "status", "total"]).sort({ total: -1 }).limit(4);

            const [
                thisMonthProducts,
                lastMonthProducts,
                thisMonthUsers,
                lastMonthUsers,
                thisMonthOrders,
                lastMonthOrders,
                productsCount,
                userCount,
                allOrders,
                lastSixMonthOrders,
                categories,
                maleCounts,
                latestTransactions,

            ] = await Promise.all([

                thisMonthProductsPromise,
                lastMonthProductsPromise,
                thisMonthUsersPromise,
                lastMonthUsersPromise,
                thisMonthOrdersPromise,
                lastMonthOrdersPromise,
                Product.countDocuments(),
                User.countDocuments(),
                Order.find().select("total"),
                lastSixMonthOrdersPromise,
                Product.distinct("category"),
                User.countDocuments({ gender: "male" }),
                latestTransactionsPromise

            ])

            let thisMonthRevenue = 0;
            for (let i = 0; i < thisMonthOrders.length; i++) {

                thisMonthRevenue += thisMonthOrders[i].total!;

            }
            const lastMonthRevenue = 0;
            for (let i = 0; i < lastMonthOrders.length; i++) {

                thisMonthRevenue += lastMonthOrders[i].total!;

            }

            const percentChange = {
                revenue: calculateChanePercent(thisMonthRevenue, lastMonthRevenue),
                product: calculateChanePercent(thisMonthProducts.length, lastMonthProducts.length),
                user: calculateChanePercent(thisMonthUsers.length, lastMonthUsers.length),
                order: calculateChanePercent(thisMonthOrders.length, lastMonthOrders.length),
            }


            let totalRevenue = 0;
            for (let i = 0; i < allOrders.length; i++) {

                totalRevenue += allOrders[i].total!;

            }
            const count = {
                totalRevenue,
                product: productsCount,
                user: userCount,
                order: allOrders.length
            }


            const monthlyOrdercount = new Array(6).fill(0);
            const monthlyRevenue = new Array(6).fill(0);


            lastSixMonthOrders.forEach((order) => {
                const creationDate = order.createdAt;
                const monthDifference =
                    (today.getMonth() - creationDate.getMonth()) + 12 * (today.getFullYear() - creationDate.getFullYear());

                if (monthDifference < 6) {
                    monthlyOrdercount[6 - monthDifference - 1] += 1;
                    monthlyRevenue[6 - monthDifference - 1] += order.total;

                }
            })

            const chart = {
                monthlyOrdercount,
                monthlyRevenue
            }

            const categoryCount = await getInventories({
                categories,
                productsCount,
            });

            const usersRatio = {
                male: maleCounts,
                female: userCount - maleCounts,
            }

            const modifiedLatestTransactions = latestTransactions.map((order) => ({
                _id: order._id,
                amount: order.total,
                status: order.status,
                discount: order.discount,
                quantity: order.orderItems.length

            }))


            stats = {
                percentChange,
                count,
                chart,
                categoryCount: categoryCount.sort((a, b) => {
                    let keyA = Object.keys(a)[0];
                    let keyB = Object.keys(b)[0];

                    return b[keyB] - a[keyA];
                }),
                usersRatio,
                latestTransactions: modifiedLatestTransactions,
            }

            myCache.set("admin-stats", JSON.stringify(stats));


        }

        return res.status(200).json({
            success: true,
            stats
        })
    }
)

export const getPieChart = TryCatch(
    async (req, res, next) => {
        let charts = {};

        if (myCache.has("admin-pie-charts"))
            charts = JSON.parse(myCache.get("admin-pie-charts")!)
        else {
            const [
                proccessingOrders,
                shippedOrders,
                deliveredOrders,
                categories,
                productsCount,
                inStock,
                allOrders,
                allUsers

            ] = await Promise.all([
                Order.countDocuments({ status: "Proccessing" }),
                Order.countDocuments({ status: "Shipped" }),
                Order.countDocuments({ status: "Delivered" }),
                Product.distinct("category"),
                Product.countDocuments(),
                Product.countDocuments({ stock: { $gt: 0 } }),
                Order.find().select(["total", "subtotal", "shippingcharges", "tax", "discount"]),
                User.find().select(["dob", "role"]), // HEre dob is selected because it hepl to find age -->see at user schema
            ])

            const orderFullfillment = {
                procceesing: proccessingOrders,
                shipped: shippedOrders,
                delievered: deliveredOrders,
            }
            const countCategories =
                await getInventories({ categories, productsCount });

            const stockAvailability = {
                inStock,
                outOfStock: productsCount - inStock,

            }

            const grossIncome = allOrders.reduce((total, order) => {
                return total + (order.total || 0)
            }, 0)

            const discount = allOrders.reduce((total, order) => {
                return total + (order.discount || 0)
            }, 0)

            const productionCost = allOrders.reduce((total, order) => {
                return total + (order.shippingcharges || 0)
            }, 0)
            const burnt = allOrders.reduce((total, order) => {
                return total + (order.tax || 0)
            }, 0)
            const marketingCost = Math.round(grossIncome * 20 / 100);

            const netMargin = grossIncome - discount - productionCost - burnt - marketingCost;


            const revenueDistribution = {
                netMargin,
                marketingCost,
                burnt,
                productionCost,
                discount

            }

            const usersAgeGroup = {
                teen: allUsers.filter((user) => user.age < 20).length,
                adult: allUsers.filter((user) => user.age >= 20 && user.age <= 40).length,
                old: allUsers.filter((user) => user.age > 40).length,
            }

            const adminUserCount = {
                admins: allUsers.filter((user) => user.role == "admin").length,
                customer: allUsers.filter((user) => user.role == "user").length,
            }

            charts = {
                orderFullfillment,
                countCategories,
                stockAvailability,
                revenueDistribution,
                usersAgeGroup,
                adminUserCount
            }
            myCache.set("admin-pie-charts", JSON.stringify(charts));

        }

        return res.status(200).json({
            success: true,
            charts
        })
    }
)

export const getBarChart = TryCatch(
    async (req, res, next) => {
        let charts;
        const key = "admin-bar-charts";
        if (myCache.has(key))
            charts = JSON.parse(myCache.get(key)!);

        else {
            const today = new Date();

            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(today.getMonth() - 6)

            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(today.getMonth() - 12)

            const sixMonthProductPromise = Product.find({
                createdAt: {
                    $lte: today,
                    $gte: sixMonthsAgo
                }
            }).select("createdAt")

            const sixMonthUserPromise = User.find({
                createdAt: {
                    $lte: today,
                    $gte: sixMonthsAgo
                }
            }).select("createdAt")

            const twelveMonthOrderPromise = Order.find({
                createdAt: {
                    $lte: today,
                    $gte: twelveMonthsAgo
                }
            }).select(["createdAt"])

            const [
                sixMonthProduct,
                sixMonthUser,
                twelveMonthOrder

            ] = await Promise.all([
                sixMonthProductPromise,
                sixMonthUserPromise,
                twelveMonthOrderPromise
            ])


            const sixMonthProducts = getBarChartData({ arr: sixMonthProduct, length: 6 });
            const sixMonthUsers = getBarChartData({ arr: sixMonthUser, length: 6 });
            const twelvwMothOrders = getBarChartData({ arr: twelveMonthOrder as MyDocument[], length: 12 });


            charts = {
                products: sixMonthProducts,
                users: sixMonthUsers,
                orders: twelvwMothOrders
            }

            myCache.set(key, JSON.stringify(charts));
        }

        return res.status(200).json({
            success: true,
            charts
        })

    }
)

export const getLineChart = TryCatch(
    async (req, res, next) => {
        let charts;
        const key = "admin-line-charts";
        if (myCache.has(key))
            charts = JSON.parse(myCache.get(key)!);

        else {
            const today = new Date();


            const twelveMonthsAgo = new Date();
            twelveMonthsAgo.setMonth(today.getMonth() - 12)

            const query = {
                createdAt: {
                    $lte: today,
                    $gte: twelveMonthsAgo
                }
            }

            const [
                twelveMonthProduct,
                twelveMonthUser,
                twelveMonthOrder

            ] = await Promise.all([
                Product.find(query).select(["createdAt"]),
                User.find(query).select(["createdAt"]),
                Order.find(query).select(["createdAt", "discount", "total"])
            ])

            const twelveMonthProducts = getBarChartData({ arr: twelveMonthProduct, length: 12 });
            const twelveMonthUsers = getBarChartData({ arr: twelveMonthUser, length: 12 });

            const discount = getBarChartData({ arr: twelveMonthOrder as MyDocument[], length: 12, property: "discount" });
            const revenue = getBarChartData({ arr: twelveMonthOrder as MyDocument[], length: 12, property: "total" });

            charts = {
                products: twelveMonthProducts,
                users: twelveMonthUsers,
                discount,
                revenue
            }

            myCache.set(key, JSON.stringify(charts));
        }

        return res.status(200).json({
            success: true,
            charts
        })

    }
)

