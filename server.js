// Data Layer
var DataLayer = require("./companydata/index.js");
var dl = new DataLayer("bxm5989");
const baseURL = "/CompanyServices";

// Express + middleware
var express = require("express");
var app = express();    // instance of express
var morgan = require('morgan');
app.use(morgan('dev'));
var urlencodedParser = express.urlencoded({extended: false});   // another middleware

// Business Layer
var bl = require("./businessLayer.js").data;    
var error = bl.error;                       // store error function


/**
 * Departments
 */
// localhost:8080/CompanyServices/departments?company={company}
app.get(baseURL + "/departments", (req,res,next) => {
    var company = req.query.company;
    if(bl.myCompany(company)){
        response = dl.getAllDepartment(company);    // get all Departments
        if(response == null){ 
            res.status(404).send(error("Departments not found!")); 
        }
    
        res.send(bl.jsonString(response));
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

        response = dl.getDepartment(company, deptID);
        if(response == null){ 
            res.send(error("Department doesn't exist!")); 
        }
    
        res.send(bl.jsonString(response));
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
    
        res.send(bl.jsonString(response));
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

        response = dl.getEmployee(emp_id);
        if(response == null){ 
            res.status(404).send(error("Employee "+ emp_id +" not found!")); 
        }
    
        res.send(bl.jsonString(response));
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
        response = dl.getAllTimecard(emp_id);
        if(response == null){
            res.status(404).send(error("Timecards for "+ emp_id  +" not found!")); 
        }
        res.send(bl.jsonString(response));
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
        response = getTimecard(timecard_id);
        if(response == null){
            res.status(404).send(error("Timecard "+ timecard_id +" not found!"));
        }
        res.send(bl.jsonString(response));
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

