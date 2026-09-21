const BASE_URL = "http://localhost:3554";

const refresh = async () => {

    try{
        const request = await fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include" 
        });
        return request.ok;
    }catch(e){
        console.log(e)
        return false
    }
    
}

async function api(endpoint,options = {},data) {
    
    
    const fetchOptions = {
        headers : {"Content-Type": "application/json",...(options?.headers) || {}},
        method : options.method,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include"
    }
    
    let request = await fetch(`${BASE_URL}${endpoint}`,fetchOptions)
    
    if(request.status == 401 && options.askForRefresh === true){

        const isRefreshed = await refresh();

        if(isRefreshed){
            request = await fetch(`${BASE_URL}${endpoint}`,fetchOptions);
            console.log(request.status)
        }

    }

    if(!request.ok){
        const errorBody = await request.json();
        const err = new Error(errorBody.e);
        err.status = request.status;
        throw err;
    } 
    
    const backendData = await request.json();
    return backendData
}

export default api;