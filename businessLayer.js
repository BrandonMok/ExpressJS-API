// Data Layer
var DataLayer = require("./companydata/index.js");
var dl = new DataLayer("bxm5989");
var moment = require("moment");

// Combination of middleware, validation, and constants
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
// Reusable error response message function
methods.errorResponse = function(res, status, msg){
    return res.status(status).send(methods.error(msg));
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


    // console.log("In validateDate():" + validateDate);
    // console.log(passedDate);

    // M-F basis 
    // Cannot be a day > than maximum days of that month
    if( (pDay >= 1 && pDay <= 5) &&
        (pDayOfMonth > 0 && pDayOfMonth <= pMaxDays) &&
        passedDate.isSameOrBefore(current_date)
    ){
        valid = true;   // is valid date
    }

    return valid;
}
// timestamp validation
methods.validateTimestamp = function(emp_id, start_time, end_time){
    var today = moment();
    var startTime = moment(start_time);
    var endTime = moment(end_time);

    var weekAgo = today.subtract(7,'days').calendar();

    //console.log(startTime.format().split("T")[0].toString());
    //console.log(startTime.format("YYYY-MM-DD"));
    // var testing = startTime.format("YYYY-MM-DD");
    // console.log(testing);
    // console.log(testing.day());


    // console.log(startTime.format("YYYY-MM-DD"));
    // console.log(endTime.format("YYYY-MM-DD"));

    // VALIDATE date portion of timestamp
    if(!methods.validateDate(startTime.format().split("T")[0].toString()) || !methods.validateDate(endTime.format().split("T")[0].toString())){
        return false;
    }    

    // starting time cannot be after today and not before a week ago
    if(startTime.isAfter(today) || startTime.isBefore(weekAgo)){
        return false;
    }

    /**
     * endTime needs to be on the same day as startTime
     * endTime needs to be atleast 1 hour > than startTime
     */
    if(
        (startTime.date() != endTime.date()) ||
        (startTime.year() != endTime.year()) ||
        (startTime.day() != endTime.day()) ||
        (endTime.isBefore(startTime) || (startTime.hour() >= endDate.hour() + 1))
    ){
        return false;
    }

    // Time must be within 06:00:00 - 18:00:00
    if(
        (startTime.hour() < 6 || startTime.hour() > 18) ||
        (endTime.hour() < 6 || endTime.hour() > 18) ||
        (startTime.hour() == endTime.hour())
    ){
        return false;
    }

    // startTime can't be on the same day as any other startTimes for that employee
    var allTimecards = dl.getAllTimecard(emp_id);
    for(var tc in allTimecards){
        if(tc.getStartTime().isSame(startTime)){
            return false;
        }
    }

    return true;
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
methods.validateTimecard = function(tc, company, action){
    var timecard = dl.getTimecard(tc.getId());  // get Timecard
    if(action == "PUT"){
        if(!methods.notNull(timecard)){
            return null;
        }
    }
    else if (action == "POST"){
        if(methods.notNull(timecard)){
            return null;
        }
    }

    // Emp_id on timecard must be that of an existing employee
    var employee = dl.getEmployee(tc.getEmpId());   // GET employee
    if(!methods.notNull(employee)){
        return null;
    }

    // VALIDATE timestamps (start_time & end_time)
    if(!methods.validateTimestamp(tc.getEmpId(), tc.getStartTime(), tc.getEndTime())){
        return null;
    }

    return tc;
}

exports.data = methods;