// Data Layer
var DataLayer = require("./companydata/index.js");
var dl = new DataLayer("bxm5989");
const baseURL = "/CompanyServices";

// Express + middleware
var express = require("express");
var app = express();    // instance of express
var morgan = require('morgan');
app.use(morgan('dev'));
var urlencodedParser = express.urlencoded({extended: false});   // another middleware to encode form input (POST)     
var incomingJsonParser = express.json();                        // middleware to handle incoming json string (PUT)

// Business Layer
var bl = require("./businessLayer.js").data;    
var error = bl.error;                

/**
 * On server startup, send to default path of /CompanyServices
 */
app.get("/", (req,res,next) => {
    res.redirect(baseURL);
});

/**
 * Company
 */
// app.delete(baseURL + "/company", (req,res,next) => {

// });


/**
 * Departments
 */
// GET
// localhost:8080/CompanyServices/departments?company={company}
app.get(baseURL + "/departments", (req,res,next) => {
    var company = bl.retrieveCompany(req);
    if(bl.myCompany(company)){
        var departments = dl.getAllDepartment(company);    // get all Departments
        if(departments == null){ 
            res.status(404).send(error("Departments not found!")); 
        }

        res.json(bl.success(departments));
    }
    else{
        res.status(400).send(error("Bad Request - Entered company invalid!")); // bad request - not my company
    }
});
// GET
// localhost:8080/CompanyServices/department?company={company}&dept_id={dept_id}
app.get(baseURL + "/department", (req,res,next) => {
    var company = bl.retrieveCompany(req);
    if(bl.myCompany(company)){
        var deptID = req.query.dept_id;

        var department = dl.getDepartment(company, deptID);
        if(department == null){ 
            res.status(404).send(error("Department doesn't exist!")); 
        }
    
        res.json(bl.success(department));
    }
    else{
        bl.errorResponse(res, 400, "Bad Request - Entered company is invalid!");    // reusable function to return error
    }
});
// POST
app.post(baseURL + "/department", urlencodedParser, (req,res) => {
    var response = {company: req.body.company,
                    dept_name: req.body.dept_name,
                    dept_no: req.body.dept_no,
                    location: req.body.location
                };
    
    if(bl.myCompany(response.company)){
        var department = new dl.Department(response.company, response.dept_name, response.dept_no, response.location);
        department = bl.validateDepartment(department, response.company, "POST");
        if(department != null){
            department = dl.insertDepartment(department);
            if(bl.notNull(department)){
                res.json(bl.success(department));  // return newly inserted department obj
            }
            else {
                res.status(400).send(error("Inserting department failed!"));
            }
        }
        else {
            res.status(400).send(error(" Invalid field input(s)!"));
        }

    }
    else{
        bl.errorResponse(res, 400, "Bad Request - Entered company is invalid!");    // reusable function to return error
    }
});
// PUT
app.put(baseURL + "/department", incomingJsonParser, (req,res,next) => {
    var response = {dept_id: req.body.dept_id,
                    company: req.body.company,
                    dept_name: req.body.dept_name,
                    dept_no: req.body.dept_no,
                    location: req.body.location
                };       

    var keys = Object.keys(response);   // all object keys

    var company = response.company;
    if(bl.myCompany(company)){
        var dept_id = response.dept_id;
        var department = dl.getDepartment(company, dept_id);    // get the department trying to update
        if(bl.notNull(department)){
            for(var i = 0; i < keys.length; i++){
                if(keys[i] != 0 && keys[i] != null){
                    switch(keys[i].toLowerCase()){
                        case "dept_name":
                            if(bl.notNull(response.dept_name)){
                                department.setDeptName(response.dept_name);
                            }
                            break;
                        case "dept_no":
                            if(bl.notNull(response.dept_no)){
                                department.setDeptNo(response.dept_no);
                            }
                            break;
                        case "location":
                            if(bl.notNull(response.location)){
                                department.setLocation(response.location);
                            }
                            break;
                    }
                }
            }

            // VALIDATE: Check modified department obj is valid
            department = bl.validateDepartment(department, company, "PUT");

            if(bl.notNull(department)){
                department = dl.updateDepartment(department);       // UPDATE
                if(bl.notNull(department)){
                    res.json(bl.success(department));             // return updated department
                }
                else {
                    res.status(400).send(error("Update failed on department " + dept_id + "!"));
                }
            }
            else{
                res.status(400).send(error("Invalid field(s) entered on update!"));
            }
        }
        else {
            res.status(404).send(error("Department " + dept_id + " not found to update!"));
        }
    }
    else{
        bl.errorResponse(res, 400, "Bad Request - Entered company is invalid!");    // reusable function to return error
    }
});
// DELETE
app.delete(baseURL + "/department", (req,res,next) => {
    var company = bl.retrieveCompany(req);
    if(bl.myCompany(company)){
        var dept_id = req.query.dept_id;
        var department = dl.getDepartment(company, dept_id);
        if(department != null){
            /**
             * Delete timecard 
             * Delete Employees
             * Delete department
             */
            var employees = dl.getAllEmployee(company); // get ALL employees 
            if(employees.length > 0){
                for(var i = 0; i < employees.length; i++){
                    if(employees[i].getDeptId() == department.getId()){
                        var timecards = dl.getAllTimecard(employees[i].getId());
                        if(timecards.length > 0){
                            for(var j = 0; j < timecards.length; j++){
                                dl.deleteTimecard(timecards[j].getId());
                            }
                        }

                        dl.deleteEmployee(employees[i].getId()); // delete employee
                    }
                }
            }
            
            // Delete Department
            var rows = dl.deleteDepartment(company, dept_id);
            if(rows > 0){
                res.json(bl.success("Department " + dept_id + " from " + company + " deleted!")); 
            }
            else {
                res.status(404).send(error(rows + " rows affected! Delete failed!"));
            }
        }
        else {
            res.status(404).send(error("Department " + dept_id + " trying to delete doesn't exist!"));
        }
    }
    else{
        bl.errorResponse(res, 400, "Bad Request - Entered company is invalid!");    // reusable function to return error
    }
});


