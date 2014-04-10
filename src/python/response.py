def success ( message, data, extraData={} ):
    result = { "status" : "0", "code" : "200", "message" : message, "data" : data };
    result.update(extraData)
    return { "result" : result }

def failure ( code, message ):
    return { "result" : { "status" : "1", "code" : code, "message" : message } }
