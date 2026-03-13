import mongoose  from "mongoose";

export const connectDB = async () =>{
    await mongoose.connect("mongodb+srv://akashjordan399_db_user:trackerexpense01@cluster0.jbbsi00.mongodb.net/Expense")
    .then(()=> console.log('DB Connected'))
}