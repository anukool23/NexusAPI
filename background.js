chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
    if(request.type === "apiRequest"){
        const startTime = request.startTime || Date.now();
    }
})