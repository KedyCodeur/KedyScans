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

const signAccessToken =  (data) =>{

    const accessToken = jwt.sign(
        {roles : data.roles , userID : data.userID , isActivated : data.isActivated},
        process.env.ACCESS_SECRET,
        {expiresIn : "15m"}
    );
    
    return accessToken;
}

const signRefreshToken = async (data) => {
    
    const ttlSeconds = data.rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24;

    const refreshToken = jwt.sign(
        {roles : data.roles , userID : data.userID , isActivated : data.isActivated , rememberMe : data.rememberMe},
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


            
            const data = {roles : user.roles , userID : user._id,rememberMe : rememberMe , isActivated : isActivated}

         
            const existingRefreshToken = req.cookies?.refreshToken;
           
            if(existingRefreshToken){
                const hashedOldRefresh = tokenHash(existingRefreshToken);
                const key = `user:${data.userID}-refresh:${hashedOldRefresh}`;

                await redis.unlink(key);
          
            }

            
            
            
            const refreshToken = await signRefreshToken(data);
            const accessToken = await signAccessToken(data);
            

            const hashedNewRefresh = tokenHash(refreshToken);
            const newRedisKey = `user:${data.userID}-refresh:${hashedNewRefresh}`;

            
            const ttl = data.rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24; 
            await redis.set(newRedisKey, "valid", { ex: ttl });
       
            
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
                roles : user.roles,
                isActivated : user.isActivated
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
const handleRefresh = async (req,res) => {
    
    const token =  req.cookies.refreshToken;

    if (!token) {
           
            const err = new Error("Invalid Credentials");
            err.code = 401;
            throw err;
    }
    
    try {
        const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

        try{
            
            const hashedRefreshToken = tokenHash(token);

            const redisKey =`user:${decoded.userID}-refresh:${hashedRefreshToken}`
            
            const deletedIfExists = await redis.unlink(redisKey);

            if (deletedIfExists === 0) {
   
                const err = new Error("Invalid Credentials");
                err.code = 401;
                throw err;
            }
            
        }catch (e) {
            return res.status(503).json({success : false , e:"Service Unavailable"})
            
        }  

       
        const data = {roles :decoded.roles, userID : decoded.userID,isActivated : decoded.isActivated , rememberMe : decoded.rememberMe};

        const accessToken = signAccessToken(data);
        const refreshToken = await signRefreshToken(data);

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
            message: "Refresh Successfujl",

        });        
    } catch (e) {
            const err = new Error("Invalid Credentials");
            err.code = 401;
            throw err;
            
    }    
}

const verifySchema = z.object({
    code : z.string().trim().length(6)
})

const sendVerifyCode = async (req,res) => {
   
    const code = crypto.randomBytes(3).toString('hex').slice(0, 6).toUpperCase();
    

    const userID = req.tokenInfo?.userID || "";

    const user =  await User.findOne({ _id: userID }).select('email');

    if (!user?.email) {
            const err = new Error("User Not found");
            err.code = 404; 
            throw err;    
    }   

    const email = user.email;

    const redisKey = `verifyCode$userID:${userID}`

    await redis.unlink(redisKey);

    

    try {
        const resendRequest = await resend.emails.send({
            from: 'Kedyscans <noreply@kedyscans.world>',
            to: email,
            subject: 'Doğrulama Kodunuz',
            html: `<p>Kodunuz: ${code}</p>`
        });

        await redis.set(redisKey, code, { ex: 300 });

    } catch (error) {
        const err = new Error("Failed to send email. Please try again later.");
        err.code = 502; 
        throw err;
    }   

    res.status(200).json({ success: true, message: "Email has been sent" });
   
}

const verifyEmail = async (req,res) => {
    const result = verifySchema.parse(req.body)
    const code = 1
}
module.exports = { register, signAccessToken, signRefreshToken, login, verifyEmail,sendVerifyCode , handleRefresh};