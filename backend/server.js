const express = require('express');
const cors = require('cors');
require('dotenv').config(); 
const expressMongoSanitize = require("@exortek/express-mongo-sanitize");
const dbConnect = require("./config/dbConnection")

const app = express();
const AuthRouter = require("./routes/authRouter")

const PORT = process.env.PORT || 3000;



app.use(cors({
    origin: process.env.CLIENT_URL, 
    credentials: true 
}));

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(express.static('Public'));
app.use(expressMongoSanitize());

dbConnect();

app.use("/auth",AuthRouter)

app.use((err,req,res,next)=>{
    if(err.name === "ZodError"){
        res.status(400).json({success : false , e : "Invalid Request"})
    }   
    else if(err.code === 11000){
        const field = Object.keys(err.keyValue)[0]
        const capitalizedField = field.charAt(0).toUpperCase() + field.slice(1);

        res.status(409).json({success : false , e: `${capitalizedField} is already in use`})
    }
    else{
        res.status(500).json({success:false , e : "Internal Server Error"})
    }
    console.log(err)
    
  
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});