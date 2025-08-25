document.addEventListener("DOMContentLoaded", () => {
    const urlEl = document.getElementById("url");
    const methodEl = document.getElementById("method");
    const bodyEl = document.getElementById("body");
    const headersEl = document.getElementById("headers");
    const sendBtn = document.getElementById("send");

    const statusEl = document.getElementById("status");
    const timeEl = document.getElementById("time");
    const respBodyEl = document.getElementById("respBody");
    const respHeadersEl = document.getElementById("respHeaders");

    const historyList = document.getElementById("historyList");
    const clearHistoryBtn = document.getElementById("clearHistory");

    const curlEl = document.getElementById("curl");
    const generateBtn = document.getElementById("generate");

    // Load history
    chrome.storage.local.get("history", (data) => {
        if (data.history) {
            data.history.forEach(addHistoryItem);
        }
    });

    // Send API request
    sendBtn.addEventListener("click", () => {
        const url = urlEl.value.trim();
        const method = methodEl.value;
        const body = bodyEl.value.trim();
        const headers = {};

        headersEl.value
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.includes(":"))
            .forEach((line) => {
                const [key, ...rest] = line.split(":");
                headers[key.trim()] = rest.join(":").trim();
            });

        const startTime = Date.now();

        chrome.runtime.sendMessage(
            { type: "apiRequest", url, method, body, headers, startTime },
            (response) => {
                if (!response) return;

                if (response.ok) {
                    statusEl.textContent = "Status : " + response.status;
                    timeEl.textContent =
                        "Time : " +
                        (response.time || Date.now() - startTime) +
                        "ms";

                    try {
                        respBodyEl.textContent = JSON.stringify(
                            JSON.parse(response.data),
                            null,
                            2
                        );
                    } catch {
                        respBodyEl.textContent = response.data;
                    }

                    respHeadersEl.textContent = JSON.stringify(
                        response.headers,
                        null,
                        2
                    );

                    // Save history
                    const entry = {
                        url,
                        method,
                        time: new Date().toLocaleTimeString(),
                    };
                    chrome.storage.local.get("history", (data) => {
                        const history = data.history || [];
                        history.unshift(entry);
                        if (history.length > 10) {
                            history.pop(); // ✅ fixed typo
                        }
                        chrome.storage.local.set({ history });
                    });
                    addHistoryItem(entry);
                } else {
                    statusEl.textContent = "Error : " + response.error;
                    timeEl.textContent = "Time : -";
                    respBodyEl.textContent = "-";
                    respHeadersEl.textContent = "-";
                }
            }
        );
    });

    // Add history item
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

    // Clear history
    clearHistoryBtn.addEventListener("click", () => {
        chrome.storage.local.set({ history: [] });
        historyList.innerHTML = "";
    });

    // Generate request from curl
    generateBtn.addEventListener("click", () => {
        parseCurl(curlEl.value);
    });

    // Function to generate request from curl
    function parseCurl(curlCommand) {
        const result = {
            url: "",
            method: "GET",
            headers: {},
            body: "",
        };

        curlCommand = curlCommand.replace(/\\\n/g, " ").trim();

        // URL
        const urlMatch = curlCommand.match(/(https?:\/\/[^\s'"]+)/i);
        if (urlMatch) {
            result.url = urlMatch[1];
            urlEl.value = result.url;
        }

        // Method (-X POST, GET etc.)
        const methodMatch = curlCommand.match(/-X\s+(\w+)/i);
        if (methodMatch) {
            result.method = methodMatch[1].toUpperCase();
        } else {
            result.method = "GET"; // default
        }
        methodEl.value = result.method;

        //Headers
        const headerRegex = /-H\s+['"]([^'"]+)['"]/gi;
        let headerMatch;
        while ((headerMatch = headerRegex.exec(curlCommand)) !== null) {
            const [key, value] = headerMatch[1].split(/:\s*(.+)/);
            if (key && value) {
                result.headers[key.trim()] = value.trim();
            }
        }
        headersEl.value = Object.entries(result.headers)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n");

        // Body (-d / --data / --data-raw)
        result.body = extractBody(curlCommand);
        bodyEl.value = result.body; // <-- you missed this
    }

    // Function to extract body
    function extractBody(curlCommand) {
        // Handles --data, --data-raw, -d (with or without $'...')
        const bodyFlag = curlCommand.match(
            /(--data(?:-raw)?|-d)\s+(\$?'.*?')/s
        );
        if (bodyFlag) {
            return bodyFlag[2]
                .replace(/^\$?'/, "") // remove leading $'
                .replace(/'$/, ""); // remove trailing '
        }
        return "";
    }
});
