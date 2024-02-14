export const logRequest = (request: any) => {
    const logObject = {
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body
    }
    return logObject
}
