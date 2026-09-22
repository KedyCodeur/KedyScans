class Toaster extends  HTMLElement{

    connectedCallback(){
        this.innerHTML = 
            `<div class = "toast-outside-container  toast-base">
                <div class = "toast-inside-container" >
                    <span class="material-symbols-outlined toast-icon">warning</span>
                    <div class="toast-text">
                        <p class = "toast-title">Internal Server Error </p>
                        <p class = "toast-explanation">Some error accured from our server try again later </p>   
                    </div>
                </div>
                <div class = "toastBar"></div>
            </div>`
    
        this.toastContainer = this.querySelector(".toast-outside-container");
        this.toastIcon = this.querySelector(".toast-icon");
        this.toastTitle = this.querySelector(".toast-title");
        this.toastExplanation = this.querySelector(".toast-explanation");
     
        
        this.intervalID = null
        this.animationTime = 3200;
    }

  


    resetToast(){
       if(this.intervalID !== null) {
            clearTimeout(this.intervalID);
            this.intervalID = null;
           
       };

       this.toastContainer.classList.remove("toast-error", "toast-success","toast-warning");
       this.toastContainer.classList.add("toast-base");
    
       this.toastIcon.textContent  = "cancel";
       this.toastTitle.textContent  = "";
       this.toastExplanation.textContent  = "";
    }

    toast({status,title,explanation}){
        this.resetToast();
        this.toastContainer.classList.remove("toast-success", "toast-error", "toast-base","toast-warning");

       requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            
            if (status.toLowerCase() === "success") {
                this.toastContainer.classList.add("toast-success");
                this.toastIcon.innerHTML = "check_circle";
            } else if (status.toLowerCase() === "error") {
                this.toastContainer.classList.add("toast-error");
                this.toastIcon.innerHTML = "cancel";
            } else if (status.toLowerCase() === "warning") {
                this.toastContainer.classList.add("toast-warning");
                this.toastIcon.innerHTML = "warning";
            }

            this.toastTitle.textContent = title;
            this.toastExplanation.textContent = explanation;
        });
    });

       this.intervalID = setTimeout(()=>{
        this.resetToast();
        this.intervalID = null
       },this.animationTime)
    }

}

customElements.define("holy-toaster",Toaster);

/*  so for use it -> 


    Toaster.toast({
        status : "Error", or success Success :D
        title : "Duplicate Error",
        explanation : "Email already in use"
    })
*/