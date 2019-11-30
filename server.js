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
 * Departments
 */
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
        res.status(400).send(error("Bad Request - Entered company invalid!")); // bad request - not my company
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
            return res.json(bl.success(department));
        }
        else {
            return res.status(400).send(error(" Invalid field input(s)!"));
        }

    }
    else{
        res.status(400).send(error("Bad Request - Entered company invalid!")); // bad request - not my company
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
        res.status(400).send(error("Bad Request - Entered company invalid!")); // bad request - not my company
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
        res.status(400).send(error("Bad Request - Entered company invalid!")); // bad request - not my company
    }
});


/**
 * Employees
 */
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
        res.status(400).send(error("Bad Request - Entered company invalid!")); // bad request - not my company
    }
});
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
        res.status(400).send(error("Bad Request - Entered company invalid!")); // bad request - not my company
    }
});
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
                res.json(bl.success("Deleting employee " + emp_id + " was deleted successfully!"));
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
        res.status(400).send(error("Bad Request - Entered company invalid!")); // bad request - not my company
    }
});


 /**
  * Timecards
  */
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
        res.status(400).send(error("Bad Request - Entered company invalid!")); // bad request - not my company
    }
});
// localhost:8080/CompanyServices/timecard?company={company}&timecard_id={timecard_id}
app.get(baseURL + "/timecard", (req,res,next) => {
    var company = bl.retrieveCompany(req);
    if(bl.company(company)){
        var timecard_id = req.query.timecard_id;
        var timecard = getTimecard(timecard_id);
        if(timecard == null){
            res.status(404).send(error("Timecard "+ timecard_id +" not found!"));
        }
        res.json(bl.success(timecard));
    }
    else{
        res.status(400).send(error("Bad Request - Entered company invalid!")); // bad request - not my company
    }
});
app.delete(baseURL + "/timecard", (req,res,next) => {
    var company = bl.retrieveCompany(req);
    if(bl.company(company)){
        var timecard_id = req.query.timecard_id
        var timecard = dl.getTimecard(timecard_id);
        if(timecard != null){
            var rows = dl.deleteTimecard(timecard_id);
            if(rows > 0){
                res.json(bl.success("Timecard " + timecard_id + " deleted successfully!"));
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
        res.status(400).send(error("Bad Request - Entered company invalid!")); // bad request - not my company
    }
});





// SERVER: Creates the server to listen for requests
var server = app.listen(8080, () => {
    // Once the server is up and running
    var host = server.address().address;
    var port = server.address().port;
    console.log("Server running at http://%s:%s", host, port);
});

