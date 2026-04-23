import dotenv from "dotenv";

dotenv.config();



const ENV = {
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET,

    FRONTEND_URL: process.env.FRONTEND_URL,
    FRONTEND_URL1: process.env.FRONTEND_URL1,

    // credentials to send email
    USER_EMAIL: process.env.EMAIL_USER,
    EMAIL_APP_PASSWORD: process.env.EMAIL_PASS,


    // Cloudinary Credentials
    cloud_name: process.env.CLOUD_NAME, 
    cloud_api_key: process.env.CLOUD_API_KEY,  
    cloud_api_secret: process.env.CLOUD_API_SECRET,
    cloud_folder: process.env.CLOUD_FOLDER,

    // Razorpay Credentials
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,

    mode: process.env.NODE_ENV,


    
}

export default ENV;