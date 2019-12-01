// Data Layer
var DataLayer = require("./companydata/index.js");
var dl = new DataLayer("bxm5989");
var moment = require("moment");

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
    var onlyLetters = /^[A-Za-z]+$/;
    var onlyLettersSpace = /^[A-Z a-z]+$/;
    var valid = false;

    if(input.match(onlyLetters) || input.match(onlyLettersSpace)){
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
methods.validateDate = function(validateDate){
    var valid = false;

    // Passed in date
    var passedDate = moment(validateDate);
    var pDay = passedDate.day();                // day of week  (#)
    var pDayOfMonth = passedDate.date();        // day of month (#)
    var pMaxDays = passedDate.daysInMonth();    // max # of days in month

    // current date
    //var current_date = moment().toDate().getTime();
    //var current_date = moment().format('L');   //12/01/2019
    var current_date = moment();

    if( (pDay >= 2 && pDay <= 6) &&
        (pDayOfMonth > 0 && pDayOfMonth <= pMaxDays) &&
        passedDate.isSameOrBefore(current_date)
    ){
        valid = true;   // is valid date
    }

    return valid;
}
// timestamp validation
methods.validateTimestamp = function(timestamp){
    
}


/**  OBJECT VALIDATION  */
// Department validation
methods.validateDepartment = function(dep, company, action){
    // var dl = new DataLayer("bxm5989");

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
methods.validateEmployee = function(emp, company, action){
    var employee = dl.getEmployee(emp.getId());

    if(action == "PUT"){
        if(!methods.notNull(employee)){
            // on PUT, don't want employee obj to not exist
            return null;
        }
    }
    else if (action == "POST"){
        if(methods.notNull(employee)){
            // on POST, don't want employee obj to exist
            return null;
        }
    }

    // Dept_ID check - must be an existing department
    var department = dl.getDepartment(company, emp.getDeptId());
    if(!methods.notNull(department)){
        return null;
    }

    /**
     * mng_id CHECK
     * mng_id must be an existing employee's emp_id
     * Set to 0 if it's the first employee or to another employee that doesn't have a manager yet
     */
    var allEmployees = dl.getAllEmployee(company);
    if(allEmployees.length == 0){
        emp.setMngId(0);
    }
    else {
        var empExists = false;
        var tempEmployee = null;

        for(var i = 0; i < allEmployees.length; i++){
            // Check to see if there's an employee with the entered mng_id
            if(allEmployees[i].getId() == emp.getMngId()){
                empExists = true;
                break;
            }
            // Look for an employee who doesn't have a manager
            if(allEmployees[i].getMngId() == 0){
                tempEmployee = allEmployees[i];
            }
        }

        // CHECK: if employee who's mng_id isn't an existing employee
        if(!empExists){
            if(action == "PUT"){
                if(emp.getMngId() == 0){
                    // Set the emp's mng_id to an existing employee 
                    emp.setMngId(tempEmployee.getId());
                }
                else {
                    return null;
                }
            }
        }

        // CHECK: emp_no
        // emp_no must be unique per company - use uniquePerCompany()
        var emp_no = methods.uniquePerCompany(emp.getEmpNo(), company);
        for(var j = 0; j < allEmployees.length; j++){
            if(allEmployees[j].getEmpNo() == emp_no){
                /**
                 * POST: returns null if there's an existing employee already w/the emp_no
                 * PUT: returns null if this employee obj isn't the same as the one passed into function
                 */
                if(action == "POST"){
                    return null;
                }
                else if(action == "PUT"){
                    if(emp.getId() != allEmployees[j].getId()){
                        return null;
                    }
                }
            }
        }

        //if no employee found w/unique emp_no
        if(emp_no != emp.getEmpNo()){
            emp.setEmpNo(emp_no);
        }


        // if emp_name & job aren't valid strings w/o numbers
        if(!methods.validString(emp.getEmpName()) || !methods.validString(emp.getJob())){
            return null;
        }

        // if hire_date isn't valid
        if(!methods.validateDate(emp.getHireDate())){
            return null;
        }
    }

    return emp;
}
// Timecard Validation
methods.validateTimecard = function(timecard, company, action){

}

exports.data = methods;