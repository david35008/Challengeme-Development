module.exports = [
    {
        id: 1,
        webhookId: 8,
        statusCode: 400,
        message: "Request failed with status code 400",
        data: {
            name: "Error",
            stack: "Error: Request failed with status code 400\n    at createError (C:\\Users\\david\\Documents\\GitHub\\Challengeme-Development\\server\\node_modules\\axios\\lib\\core\\createError.js:16:15)\n    at settle (C:\\Users\\david\\Documents\\GitHub\\Challengeme-Development\\server\\node_modules\\axios\\lib\\core\\settle.js:17:12)\n    at IncomingMessage.handleStreamEnd (C:\\Users\\david\\Documents\\GitHub\\Challengeme-Development\\server\\node_modules\\axios\\lib\\adapters\\http.js:244:11)\n    at IncomingMessage.emit (events.js:327:22)\n    at endReadableNT (_stream_readable.js:1220:12)\n    at processTicksAndRejections (internal/process/task_queues.js:84:21)",
            config: {
                url: "http://localhost:8092/api/v1/webhook",
                data: "{\"eventName\":\"submittedChallenge\",\"userId\":1,\"userName\":\"suvelocity\",\"challengeName\":\"React Recoil\",\"submissionState\":\"SUCCESS\",\"team\":\"teamC\"}",
                method: "post",
                headers: {
                    Accept: "application/json, text/plain, /",
                    [`User-Agent`]: "axios/0.20.0",
                    ["Content-Type"]: "application/json;charset=utf-8",
                    ["Authorization"]: "token 1234567abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
                    ["Content-Length"]: 143
                },
                timeout: 0,
                maxBodyLength: -1,
                xsrfCookieName: "XSRF-TOKEN",
                xsrfHeaderName: "X-XSRF-TOKEN",
                maxContentLength: -1,
                transformRequest: [
                    null
                ],
                transformResponse: [
                    null
                ]
            },
            message: "Request failed with status code 400"
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 2,
        webhookId: 18,
        statusCode: 500,
        message: "connect ECONNREFUSED 127.0.0.1:8094",
        data: {
            code: "ECONNREFUSED",
            name: "Error",
            stack: "Error: connect ECONNREFUSED 127.0.0.1:8094\n    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)",
            config: {
                url: "http://localhost:8094/api/v1/webhook",
                data: "{\"eventName\":\"submittedChallenge\",\"userId\":1,\"userName\":\"suvelocity\",\"challengeName\":\"React Recoil\",\"submissionState\":\"SUCCESS\",\"team\":\"teamC\"}",
                method: "post",
                headers: {
                    Accept: "application/json, text/plain, */*",
                    ["User-Agent"]: "axios/0.20.0",
                    ["Content-Type"]: "application/json;charset=utf-8",
                    ["Authorization"]: "token asdsad",
                    ["Content-Length"]: 143
                },
                timeout: 0,
                maxBodyLength: -1,
                xsrfCookieName: "XSRF-TOKEN",
                xsrfHeaderName: "X-XSRF-TOKEN",
                maxContentLength: -1,
                transformRequest: [
                    null
                ],
                transformResponse: [
                    null
                ]
            },
            message: "connect ECONNREFUSED 127.0.0.1:8094"
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];

