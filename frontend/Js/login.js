import api from "../api/api.js"; 

const Toaster = document.querySelector("holy-toaster")
const form = document.querySelector("form");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const handleLogin = async (data) =>{
    try{
        const fetchOptions = {
            method : "POST" ,
            askForRefresh : false

        }
        const response = await api("/auth/login",fetchOptions,data)
        
        

        Toaster.toast({
            status: "success",
            title: "Login",
            explanation: "It's a pleasure to have you with us!"
        });

        setTimeout(()=>{
            window.location.href = "index.html";
        },3200)
        
    }catch(e){
        const status = "Error";
        let title;
        let explanation;
        switch(e.status){
            case 401: 
                title = "Identity Crisis? 🤔";
                explanation = "Either you forgot your credentials, or you're an imposter. Which one is it?";
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
    

    const emailRegEx = /.+@.+\..+/;
    const emojiRegex = /\p{Extended_Pictographic}/u;
    const punycodeRegex = /xn--/i;
    
    
    if(!email || !password){
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
            explanation: "Might want to double-check that spelling before we move forward."

        })
        
    }

    if(emojiRegex.test(password) || password.length < 6 || punycodeRegex.test(password)){
        return Toaster.toast({
            status : "Error",
            title : "Invalid Password",
            explanation: "Needs to be 6+ characters, and yes, no emojis 🙄"
        })    
    }

    const data = {email:email,password:password};
    handleLogin(data);


})  