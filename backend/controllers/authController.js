const mongoose  = require("mongoose");
const {z} = require("zod");
const jwt = require("jsonwebtoken");
const redis  = require("../config/redis");
const crypto = require("crypto");
const bcrypt = require("bcrypt")
const User = require("../models/User");

const resend = require("../config/resend");


const registerSchema = z.object({
    email: z
        .string({ required_error: "Email is required." })
        .trim()
        .email("Please provide a valid email address.")
        .refine((val) => !/\p{Extended_Pictographic}/u.test(val), {
            message: "Emojis are not allowed in email.",
        })
        .toLowerCase()    
    
    ,
    
    password: 
        z.string({ required_error: "Password is required." })
        .trim()
        .min(6, "Password must be at least 6 characters long.")
        .refine((val) => !/\p{Extended_Pictographic}/u.test(val), {
            message: "Emojis are not allowed in passwords.",
        })
});

const register = async (req,res) => {

    const result = registerSchema.parse(req.body)


    const password = result.password;
    const email = result.email;
    const newUser = new User({email : email ,password : password})
    const user = await newUser.save();
    res.status(201).json({success : true , message : "User created successfully"})
}   

const tokenHash = (token) =>{
    return crypto.createHash('sha256').update(token).digest('hex');
}

const signAccessToken = async (data) =>{

    const accessToken = jwt.sign(
        {roles : data.roles , userID : data.userID , isActivated : isActivated},
        process.env.ACCESS_SECRET,
        {expiresIn : "15m"}
    );

    return accessToken;
}

const signRefreshToken = async (data) => {
    
    const ttlSeconds = data.rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24;

    const refreshToken = jwt.sign(
        {roles : data.roles , userID : data.userID , isActivated : isActivated},
        process.env.REFRESH_SECRET,
        {expiresIn :ttlSeconds}
    );


    const hashedRefreshToken = tokenHash(refreshToken);

    await redis.set(`user:${data.userID}-refresh:${hashedRefreshToken}`, 1, { ex: ttlSeconds });
    return refreshToken;
}

const loginSchema = z.object({
    email: z
        .string({ required_error: "Email is required." })
        .trim()
        .email("Please provide a valid email address.")
        .refine((val) => !/\p{Extended_Pictographic}/u.test(val), {
            message: "Emojis are not allowed in email.",
        })
        .toLowerCase()    
    
    ,
    
    password: 
        z.string({ required_error: "Password is required." })
        .trim()
        .min(6, "Password must be at least 6 characters long.")
        .refine((val) => !/\p{Extended_Pictographic}/u.test(val), {
            message: "Emojis are not allowed in passwords.",
        })
    ,
    rememberMe: z.preprocess((val) => {
        if (val === "true" || val === true) return true;
        if (val === "false" || val === false) return false;
        return false; 
    }, z.boolean()),
});

const login = async (req,res) => {
    const result = loginSchema.parse(req.body)

    const password = result.password;
    const email = result.email;
    const rememberMe = result.rememberMe;


    const user = await User.findOne({email : email});

    if(user){
        const match = await bcrypt.compare(password,user.password)
        
        if(match){

            const isActivated = user.isActivated;

            if(!isActivated){
                const err = new Error("Email not verified");
                err.code = 403;
                throw err;               
            }
            
            const data = {roles : user.roles , userID : user._id,rememberMe : rememberMe , isActivated : isActivated}

            const existingRefreshToken = req.cookies?.refreshToken;
           
            if(existingRefreshToken){
                const hashedOldRefresh = tokenHash(existingRefreshToken);
                const key = `user:${data.userID}-refresh:${hashedOldRefresh}`;

                const exists = await redis.exists(key) ;
                if(exists){
                    await redis.unlink(key);
                }
            }

            
            
            const refreshToken = await signRefreshToken(data);
            const accessToken = await signAccessToken(data);
            

            res.cookie("refreshToken",refreshToken,{
                httpOnly : true,
                secure : process.env.NODE_ENV === "production",
                sameSite : "strict",
                ...(data.rememberMe && { maxAge: 60 * 60 * 24 * 7 * 1000 })
            })
            res.cookie("accessToken",accessToken,{
                httpOnly : true,
                secure : process.env.NODE_ENV === "production",
                sameSite : "strict",
                maxAge: 15 * 60 * 1000
            }) 

            res.status(200).json({
                success: true,
                message: "Logged in successfully",
                roles : user.roles
            });
        }else{
            const err = new Error("Invalid Credentials");
            err.code = 401;
            throw err;
        }

    }else{
        const err = new Error("Invalid Credentials");
        err.code = 401;
        throw err;
    }
    
}

const loginAdmin = async (req,res) => {
    const result = loginSchema.parse(req.body)

    const password = result.password;
    const email = result.email;
    const rememberMe = result.rememberMe;


    const user = await User.findOne({email : email});

    if(user){
        const match = await bcrypt.compare(password,user.password)
        
        if(match){
            
            const data = {roles : user.roles , userID : user._id,rememberMe : rememberMe}

            const existingRefreshToken = req.cookies?.refreshToken;
           
            if(existingRefreshToken){
                const hashedOldRefresh = tokenHash(existingRefreshToken);
                const key = `user:${data.userID}-refresh:${hashedOldRefresh}`;

                const exists = await redis.exists(key) ;
                if(exists){
                    await redis.unlink(key);
                }
            }

            
            
            const refreshToken = await signRefreshToken(data);
            const accessToken = await signAccessToken(data);
            

            res.cookie("refreshToken",refreshToken,{
                httpOnly : true,
                secure : process.env.NODE_ENV === "production",
                sameSite : "strict",
                ...(data.rememberMe && { maxAge: 60 * 60 * 24 * 7 * 1000 })
            })
            res.cookie("accessToken",accessToken,{
                httpOnly : true,
                secure : process.env.NODE_ENV === "production",
                sameSite : "strict",
                maxAge: 15 * 60 * 1000
            }) 

            res.status(200).json({
                success: true,
                message: "Logged in successfully",
                userID: data.userID
            });
        }else{
            const err = new Error("Invalid Credentials");
            err.code = 401;
            throw err;
        }

    }else{
        const err = new Error("Invalid Credentials");
        err.code = 401;
        throw err;
    }
    
}


const verifyEmail = async (req,res) => {
    resend.emails.send({
        from : "bomba@gmail.com",
        to : "cemsahozdemirel791@gmail.com",
        subject : "hmm",
        html: '<p>Congrats on sending your <strong>first email</strong>!</p>'

    })
}
module.exports = { register, signAccessToken, signRefreshToken, login, verifyEmail};