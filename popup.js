document.addEventListener('DOMContentLoaded', () =>{
    const urlEl = document.getElementById('url');
    const methodEl = document.getElementById('method');
    const bodyEl = document.getElementById('body');
    const headersEl = document.getElementById('headers');
    const sendBtn = document.getElementById('send');

    const statusEl = document.getElementById('status');
    const timeEl = document.getElementById('time');
    const respBodyEl = document.getElementById('respBody');
    const respHeadersEl = document.getElementById('respHeaders');

    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');

    //Load history on startup of extension if there is any
    chrome.storage.local.get('history',(data)=>{
        if(data.history){
            data.history.forEach(addHistoryItem);
        }
    });

    //send API request on click of send button
    sendBtn.addEventListener('click',()=>{
        const url = urlEl.value.trim();
        const method = methodEl.value;
        const body = bodyEl.value.trim();
        const headers = {};

        headersEl.value
            .split('\n')
            .map((line)=>line.trim())
            .filter((line)=> line.includes(':'))
            .forEach((line)=>{
                const [key, ...rest] = line.split(':');
                headers[key.trim()] = rest.join(':').trim();
            });

        const startTime = Date.now();

        chrome.runtime.sendMessage(
            {
                type: 'apiRequest',
                url,
                method,
                body,
                headers,
                startTime
            },
            (response)=>{
                if(!response) return;

                if(response.ok){
                    statusEl.textContent = "Status : "+ response.status;
                    timeEl.textContent = "Time : "+ (response.time || Date.now() - startTime) + "ms";

                    //Print pretty JSON
                    try{
                        respBodyEl.textContent = JSON.stringify(
                            JSON.parse(response.data),
                            null,2
                        );
                    }
                    catch{
                        respBodyEl.textContent = response.data;
                    }
                    //Print pretty headers
                    respHeadersEl.textContent = JSON.stringify(response.headers,null,2);

                    //Save to history
                    const entry = {
                        url,
                        method,
                        time:new Date().toLocaleTimeString()
                    };
                    chrome.storage.local.get('history',(data)=>{
                        const history = data.history || [];
                        history.unshift(entry);
                        if(history.length > 10){
                            histry.pop();
                        }
                        chrome.storage.local.set({history})
                    });
                    addHistoryItem(entry);
                }else{
                    statusEl.textContent = 'Error : '+response.error;
                    timeEl.textContent = 'Time : -';
                    respBodyEl.textContent = '-';
                    respHeadersEl.textContent = '-';
                }
            }
        );
    });

    // --- Add history item ---
    function addHistoryItem(entry) {
        const li = document.createElement("li");
        li.textContent = `[${entry.method}] ${entry.url} (${entry.time})`;
        li.style.cursor = "pointer";
        li.addEventListener("click", () => {
            urlEl.value = entry.url;
            methodEl.value = entry.method;
        });
        historyList.appendChild(li);
    }

    // --- Clear history ---
    clearHistoryBtn.addEventListener("click", () => {
        chrome.storage.local.set({ history: [] });
        historyList.innerHTML = "";
    });

})