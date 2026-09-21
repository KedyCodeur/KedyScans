require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const dbConnect = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        await User.init();
        console.log("Connection to mongoose SUCCESS");
    }catch(e){
        console.log(e)
    }
}

module.exports = dbConnect;