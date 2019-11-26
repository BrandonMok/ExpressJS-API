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

// uniquePerCompany - makes sure entered _no is unique
methods.uniquePerCompany = function(str, company){
    var unique = "";
    if(this.myCompany(company)){
        if(!str.includes(company)){
            unique = company + str;
        }
        else {
            unique = str;
        }
    }
    else {
        unique = "";
    }
    return unique;
}

// Validate string - Makes sure string only contains letters
methods.validString = function(input){
    var onlyLetters = "/^[A-Za-z]+$/";
    var onlyLettersSpace = "/^[A-Z a-z]+$/";
    var valid = false;

    if(input.value.match(onlyLetters) || input.value.match(onlyLettersSpace)){
        valid = true;
    }

    return valid;
}
// success - commonly used to output a success json object
methods.success = function(successMsg){
    return {"success": successMsg};
}
// error function - commonly used to output a json object
methods.error = function(errorMsg) {
    return {error: errorMsg};
}
// obj -> string
methods.jsonString = function(jsonObj) {
    return JSON.stringify(jsonObj);
}
// string -> object
methods.jsonStringToObject = function(jsonStr){
    return JSON.parse(jsonStr);
}


// Date validation
methods.validateDate = function(date){

}
// timestamp validation
methods.validateTimestamp = function(timestamp){
    
}

exports.data = methods;