/**
 * Employees
 */
// GET
// localhost:8080/CompanyServices/employees?company={company}
app.get(baseURL + "/employees", (req,res,next) => {
    var company = bl.retrieveCompany(req);
    if(bl.myCompany(company)){
        response = dl.getAllEmployee(company);
        if(response == null){ 
            res.status(404).send(error("No employees found!")); 
        }
    
        res.json(bl.success(response));
    }
    else{
        bl.errorResponse(res, 400, "Bad Request - Entered company is invalid!");    // reusable function to return error
    }
});
// GET
// localhost:8080/CompanyServices/employee?company={company}&emp_id={emp_id}
app.get(baseURL + "/employee", (req,res,next) => {
    var company = bl.retrieveCompany(req);
    if(bl.myCompany(company)){
        var emp_id = req.query.emp_id;

        var employee = dl.getEmployee(emp_id);
        if(employee == null){ 
            res.status(404).send(error("Employee "+ emp_id +" not found!")); 
        }
    
        res.json(bl.success(employee));
    }
    else{
        bl.errorResponse(res, 400, "Bad Request - Entered company is invalid!");    // reusable function to return error
    }
});
// POST
app.post(baseURL + "/employee", urlencodedParser, (req,res) => {
    var response = {company: req.body.company,
                    emp_name: req.body.emp_name,
                    emp_no: req.body.emp_no,
                    hire_date: req.body.hire_date,
                    job: req.body.job,
                    salary: req.body.salary,
                    dept_id: req.body.dept_id,
                    mng_id: req.body.mng_id
                };

    if(bl.myCompany(response.company)){
        var employee = new dl.Employee(response.emp_name, response.emp_no, 
                                    response.hire_date, response.job, 
                                    response.salary, response.dept_id, response.mng_id
                                );
       
        var validEmp = bl.validateEmployee(employee, response.company, "POST"); // VALIDATE
        if(bl.notNull(validEmp)){
            validEmp = dl.insertEmployee(validEmp); // INSERT
            if(bl.notNull(validEmp)){
                res.json(bl.success(validEmp));     // return newly inserted employee obj
            }
            else {
                res.status(400).send(error("Inserting employee failed!"));
            }
        }
        else {
            res.status(400).send(error("Invalid field input(s)!"));
        }
    }
    else{
        bl.errorResponse(res, 400, "Bad Request - Entered company is invalid!");    // reusable function to return error
    }
});
// PUT
app.put(baseURL + "/employee", incomingJsonParser, (req,res,next) => {
    var response = {company: req.body.company,
                    emp_id: req.body.emp_id,
                    emp_name: req.body.emp_name,
                    emp_no: req.body.emp_no,
                    hire_date: req.body.hire_date,
                    job: req.body.job,
                    salary: req.body.salary,
                    dept_id: req.body.dept_id,
                    mng_id: req.body.mng_id
                };
    var keys = Object.keys(response);
    var company = response.company;

    if(bl.myCompany(company)){
        var emp_id = response.emp_id;           // store emp_id
        var employee = dl.getEmployee(emp_id);  // get employee trying to update
        if(bl.notNull(employee)){
            for(var i = 0; i < keys.length; i++){
                if(keys[i] != 0 && keys[i] != null){
                    switch(keys[i].toLowerCase()){
                        case "emp_name":
                            if(bl.notNull(response.emp_name)){
                                employee.setEmpName(response.emp_name);
                            }
                            break;
                        case "emp_no":
                            if(bl.notNull(response.emp_no)){
                                employee.setEmpNo(response.emp_no);
                            }
                            break;
                        case "hire_date":
                            if(bl.notNull(response.hire_date)){
                                employee.setHireDate(response.hire_date);
                            }
                            break;
                        case "job":
                            if(bl.notNull(response.job)){
                                employee.setJob(response.job);
                            }
                            break;
                        case "salary":
                            if(bl.notNull(response.salary)){
                                employee.setSalary(response.salary);
                            }
                            break;
                        case "dept_id":
                            if(bl.notNull(response.dept_id)){
                                employee.setDeptId(response.dept_id);
                            }
                            break;
                        case "mng_id":
                            if(bl.notNull(response.mng_id)){
                                employee.setMngId(response.mng_id);
                            }
                            break;
                    }// end switch
                }// end if
            }// end for

            employee = bl.validateEmployee(employee, company, "PUT"); // VALIDATE
            if(bl.notNull(employee)){
                employee = dl.updateEmployee(employee); // UPDATE
                if(bl.notNull(employee)){
                    res.json(bl.success(employee));
                }
                else {
                    res.status(400).send(error("Update failed on employee"));
                }
            }
            else {
                res.status(400).send(error("Invalid input field(s)!"));
            }
        }
        else {
            res.status(404).send(error("Employee " + emp_id + " not found to update!"));
        }
    }
    else{
        bl.errorResponse(res, 400, "Bad Request - Entered company is invalid!");    // reusable function to return error
    }
});
// DELETE
app.delete(baseURL + "/employee", (req,res,next) => {
    var company = bl.retrieveCompany(req);
    if(bl.myCompany(company)){
        var emp_id = req.query.emp_id;
        var employee = dl.getEmployee(emp_id);
        if(employee != null){
            // Delete employee timecards if they have any!
            var timecards = dl.getAllTimecard(emp_id);
            if(timecards.length > 0){
                for(var i = 0; i < timecards.length; i++){
                    dl.deleteTimecard(timecards[i].getId());
                }
            }

            // Delete employee
            var rows = dl.deleteEmployee(emp_id);
            if(rows > 0){
                res.json(bl.success("Deleted employee " + emp_id + " successfully!"));
            }
            else {
                res.status(500).send(error("Deleting employee " + emp_id + " failed to delete!"));
            }
        }
        else {
            res.status(404).send(error("Employee " + emp_id + " does not exist!"));
        }
    }
    else{
        bl.errorResponse(res, 400, "Bad Request - Entered company is invalid!");    // reusable function to return error
    }
});


 /**
  * Timecards
  */
