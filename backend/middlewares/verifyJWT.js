require("dotenv").config();
const jwt = require("jsonwebtoken")

const verifyToken = async (req,res,next) => {
    const token =  req.cookies.accessToken;
    console.log("a")
    if (!token) {

            const err = new Error("Invalid Credentials");
            err.code = 401;
            throw err;
        }
    
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
        req.tokenInfo = decoded;
        console.log("girş okey")
        next();
    } catch (e) {
            const err = new Error("Invalid Credentials");
            err.code = 401;
            throw err;
    }   
}

module.exports = verifyToken