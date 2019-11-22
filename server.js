var DataLayer = require("./companydata/index.js");
var dl = new DataLayer("bxm5989");

var express = require("express");
var app = express();    // instance of express
var morgan = require('morgan');
app.use(morgan('dev'));
var urlencodedParser = express.urlencoded({extended: false});   // another middleware

const baseURL = "/CompanyServices";


var myCompany = (req,res,next) => {
    // CHECK: company entered is mine!
    // var company = req.query.company;
    // if(company != null){
    //     if(company == "bxm5989"){
    //         // GOOD


    //     }
    //     else {
    //         // Return negative
    //         res.sendStatus(400);
    //     }
    // }
    // else {
    //     // return negative
    //     res.sendStatus(400);
    // }

    next();
};

// app.get('/') // only for gets


/**
 * Departments
 */
app.get(baseURL + "/departments", myCompany, (req,res,next) => {
    var company = req.query.company;

    response = dl.getAllDepartment(company);

    //res.send("Retrieved correctly!");
    res.send(JSON.stringify(response));
});
app.get(baseURL + "/department", myCompany, (req,res,next) => {
    var company = req.query.company;
    var deptID = req.query.dept_id;
    response = dl.getDepartment(company, deptID);

    res.send(JSON.stringify(response));
});


/**
 * Employees
 */



 /**
  * Timecards
  */





// SERVER: Creates the server to listen for requests
var server = app.listen(8080, () => {
    // Once the server is up and running
    var host = server.address().address;
    var port = server.address().port;
    console.log("Server running at http://%s:%s", host, port);
});

