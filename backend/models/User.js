const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
    email : {type : String, unique : true, required : true , lowercase : true},
    username : {type : String},
    password : {type : String , required : true },
    roles : {type : [String] , default : ["User"]},
    tag : {type : String},
    isActivated : {type : Boolean , default : false}
})

userSchema.index({ username: 1, tag: 1 }, { unique: true });

userSchema.pre("save", async function (){
        if (!this.username) {
            const newUsername = this.email.split("@")[0].trim();
            let newTag;
            let alreadyExists;
            let attempts = 0;
            let attemptsLimit = 20;
            do{ 
                attempts +=1
                newTag = crypto.randomBytes(3).toString('hex').slice(0, 5).toUpperCase()
                alreadyExists = await this.constructor.exists({username : newUsername , tag : newTag});

                if(attempts >= attemptsLimit){
                    throw new Erorr("What a luck...")
                }

            }while(alreadyExists )

            this.username = newUsername;
            this.tag = newTag;
        }
        console.log(this)
})



userSchema.pre("save", async function (){
        if(this.isModified("password")){
            const saltRounds = 10;

            const passwordHashed = await  bcrypt.hash(this.password,saltRounds);
            this.password = passwordHashed;
        }

})

module.exports = mongoose.model("User",userSchema)