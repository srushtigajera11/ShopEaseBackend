const express = require("express");
const errorHandler = require('./middlewares/error.middleware');
const authRoute = require('./routes/auth.route');
const productRoute = require('./routes/product.route');
const orderRoute = require("./routes/order.route")
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes first
app.use('/api/auth', authRoute);
app.use('/api/product',productRoute);
app.use('/api/order',orderRoute);

app.get("/", (req, res) => {
    res.send("shopEase API is running");
});

// Error middleware LAST
app.use(errorHandler);

module.exports = app;
