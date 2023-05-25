
const CryptoJS = require("crypto-js");

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 32; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
  
    return text;
}

function fullUrl(url, parameters) {
    if (!Array.isArray(parameters) || parameters.length <= 0) {
        return url;
    }

    let params = []
    parameters.forEach(element => {
        params.push(element.name + '=' + element.value)
    });
    return url + '?' + params.join('&');
}

module.exports.requestHooks = [
    context => {
      if (context.request.getEnvironmentVariable('enable-plugin-tom')) {
        const tomSecretKey = context.request.getEnvironmentVariable('tom-secret-key')
        const tomClientKey = context.request.getEnvironmentVariable('tom-client-key')
        const appId = context.request.getEnvironmentVariable('tom-app-id')
        const body = context.request.getBody()
        const url = context.request.getUrl()
        const parameters = context.request.getParameters()
        const urlFull = fullUrl(url, parameters)

        if (context.request.getMethod() == "GET" || context.request.getMethod() == "DELETE" 
            || (typeof body == "object" && JSON.stringify(body).length <= 2)
            || (typeof body == "array" && JSON.stringify(body).length <= 2)
            || (!context.request.getHeader('content-type'))) {
            var bodyHash = "";    
        } else {
            var bodyHash = body.text
        }

        let ts = + new Date();
        ts = ("" + ts).substring(0,10);

        const nonce = makeid();

        const salt = tomSecretKey
            + ts
            + appId
            + CryptoJS.MD5( bodyHash + encodeURI(urlFull)) // payload + url
            + nonce;
  
  
        const hash = CryptoJS.SHA256(salt).toString();

        context.request.addHeader('X-TOM-API-HASH',hash)
        context.request.addHeader('X-TOM-RTS',ts)
        context.request.addHeader('X-TOM-NONCE', nonce)
        context.request.addHeader('X-TOM-APP',appId)
        context.request.addHeader('X-TOM-API-KEY', tomClientKey)
      }
    }
  ];