chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "apiRequest") {
        const startTime = request.startTime || Date.now();

        fetch(request.url, {
            method: request.method,
            headers: request.headers,
            body: request.method !== "GET" ? request.body : undefined,
        })
            .then(async (res) => {
                const headers = {};
                res.headers.forEach((value, key) => {
                    headers[key] = value;
                });

                const text = await res.text();

                sendResponse({
                    ok: true,
                    status: `${res.status} ${res.statusText}`,
                    headers,
                    data: text,
                    time: Date.now() - startTime,
                });
            })
            .catch((error) => {
                sendResponse({
                    ok: false,
                    error: error.message || "Request failed",
                });
            });

        return true; // keep message channel open for async response
    }
});
