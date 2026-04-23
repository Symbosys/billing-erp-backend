import express, { json } from "express"
import authRoutes from "./module/auth/routes/auth.routes.js"
import customerRoutes from "./module/customer/routes/customer.routes.js"
import productRoutes from "./module/product/routes/product.routes.js"
import billRoutes from "./module/bill/routes/bill.routes.js"
import billItemRoutes from "./module/billItem/routes/billItem.routes.js"
import { errorMiddleware } from "./middleware/error.middleware.js"

const app = express()
app.use(json())

// Routes
app.use("/auth", authRoutes)
app.use("/customer", customerRoutes)
app.use("/product", productRoutes)
app.use("/bill", billRoutes)
app.use("/bill-item", billItemRoutes)


app.get("/", (req, res) => {
    res.send("Billing Software API is running...")
})

// Error Middleware
app.use(errorMiddleware)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
})