const mongoose  = require("mongoose");
const {z} = require("zod");
const User = require("../models/User")


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
    console.log(user);
    res.status(201).json({success : true , message : "User created successfully"})
}   

module.exports = {register}