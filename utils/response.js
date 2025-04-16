export const handleResponse = (res, statusCode, message, data = null) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message, data }));
    return res;
}