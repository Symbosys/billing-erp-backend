import express, { json } from "express"



import cors from "cors"
import authRoutes from "./module/auth/routes/auth.routes.js"
import customerRoutes from "./module/customer/routes/customer.routes.js"
import productRoutes from "./module/product/routes/product.routes.js"
import billRoutes from "./module/bill/routes/bill.routes.js"
import billItemRoutes from "./module/billItem/routes/billItem.routes.js"
import dashboardRoutes from "./module/dashboard/routes/dashboard.routes.js"
import inventoryRoutes from "./module/inventory/routes/inventory.routes.js"
import analyticsRoutes from "./module/analytics/routes/analytics.routes.js"
import paymentRoutes from "./module/payment/routes/payment.route.js"
import supplierRoutes from "./module/supplier/routes/supplier.route.js"
import purchaseRoutes from "./module/purchase/routes/purchase.route.js"
import stockHistoryRoutes from "./module/stockHistory/routes/stockHistory.route.js"
import { errorMiddleware } from "./middleware/error.middleware.js"

const app = express()
app.use(cors())
app.use(json())

// Routes
app.use("/auth", authRoutes)
app.use("/customer", customerRoutes)
app.use("/product", productRoutes)
app.use("/bill", billRoutes)
app.use("/bill-item", billItemRoutes)
app.use("/dashboard", dashboardRoutes)
app.use("/inventory", inventoryRoutes)
app.use("/analytics", analyticsRoutes)
app.use("/payment", paymentRoutes)
app.use("/supplier", supplierRoutes)
app.use("/purchase", purchaseRoutes)
app.use("/stock-history", stockHistoryRoutes)


app.get("/", (req, res) => {
    res.send("Billing Software API is running...")
})

// Error Middleware
app.use(errorMiddleware)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})