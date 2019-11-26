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
    var company = req.query.company;
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
    var company = req.query.company;
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
// app.post(baseURL + "/department", urlencodedParser, (req,res,next) => {
//     var query = req.query;
//     var response = {company: query.company,
//                     dept_name: query.dept_name,
//                     dept_no: query.dept_no,
//                     location: query.location
//                 };
//     if(bl.myCompany(response.company)){
//         // validate input!
//     }
//     else{
//         res.status(400).send(error("Bad Request - Entered company invalid!")); // bad request - not my company
//     }
// });
app.delete(baseURL + "/department", (req,res,next) => {
    var company = req.query.company;
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
    var company = req.query.company;
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
    var company = req.query.company;
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


 /**
  * Timecards
  */
// localhost:8080/CompanyServices/timecards?company={company}&emp_id={emp_id}
app.get(baseURL + "/timecards", (req,res,next) => {
    var company = req.query.company;
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
    var company = req.query.company;
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
    var company = req.query.company;
    if(bl.company(company)){
        var timecard_id = req.query.timecard_id
        var timecard = dl.getTimecard(timecard_id);
        if(timecard != null){
            var rows = dl.deleteTimecard(timecard_id);
            if(rows > 0){
                res.send("Timecard " + timecard_id + " deleted!");
            }
            else {
                res.status(404).send(error("Deleting timecard " + timecard_id + " failed!"));
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

