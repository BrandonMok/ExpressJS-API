// Combination of middleware and validation methods.
 var methods = {};

 // MyCompany check
methods.myCompany = function(company){
    // CHECK: company entered is mine!
    if(company != null){
        if(company != "bxm5989"){
            return false;
        }
    }
    else {
        // Company was null
        return false;
    }

    return true;
};


methods.error = function(errorMsg) {
    return {error: errorMsg};
}
methods.jsonString = function(jsonObj) {
    return JSON.stringify(jsonObj);
}
methods.jsonStringToObject = function(jsonStr){
    return JSON.parse(jsonStr);
}

exports.data = methods;