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

    chrome.storage.local.get('history',(data)=>{
        if(data.history){
            data.history.forEach(addHistoryItem);
        }
    });

})