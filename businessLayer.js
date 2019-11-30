// Data Layer
var DataLayer = require("./companydata/index.js");

// Combination of middleware and validation methods.
var methods = {};

// Reusable function to retrieve company from QUERY parameters 
methods.retrieveCompany = function(request){
    var company = request.query.company;
    return company;
} 

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
    if(methods.myCompany(company)){
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
// Not null - commonly used to verify object isn't null
methods.notNull = function(obj){
    var notNull = false;
    if(obj != null){
        notNull = true;
    }
    return notNull;
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
    // var valid = false;
    // return valid;
}
// timestamp validation
methods.validateTimestamp = function(timestamp){
    
}


/**  OBJECT VALIDATION  */
// Department validation
methods.validateDepartment = function(dep, company, action){
    var dl = new DataLayer("bxm5989");

    var department = dl.getDepartment(company, dep.getId());    // get specific department wanting to modify
    var allDepartments = dl.getAllDepartment(company);          // get ALL departments

    if(action == "PUT"){
        if(!this.notNull(department)){
            // On PUT, don't want department to be null 
            return null;
        }
    }
    else if(action == "POST"){
        if(this.notNull(department)){
            // On POST, don't want the department to have already existed
            return null;
        }
    }

    // Dept_no needs to be unique - use function to verify/handle uniqueness!
    var dep_no = methods.uniquePerCompany(dep.getDeptNo(), company);

    // Iterate through all departments to find if or if not dep already exists
    for(var i = 0; i < allDepartments.length; i++){
        if(allDepartments[i].getDeptNo() == dep_no){
            /**
             * POST: Returns null if dept_no is already in use
             * PUT: Return null if there's a department that already exists and uses this dept_no
             */
            if(action == "POST"){
                return null;
            }
            else if (action == "PUT"){
                if(dep.getId() != allDepartments[i].getId()){
                    return null;
                }
            }
        }
    }

    // If there wasn't a department found w/the unique dept_no
    if(dep_no != dep.getDeptNo()){
        dep.setDeptNo(dep_no);
    }

    return dep;
}
// Employee validation
methods.validateEmployee = function(employee, company, action){

}
// Timecard Validation
methods.validateTimecard = function(timecard, company, action){

}

exports.data = methods;