// GET
// localhost:8080/CompanyServices/timecards?company={company}&emp_id={emp_id}
app.get(baseURL + "/timecards", (req,res,next) => {
    var company = bl.retrieveCompany(req);
    if(bl.myCompany(company)){
        var emp_id = req.query.emp_id;
        var timecards = dl.getAllTimecard(emp_id);
        if(timecards == null){
            res.status(404).send(error("Timecards for "+ emp_id  +" not found!")); 
        }
        res.json(bl.success(timecards));
    }
    else{
        bl.errorResponse(res, 400, "Bad Request - Entered company is invalid!");    // reusable function to return error
    }
});
// GET
// localhost:8080/CompanyServices/timecard?company={company}&timecard_id={timecard_id}
app.get(baseURL + "/timecard", (req,res,next) => {
    var company = bl.retrieveCompany(req);
    if(bl.myCompany(company)){
        var timecard_id = req.query.timecard_id;        // store timecard_id
        var timecard = dl.getTimecard(timecard_id);     // GET the timecard
        if(timecard == null){
            res.status(404).send(error("Timecard "+ timecard_id +" not found!"));
        }
        res.json(bl.success(timecard));
    }
    else{
        res.status(400).send(error("Bad Request - Entered company invalid!")); // bad request - not my company
    }
});
// POST
app.post(baseURL + "/timecard", urlencodedParser, (req,res,next) => {
    var response = {company: req.body.company,
                    emp_id: req.body.emp_id,
                    start_time: req.body.start_time,
                    end_time: req.body.end_time
                    };

    if(bl.myCompany(response.company)){
        var timecard = new dl.Timecard(response.start_time,
                                    response.end_time,
                                    response.emp_id);
        
        var validTC = bl.validateTimecard(timecard, response.company, "POST");
        if(bl.notNull(validTC)){
            validTC = dl.insertTimecard(validTC); // INSERT
            if(bl.notNull(validTC)){
                res.json(bl.success(validTC));
            }
            else {
                res.status(400).send(error("Inserting timecard failed!"));
            }
        }
        else {
            res.status(400).send(error("Invalid input(s)!"));
        }
    }
    else{
        bl.errorResponse(res, 400, "Bad Request - Entered company is invalid!");    // reusable function to return error
    }
});
//PUT
app.put(baseURL + "/timecard", incomingJsonParser, (req,res) => {

});
// DELETE
app.delete(baseURL + "/timecard", (req,res,next) => {
    var company = bl.retrieveCompany(req);
    if(bl.myCompany(company)){
        var timecard_id = req.query.timecard_id         // store timecard_id
        var timecard = dl.getTimecard(timecard_id);     // get timecard
        if(timecard != null){   
            var rows = dl.deleteTimecard(timecard_id);  // DELETE
            if(rows > 0){
                res.json(bl.success("Deleted timecard " + timecard_id + " successfully!"));
            }
            else {
                res.status(500).send(error("Deleting timecard " + timecard_id + " failed!"));
            }
        }  
        else {
            res.status(404).send(error("Timecard " + timecard_id + " trying to delete doesn't exist!"));
        }
    }
    else{
        bl.errorResponse(res, 400, "Bad Request - Entered company is invalid!");    // reusable function to return error
    }
});





// SERVER: Creates the server to listen for requests
var server = app.listen(8080, () => {
    // Once the server is up and running
    var host = server.address().address;
    var port = server.address().port;
    console.log("Server running at http://%s:%s", host, port);
});

