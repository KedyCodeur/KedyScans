const form = document.querySelector("form");

const inputs = document.querySelectorAll(".char")

const getCode = (inputs)=>{
    let code = "";
    inputs.forEach(input => {
        code += input.value
    });
    return code
}

let inputsSelected = false;

const selectInputs = (inputs) =>{
            inputs.forEach( input => {
                input.classList.add("selected")
                }
            );
}

const blurInputs = (inputs) =>{
    inputs.forEach( input => {
        input.classList.remove("selected")
        }
    );
}

const clearInputs = (inputs) => {
    inputs.forEach( input => {
        input.value = ""
    }); 
}

inputs.forEach((input,i) => {
    input.addEventListener("keydown",(e) => {
        
        if(e.key === "Backspace" || e.key === "Delete"){
                
            if(!inputsSelected){
                e.preventDefault();
                inputs[i].value = "";
                inputs[i-1]?.select();
                return;
            }else{
                clearInputs(inputs)
                inputs[0].select();
                return;
            }
        }



        
        const isPrintableChar = e.key.length === 1;    
        if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a"){
            if(inputsSelected)return;
            selectInputs(inputs)
            inputsSelected = true
            return;
        }
                     
        if(inputsSelected && isPrintableChar){
            e.preventDefault();
            clearInputs(inputs)
            inputs[0].value = e.key
            inputs[i === 0 ? 1: 0].select();
            return;
        }else if (!inputsSelected && isPrintableChar){
            e.preventDefault();
            inputs[i].value = e.key;
            inputs[i+1]?.select();
            return;
        }



        

    })

    input.addEventListener("blur", ()=> {
        blurInputs(inputs)
        inputsSelected = false
    })

 
})

form.addEventListener("submit",(e)=>{
    e.preventDefault()
    const code = getCode(inputs);
    
})  