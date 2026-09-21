
import api from "../api/api.js"; // en üstte

const Toaster = document.querySelector("holy-toaster")
const form = document.querySelector("form");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const passwordConfirmInput = document.getElementById("passwordConfirm");


const createUser = async (user) =>{

    const fetchOptions ={
        method : "POST"
    }

    try{
        const response = await api("/auth/register",fetchOptions,user )

        Toaster.toast({
            status: "success",
            title: "Account Created",
            explanation: "It's a pleasure to have you with us!"
        });

    }catch(e){
        console.log("wtf")
        const status = "Error";
        let title;
        let explanation;
        switch(e.status){
            case 409 : 
                title = "Email already in use";
                explanation = "ah you forgot your account.. good luck";
                break;
            case 400 :
                title = "Invalid Data";
                explanation = "Hmm looks like you are trying something ?";
                break;
                          
            default :
                title = "Connection Error"
                explanation = "Unable to connect to the server. Please check your connection and try again.";
                break;
        }
        
        Toaster.toast({
            status,
            title,
            explanation
        });
    }

}

form.addEventListener("submit",(e)=>{
    e.preventDefault()

    const email = emailInput.value?.trim() || "";
    const password = passwordInput.value?.trim() || "";
    const passwordConfirm = passwordConfirmInput.value?.trim() || "";

    const emailRegEx = /.+@.+\..+/;
    const emojiRegex = /\p{Extended_Pictographic}/u;
    const punycodeRegex = /xn--/i;
    
    
    if(!email || !password || !passwordConfirm){
        return Toaster.toast({
            status : "Error",
            title : "Invalid Data",
            explanation : "Hmm looks like you are trying something ?"
        })
    }

    if(!emailRegEx.test(email) || emojiRegex.test(email) || punycodeRegex.test(email)){
        return Toaster.toast({
            status : "Error",
            title :  "Invalid Email",
            explanation :  "We'd love a real email address so we can actually reach you <333"

        })
        
    }

    if(emojiRegex.test(password) || password.length < 6 || punycodeRegex.test(password)){
        return Toaster.toast({
            status : "Error",
            title : "Invalid Password",
            explanation: "Needs to be 6+ characters, and yes, no emojis 🙄"
        })    
    }

    if(emojiRegex.test(passwordConfirm) || passwordConfirm.length < 6 || punycodeRegex.test(password)){
        return Toaster.toast({
            status : "Error",
            title : "Invalid Password",
            explanation: "Needs to be 6+ characters, and yes, no emojis 🙄"
        })    
    }

    if(password !== passwordConfirm){
        return Toaster.toast({
            status : "Error",
            title : "Passwords Don't Match",
            explanation: "Uhh... those don't match, buddy."
        })    
    }
    
    const newUser = {email,password}
    createUser(newUser);
})  

