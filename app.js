const express = require('express');
const bodyParser = require("body-parser");
const http = require('http');
const https = require('https');
const https2 = require('https');
const nodemailer = require ('nodemailer')
const {google} = require ('googleapis')
const neo4j = require('neo4j-driver');
const fileUpload = require('express-fileupload');
const { OAuth2Client } = require('google-auth-library');
const jwt = require ('jsonwebtoken');
const bcrypt = require('bcrypt');
const XLSX = require("xlsx");
// var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
require('dotenv').config();
const ExcelJS = require('exceljs');
const fs = require('fs');
const cors = require('cors');



const app = express();
app.use(cors());
const port = 3000
app.listen(port, () => {
    console.log (`Listening on port ${port}`)
})
// test that the api works
console.log("korotepay backend started...")



// var fs = require('fs');
uri = '';
user = '';
password = '';

CLIENT_ID =
    ''
CLIENT_SECRET = ''
const REDIRECT_URI = 'https://developers.google.com/oauthplayground'
REFRESH_TOKEN =
    ''
PAYSTACK_SECRET = "";
try {

    uri = process.env.URI;
    user = process.env.USER;
    password = process.env.PASSWORD;
    CLIENT_ID = process.env.CLIENT_ID ;
    CLIENT_SECRET =  process.env.CLIENT_SECRET ;
    REFRESH_TOKEN =  process.env.REFRESH_TOKEN ;
    PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;
    console.log("===========")
    console.log("Done reading settings variables", uri, user);
    console.log("===========")

}
catch(e) {
    console.log('Error with env variables:', e.stack);
}


const SCOPES = ['https://www.googleapis.com/auth/gmail.compose'];

const oauth2ClientTrail = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);







const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
oAuth2Client.setCredentials({refresh_token: REFRESH_TOKEN})

const oAuth2Client1 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
oAuth2Client1.setCredentials({refresh_token: REFRESH_TOKEN})

const oAuth2Client2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
oAuth2Client2.setCredentials({refresh_token: REFRESH_TOKEN})
// set auth as a global default
google.options({
    auth: oAuth2Client
});

var gLoggedIn = false;

var gDriverBank = []




const createdEmails = []
const joinedEmailsGroup = []
var createdEmailStatus = []
var joinedEmailsGroupStatus = []
emailDone = false;
groupDone = false;
sizeOfArray = 0;

function waitforme(ms)  {
    return new Promise( resolve => { setTimeout(resolve, ms); });
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(fileUpload());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, content-type,accept');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');

  next();
});

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, content-type,accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  
    next();
  });

//   DBLogin();

  app.get('/', (req, res, next) => {
    // makeConnection()
    // closeConnection()
    res.status(200).json({
      statusMessage: "Success, this works node"
    });
  
  })

// this backend should do login to database
app.route('/api/db-login').get(onDBLogin)
async function onDBLogin(req, res) {
    
    // const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    // try {
    //     const session = driver.session({ database: 'neo4j' });
    //     await session.close();
    //     loggedIn = true;
    // } catch (error) {
    //     console.error(`Something went wrong: ${error}`);
    //     loggedIn = false;
    // } finally {
    //     console.log("Connection to DB made successfully")
    //     await driver.close();
    // }
    if (!gLoggedIn) {
        const driver = await DBLogin();
        if (driver) {
            gDriverBank = []
            gDriverBank.push(driver)
            gLoggedIn = true
        }
    }
    


    if  (gLoggedIn === true) {
    res.status(200).json({
        driver: gDriverBank[0],
        message: "database found and connected",
        status: 200
      });
    }
    else {
        res.status(202).json({
            message: "database not connected",
            status: 202
          });
    }

}

async function DBLogin() {
    var aSuccess = false
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), { disableLosslessIntegers: true });
    try {
        const session = driver.session({ database: 'neo4j' });
        await session.close();
        aSuccess = true;
    } catch (error) {
        console.error(`Something went wrong: ${error}`);
        aSuccess = false;
    } finally {
        console.log("Connection to DB made successfully")
    }

    if  (aSuccess === true) {
    return driver
    }
    else {
        return false
    }

}

async function DBLogout() {
    var aSuccess = false
    
    try {
        if (gDriverBank[0]) {
            const driver =  gDriverBank[0];
            await driver.close();
            gDriverBank = []
            aSuccess = true;
        }
        
        
    } catch (error) {
        console.error(`Something went wrong in Logout: ${error}`);
        aSuccess = false;
    } finally {
        console.log("Logout successfully")
    }

    return aSuccess;

}

app.route('/api/check-login').get(onDBCheckLogin)
async function onDBCheckLogin(req, res) {

    if  (gLoggedIn === true) {
    res.status(200).json({
        driver: gDriverBank,
        message: "database found and connected",
        status: 200
      });
    }
    else {
        res.status(202).json({
            driver: undefined,
            message: "database not connected",
            status: 202
          });
    }

}



// this backend should do logout from database
app.route('/api/db-logout').get(onDBLogout)
async function onDBLogout(req, res) {
    isSuccessful =  false
    if (gLoggedIn) {
        isSuccessful = await DBLogout();
    }
    


    if  (isSuccessful === true) {
    res.status(200).json({
        message: "database logout success",
        status: 200
      });
    }
    else {
        res.status(202).json({
            message: "database logout not successful",
            status: 202
          });
    }

}



// user-login
app.route('/api/db-write').get(onDBWrite)
async function onDBWrite(req, res) {
    gLoggedInLocal = false
    const query = decodeURIComponent(req.query.queries)
    const option = req.query.option
    console.log("Received query::",query )
    console.log("Received option::",option )
    let answer = []
    const driver = await DBLogin()
    if (driver) {
        gLoggedInLocal = true
        answer = await createQuery(driver,query,'em', option)
        console.log('this is answer::', answer)
        if (answer !== undefined && answer.length > 0) {
            gLoggedInLocal = true
        }
        
    }
    


    if  (gLoggedInLocal === true) {
        res.status(200).json({
            results: answer,
            message: "query successful",
            status: 200
          });
        }
        else {
            res.status(202).json({
                
                message: "query not successful",
                status: 202
              });
        }

}
async function runFindQuery(query, option) {
    const driver = await DBLogin()
    // let gLoggedInLocal = false
    let answer = []
    if (driver) {
        answer = await findQuery(driver,query,'em', option)
        return answer
    }
    else {return 0}


}

app.route('/api/db-read').get(onDBRead)
async function onDBRead(req, res) {
    let gLoggedInLocal = false
    //console.log("Received query req::",req )
    const query = decodeURIComponent(req.query.queries)
    const option = req.query.option
    console.log("Received query::",query )
    console.log("Received option::",option )
    const driver = await DBLogin()
    let answer = []
    if (driver) {
        gLoggedInLocal = true
        answer = await findQuery(driver,query,'em', option)
    }

    if  (gLoggedInLocal === true) {
    res.status(200).json({
        results: answer,
        message: "query successful",
        status: 200
      });
    }
    else {
        res.status(202).json({
            
            message: "query not successful",
            status: 202
          });
    }

}

async function createQuery (driver, writeQuery, username, option) {
    let answer = []
    // To learn more about sessions: https://neo4j.com/docs/javascript-manual/current/session-api/
    const session = driver.session({ database: 'neo4j' });

    try {
        // To learn more about the Cypher syntax, see: https://neo4j.com/docs/cypher-manual/current/
        // The Reference Card is also a good resource for keywords: https://neo4j.com/docs/cypher-refcard/current/
        

        // Write transactions allow the driver to handle retries and transient errors.
        const writeResult = await session.executeWrite(tx =>
            tx.run(writeQuery, { username})
        );
        console.log("writeresult::", writeResult)

        const a = writeResult.records[0].toObject();
        console.log("awrite==", (JSON.stringify(a))['properties'])
        let aa = []
        if (option === '1') {
        const aa_temp = writeResult.records.map(record => {
            const keysAvailable = record.keys[0]
                // if ( count=== 0 ) {console.log('record::', record)}

                // const node = record.get('n');
            const node = record.get(keysAvailable)




            // const node = record.get('n');
            // console.log('node::', node)
            // console.log('node properties::', node.properties)
            // return node.properties
            return node

        });
        aa = aa_temp
    
        }
        else if (option === '2') {
            writeResult.records.map(record => {
                const keysAvailable = record.keys[0]
                // if ( count=== 0 ) {console.log('record::', record)}

                // const node = record.get('n');
                const node = record.get(keysAvailable)


                // const node = record.get('n');
                // console.log('node::', node)
                // console.log('node properties::', node.properties)
                return node.properties
    
            });
            aa = aa_temp
        
            }
        else {
            const aa_temp = writeResult.records.map(record => {
                const rec = record._fields
                // console.log('rec. ::', rec)
                // const rec2 = record['_fields']
                // console.log('rec2. ::', rec2)
                return rec
            })
            console.log("aa_else::", aa)
            aa = aa_temp

        }
        console.log("aa::", aa)
        
        answer = aa

 
    } catch (error) {
        console.error(`Something went wrong: ${error}`);
        
    } finally {
        // Close down the session if you're not using it anymore.
        await session.close();
    }
    return answer
}


async function findQuery(driver, readQuery,username, option) {
    let answer = []
    const session = driver.session({ database: 'neo4j' });

    try {
        
        
        const readResult = await session.executeRead(tx =>
            tx.run(readQuery, { username })
        );
        // console.log("read result::", readResult);
        // console.log("read result-records::", readResult.records);
        // console.log("read result-record1111::", readResult.records[0].toObject());
        // console.log("read result-records[0]::", readResult.records[0]);
        // const a = readResult.records[0].toObject();
        // console.log("a==", (JSON.stringify(a))['properties'])
        let aa = []
        // const answer = [];
        let count = 0
        if (option === '1') {
         readResult.records.map(record => {

            const keysAvailable = record.keys[0]
                // if ( count=== 0 ) {console.log('record::', record)}

                // const node = record.get('n');
            const node = record.get(keysAvailable)


            // const node = record.get('n');
            if ( count=== 0 ) {console.log('node::', node)}
            count += 1
            // console.log('node properties::', node.properties)
            // return node.properties
            return node

        });
        aa = aa_temp
    
        }
        else if (option === '2') {
            console.log('options 2 ')
            // console.log('readssult',readResult);
            readResult.records.map(record => {

                 count = 0
                // console.log('recordkeys::',record.keys);
                if (record.keys.length > 1) {
                for (let r in record.keys) {
                    // console.log('this is keys::', r)
                    const node = record.get(record.keys[r])
                    // console.log('node::', node.properties);
                    answer.push(node.properties)
                    if ( count=== 0 ) {console.log('record::', record)}
                    count += 1;
                }
                // const keysAvailable = record.keys[0]
                // const node = record.get(keysAvailable)
                // if ( count=== 0 ) {console.log('node::', node.properties)}


                
                // console.log('node::', node)
                // console.log('node properties::', node.properties)
                // return node.properties
                return answer}
                else {
                    const keysAvailable = record.keys[0]
                    const node = record.get(keysAvailable).properties
                    if ( count=== 0 ) {console.log('nodeXX::', node)}
                    count += 1

            // return node.properties
                    answer.push(node);
                    // return node
                }

    
            });
            // aa = aa_temp
        
            }
        else {
            let aRec = null

            readResult.records.map(record => {
                // const rec = record._fields
                aRec = record._fields
                // console.log('rec. ::', rec)
                // const rec2 = record['_fields']
                if ( count=== 0 ) {console.log('node::', aRec)}
                count += 1
                // console.log('rec2. ::', rec2)
                // answer = aRec;
                // return aRec
                answer.push(aRec);
            })
            // console.log("aa_else::", aa)
            // aa = aa_temp

        }
        // console.log("aa::", aa)
        
        // answer = aa
    } catch (error) {
        console.error(`Something went wrong: ${error}`);
        // return answer
    } finally {
        await session.close();
        
    }
    return answer

    
}

async function readExcelFileFromComputer() {
    try {
        const todaysDate = new Date()
        const currentYear = todaysDate.getFullYear();
        const currentDay = todaysDate.getDate();
        const currentMonth = todaysDate.getMonth();
        // const resource = `${currentYear}-${currentMonth}-${currentDay}-application-forms.xlsx`;
        const resource = 'admissions_update.xlsx';
        const workbook = XLSX.readFile(resource);

        /* DO SOMETHING WITH workbook HERE */
        let first_sheet_name = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[first_sheet_name];

        let parsedData = XLSX.utils.sheet_to_json(worksheet,{raw:true});


        console.log(parsedData.length);
        return parsedData
    }

    catch (e) {
        console.log('error reading excel file', e);
        return e
    }

}
async function downloadExcelFromWebsite(resource) {
    try {
        const resource2 = 'https://api.topfaith.edu.ng/admin/admission/application/download-all';
        // Specify the local file path to save the downloaded file
        const localFilePath = 'downloaded-excel-file.xlsx'; // Replace with the desired local file path

// Perform the HTTP GET request to download the file
        const file = fs.createWriteStream(localFilePath);
        const request = https.get(resource2, (response) => {
            response.pipe(file);

            file.on('finish', () => {
                file.close(() => {
                    console.log('File downloaded successfully.');
                });
            });
        });

        request.on('error', (error) => {
            console.error('Error downloading file:', error.message);
            fs.unlinkSync(localFilePath); // Delete the file if an error occurs
        });

// Handle potential errors during file writing
        file.on('error', (error) => {
            console.error('Error writing file:', error.message);
            fs.unlinkSync(localFilePath); // Delete the file if an error occurs
        });

    }
    catch(error) {console.log('issue with downloading excel', error)}
    }
async function readTheExcelFromWebsite3(resource){
    var url = resource;
    try {


    await downloadExcelFromWebsite(resource).then(()=> {

        const workbook = XLSX.readFile(resource);

        /* DO SOMETHING WITH workbook HERE */
        let first_sheet_name = workbook.SheetNames[0];
        let worksheet = workbook.Sheets[first_sheet_name];

        let parsedData = XLSX.utils.sheet_to_json(worksheet,{raw:true});


        console.log(parsedData.length);
        console.log('parsedData gotten::', parsedData.length);
    });







        return parsedData;}
    catch(error){
        console.error('Error reading Excel file:', error.message);
    return error;
    }

}

async function readTheExcelFromWebsite(resource){
    const options = {
        hostname: resource,
        method: 'GET',
        headers: {
            'Content-Type': 'application/arraybuffer'
        }
    }
    let answer = [];
    await https.get(resource, (res) => {
        const { statusCode } = res;
        const contentType = res.headers['content-type'];
        console.log('content type::', contentType);
        let error;
        // Any 2xx status code signals a successful response but
        // here we're only checking for 200.
        if (statusCode !== 200) {
            error = new Error('Request Failed.\n' +
                `Status Code: ${statusCode}`);}
        // } else if (!/^application\/vnd.openxmlformats-officedocument.spreadsheetml.sheet/.test(contentType)) {
        //     error = new Error('Invalid content-type.\n' +
        //         `Expected application/openxmlformats-officedocument but received ${contentType}`);
        // }

        // application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
        if (error) {
            console.error(error.message);
            // Consume response data to free up memory
            res.resume();
            return;
        }











        // res.setEncoding('utf8');
        let rawData = [];
        res.on('data', (chunk) => {
            // rawData += chunk;
            console.log('..getting chunk')
            // const data = new Uint8Array(chunk);
            rawData.push(chunk);
           // console.log(chunk);

        });
        // console.log('..done with CHUNK')
        res.on('end', () => {
            let ans = []
            try {
                console.log('..done with CHUNK')
                // console.log('CHECK::', check);
                // const data = new Uint8Array(adata);
                // console.log('ARRAYB:::', rawData);
                const buffer = Buffer.concat(rawData);
                // console.log("ARRAYB:::\n", rawData);
                console.log('buffer:::', buffer);
                // var arr = new Array();
                const arr = [];
                for(let i = 0; i !== buffer.length; ++i) {arr[i] = String.fromCharCode(buffer[i]);}
                let bstr = arr.join("");
                // console.log('bstr::', bstr);
                let workbook = XLSX.read(bstr, {type:"binary"});
                let first_sheet_name = workbook.SheetNames[0];
                let worksheet = workbook.Sheets[first_sheet_name];

                let parsedData = XLSX.utils.sheet_to_json(worksheet,{raw:true});


                console.log('parsedData gotten::', parsedData.length);
                answer = parsedData;
                // return parsedData;
            } catch (e) {
                console.error(e.message);
                // return [];
            }
            // return ans;
        });
    }).on('error', (e) => {
        console.error(`Got error: ${e.message}`);
        return [];
    });
    return answer;

}

// Function to download the Excel file
function downloadExcelFile(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const chunks = [];

            response.on('data', (chunk) => {
                chunks.push(chunk);
            });

            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                resolve(buffer);
            });

            response.on('error', (error) => {
                reject(error);
            });
        });
    });
}

async function readExcelOnline(excelUrl) {
    try {
        // Download the Excel file
        const excelData = await downloadExcelFile(excelUrl);

        // Load the Excel file into a workbook
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(excelData);

        // Assuming your data is in the first sheet
        const worksheet = workbook.getWorksheet(1);

        // Iterate through rows and columns
        const records = [];
        worksheet.eachRow({ includeEmpty: true }, (row) => {
            records.push(row.values);
        });

        console.log('Entire Records:', records.length);
        return records;
    } catch (error) {
        console.error('Error reading Excel file:', error.message);
        return error;
    }
}
// this backend should get student application and send results to the main application
app.route('/api/get-applications').get(onGetApplication__)


async function onGetApplication(req,res) {
    const resource = 'https://api.topfaith.edu.ng/admin/admission/application/download-all';
    try {
        await readTheExcelFromWebsite(resource).then((parsedData)=> {
            console.log('inside then', parsedData);
            if  (parsedData && parsedData.length > 0) {
                console.log('sending data');
                res.status(200).json({
                    data: parsedData,
                    message: "applications found",
                    status: 200
                });
            }
            else if (parsedData && parsedData.length === 0){
                console.log('sending data empty');
                res.status(202).json({
                    message: "applications not found",
                    status: 202
                });
            }

        })

    } catch (error) {
        console.log('sending error');
        console.error('Error downloading Excel file:', error.message);
        res.status(500).send('Internal Server Error');
    }

}
async function onGetApplication_inprogress(req,res) {
    try {
        // URL of the Excel file online
        const excelUrl = 'https://api.topfaith.edu.ng/admin/admission/application/download-all';
        const todaysDate = new Date()
        const currentYear = todaysDate.getFullYear();
        const currentDay = todaysDate.getDate();
        const currentMonth = todaysDate.getMonth();
        // Make an HTTP request to get the Excel file
        https.get(excelUrl, (response) => {
            const chunks = [];

            // Collect data chunks
            response.on('data', (chunk) => {
                chunks.push(chunk);
            });

            // On end, concatenate the chunks and send the Excel file content as the response
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                // Set response headers for Excel download
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader('Content-Disposition', `attachment; filename=${currentYear}-${currentMonth}-${currentDay}-application-forms.xlsx`);

                // Send the Excel file content as the response
                res.send(buffer);
            });
        });
    } catch (error) {
        console.error('Error downloading Excel file:', error.message);
        res.status(500).send('Internal Server Error');
    }
}

async function onGetApplication__(req, res) {
    const resource = 'https://api.topfaith.edu.ng/admin/admission/application/download-all';
    // const resource = 'https://www.dropbox.com/scl/fi/3s4vk1h84b8jq8g4l4cla/applications.xlsx?rlkey=f9vfywruizeq47uvqx9hlvl0v&dl=1'
    try {

        // Make an HTTP request to get the Excel file
        https.get(resource, (response) => {
            const chunks = [];

            // Collect data chunks
            response.on('data', (chunk) => {
                chunks.push(chunk);
            });

            // On end, concatenate the chunks and send the Excel file content as the response
            response.on('end', () => {
                const buffer = Buffer.concat(chunks);

                console.log('buffer::', buffer);

                // Set response headers for Excel download
                // res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                // res.setHeader('Content-Disposition', 'attachment; filename=downloaded-excel-file.xlsx');

                // Send the Excel file content as the response

                // console.log('buffer:::', buffer);
                // var arr = new Array();
                const arr = [];
                for(let i = 0; i !== buffer.length; ++i) {arr[i] = String.fromCharCode(buffer[i]);}
                let bstr = arr.join("");
                // console.log('bstr::', bstr);
                let workbook = XLSX.read(bstr, {type:"binary"});
                // let workbook = XLSX.read(bstr);
                let first_sheet_name = workbook.SheetNames[0];
                let worksheet = workbook.Sheets[first_sheet_name];

                let parsedData = XLSX.utils.sheet_to_json(worksheet,{raw:true});
                // let parsedData = XLSX.utils.sheet_to_json(worksheet);


                console.log('parsedData gotten::', parsedData.length);




                if  (parsedData && parsedData.length > 0) {
                    res.status(200).json({
                        data: parsedData,
                        message: "applications found",
                        status: 200
                    });
                }
                else if (parsedData && parsedData.length === 0){
                    res.status(202).json({
                        message: "applications not found",
                        status: 202
                    });
                }
            });
        });
    } catch (error) {
        console.error('Error downloading Excel file:', error.message);
        res.status(500).send('Internal Server Error');
    }
}
async function onGetApplication2(req, res) {
    // const emailData = req.body;
    // const resource = req.body;
    const resource = 'applications.xlsx';
    console.log('resource;:', resource);

    try {

        await readTheExcelFromWebsite3(resource).then(
            (answer) => {
                if  (answer && answer.length > 0) {
                    res.status(200).json({
                        data: JSON.stringify(answer),
                        message: "applications found",
                        status: 200
                    });
                }
                else if (answer && answer.length === 0){
                    res.status(202).json({
                        message: "applications not found",
                        status: 202
                    });
                }
            }
        );
        // console.log('applications result::', answer);


    }

    catch (e) {
        console.log('error @getapplications:', e);
        res.status(500).send('Failed to get applications');
    }


}




// this backend should do send of email to students
app.route('/api/send-bills').post(onDetailSent)
async function onDetailSent(req, res) {
    issues = false;
    date_start = new Date();
    sendBillStatus = "pending"
    const emailData = req.body;
    console.log('this is emailData', emailData);
    const message = emailData[0];
    const myData = emailData[1];
    console.log('message::', message);
    console.log('data::', myData);

    res.status(201).json({
        message: "bills  email sent successfully", status: 201, data: []

    });
}



// this backend should do create student emails
app.route('/api/actions_gen_email').post(onEmailDataSent)
async function onEmailDataSent_old(req, res) {
    const studentData = req.body;
    for (let i = 0; i < studentData.length ; i++) {
        const obj = {
            "primaryEmail": `${studentData[i].studentNo}@topfaith.edu.ng`,
            "name": {
                "givenName": `${studentData[i].firstName}${studentData[i].middleName ? " " + studentData[i].middleName : '' }`,
                "familyName": studentData[i].lastName,
            },
            "suspended": false,
            "password": "123456789",

            "changePasswordAtNextLogin": false,
            "ipWhitelisted": false,
            "ims": [
                {
                    "type": "work",
                    "protocol": "gtalk",
                    "im": `${studentData[i].studentNo}@topfaith.edu.ng`,
                    "primary": true
                }
            ],
            "emails": [
                {
                    "address": `${studentData[i].studentNo}@topfaith.edu.ng`,
                    "type": "home",
                    "customType": "",
                    "primary": true
                }
            ],
            "addresses": [
                {
                    "type": "work",
                    "customType": "",
                    "streetAddress": "Topfaith University, Mkpatak",
                    "locality": "Essien Udim",
                    "region": "AKWAIBOM",
                    "postalCode": "94043"
                }
            ],
            "externalIds": [
                {
                    "value": `${studentData[i].studentNo}`,
                    "type": "custom",
                    "customType": "student"
                }
            ],

            "organizations": [
                {
                    "name": "Topfaith University, Mkpatak",
                    "title": "Student",
                    "primary": true,
                    "type": "work",
                    "department": `${studentData[i].programme ? studentData[i].programme : '' }`,
                    "description": "Undergraduate University Student",

                }
            ],
            "phones": [
                {
                    "value": `${studentData[i].phone ? (studentData[i].phone) : ''}`,
                    "type": "work"
                }
            ],
            "orgUnitPath": "/Topfaith University Students",
            "includeInGlobalAddressList": true

        }

        console.log('It ran')
        await createMailAccount(obj, studentData[i].studentNo);
        await waitforme(4000)

    }

    // console.log('\nXXXXXGeneratedEmailsList::XXXX\n',createdEmails  );

    res.status(201).json({
        message: "student  email created successfully", status: 201, data: createdEmails

    });
}

async function onEmailDataSent(req,res) {
    const studentData = req.body;
    const success = [];
    const failures = [];
    const successGp = [];
    const failuresGp = [];
    let timeout = 30; //seconds
    console.log(`email creation for ${studentData.length} students started @: ` + new Date());
    let start = Number(Date.now());
    let end = start + timeout * 1000;
    let requestMarker = [{status: 0, A: null}]
    for (let i = 0; i < studentData.length ; i++) {

        const obj = {
            "primaryEmail": `${studentData[i].studentNo}@topfaith.edu.ng`,
            "name": {
                "givenName": `${studentData[i].firstName}${studentData[i].middleName ? " " + studentData[i].middleName : '' }`,
                "familyName": studentData[i].lastName,
            },
            "suspended": false,
            "password": "123456789",

            "changePasswordAtNextLogin": false,
            "ipWhitelisted": false,
            "ims": [
                {
                    "type": "work",
                    "protocol": "gtalk",
                    "im": `${studentData[i].studentNo}@topfaith.edu.ng`,
                    "primary": true
                }
            ],
            "emails": [
                {
                    "address": `${studentData[i].studentNo}@topfaith.edu.ng`,
                    "type": "home",
                    "customType": "",
                    "primary": true
                }
            ],
            "addresses": [
                {
                    "type": "work",
                    "customType": "",
                    "streetAddress": "Topfaith University, Mkpatak",
                    "locality": "Essien Udim",
                    "region": "AKWAIBOM",
                    "postalCode": "94043"
                }
            ],
            "externalIds": [
                {
                    "value": `${studentData[i].studentNo}`,
                    "type": "custom",
                    "customType": "student"
                }
            ],

            "organizations": [
                {
                    "name": "Topfaith University, Mkpatak",
                    "title": "Student",
                    "primary": true,
                    "type": "work",
                    "department": `${studentData[i].programme ? studentData[i].programme : '' }`,
                    "description": "Undergraduate University Student",

                }
            ],
            "phones": [
                {
                    "value": `${studentData[i].phone ? (studentData[i].phone) : ''}`,
                    "type": "work"
                }
            ],
            "orgUnitPath": "/Topfaith University Students",
            "includeInGlobalAddressList": true

        }

        const myNow = Number(Date.now())
        if (myNow >= end || i === 0 || requestMarker[0].A == null || requestMarker[0].A === undefined){
            end = myNow + timeout * 1000;
            requestMarker[0].status = 1
        }
        else {
            requestMarker[0].status = 0
        }
        // const {answer} = await createMailAccount(obj, studentData[i].studentNo, requestMarker);
        createMailAccount(obj, studentData[i].studentNo, requestMarker).then(answer => {
            if (answer[0] === 1) {
                success.push(studentData[i].studentNo)
                requestMarker[0].A = answer[1]
            }
            else if (answer[0] == 0){failures.push(studentData[i].studentNo)}
        });


        await waitforme(3000);
    }
    await waitforme(1000);
    let start2 = Number(Date.now());
    let end2 = start + timeout * 1000;
    let requestMarker2 = [{status: 0, A: null}]
    for (let j = 0; j < success.length ; j++) {
        const studData = success[j];
        console.log('@groups, It ran', studData)

        const myNow2 = Number(Date.now())
        if (myNow2 >= end2 || j === 0 || requestMarker2[0].A === null || requestMarker2[0].A === undefined){
            end2 = myNow2 + timeout * 1000;
            requestMarker2[0].status = 1
        }
        else {
            requestMarker2[0].status = 0
        }
        // const {answer} = await createMailAccount(obj, studentData[i].studentNo, requestMarker);
        add2groupsParent( studData, requestMarker2 ).then(answer => {
            console.log('requestMarker after  @add2groupsParentLoop::', requestMarker2)
            if (answer[0] === 1) {
                successGp.push(studData)
                requestMarker2[0].A = answer[1]
            }
            else if (answer[0] === 0){failuresGp.push(studData)}
        });


        await waitforme(3000);
    }

    res.status(201).json({
        message: "student  email created successfully", status: 201, data: [success,failures,successGp,failuresGp]

    });


  }
async function createMailAccount(aData, studentNo, requestMarker) {
      const A = [null]
    try {
        if (requestMarker[0].status == 1) {
            console.log('trying to get token...')
            requestWithRetry().then(results => {
                A[0] = results
                console.log('A0::', A[0])

            })

        }
        else {A[0] = requestMarker[0].A}
        await waitforme(2000)

        await prepareMail(A[0], aData, studentNo );
        return [1, A[0]]
    }
    catch (error) {
        console.log('CATCH ERROR- Create Mail Account')
        return [0]
    }
}

async function joinMailGroups(aStudentData) {
    try {
        const AA = await requestWithRetry_gp();
        await waitforme(1500)
        const C = await add2groups(AA, aStudentData)

        // return 1
    }
    catch (error) {
        console.log('GROUPS::CATCH ERROR')
        // return 0
    }
}

async function add2groups(token, aData) {
    try {
        const data = JSON.stringify(
            {
                "email": `${aData.studentNo}@topfaith.edu.ng`,
                "role": "MEMBER"
            }
        );
        //console.log('THIS IS TOKEN2', token, data)

        const options = {
            host: 'admin.googleapis.com',
            path: '/admin/directory/v1/groups/topfaithuniversitystudents@topfaith.edu.ng/members',

            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 'Content-Length': data.length, 'Authorization': `Bearer ${token.res.data.access_token}`,
            },
        };

        const req = https2.request(options, res => {
            console.log(`statusCode: ${res.statusCode}`);

            res.on('data', d => {


                process.stdout.write(d);
            });
        });

        req.on('error', error => {
            console.error(error);
        });

        req.write(data);
        // joinedEmailsGroup.push(aData.studentNo)
        req.end();
        // return 1;
        // if (i+1 === sizeOfArray) {groupDone = true;}

    }
    catch (err) {
        console.log('error add2groups')
        // return 0
    }
}
async function add2groupstrial(token, studentNo) {
      let referenceYear = new Date().getFullYear().toString();
    try {
        const data = JSON.stringify(
            {
                "email": `${studentNo}@topfaith.edu.ng`,
                "role": "MEMBER"
            }
        );
        //making sure that the regnumber is a digit
        if (!isNaN(parseFloat(studentNo))) {
            try {
                referenceYear = Math.floor(Number(studentNo) / (1 * Math.pow(10, 9 - 4))).toString();
            } catch (e) {
                console.log('error setting reference year')
            }
        }

        const optionsTrial = {
            host: 'admin.googleapis.com',
            path: `/admin/directory/v1/groups/${referenceYear}tustudents@topfaith.edu.ng/members`,

            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 'Content-Length': data.length, 'Authorization': `Bearer ${token.token}`,
            },
        };

        const req = https2.request(optionsTrial, res => {
            console.log(`statusCode: ${res.statusCode}`);

            res.on('data', d => {


                process.stdout.write(d);
            });
        });

        req.on('error', error => {
            console.error(error);
        });

        req.write(data);
        // joinedEmailsGroup.push(aData.studentNo)
        req.end();
        // return 1;
        // if (i+1 === sizeOfArray) {groupDone = true;}

    }
    catch (err) {
        console.log('error add2groups')
        // return 0
    }
}

async function add2groupsParent(studentNo, reques) {
    const AA = [null]
    try {
        if (reques[0].status == 1) {
            console.log('trying to get token...')
            requestWithRetry().then(results => {
                AA[0] = results
                console.log('success::')
            })

        }
        else {AA[0] = reques[0].A}
        await waitforme(2000)
        await add2groupstrial(AA[0], studentNo)
        return [1, AA[0]]
    }
    catch (error) {
        console.log('CATCH ERROR- Add groups parent')
        return [0]
    }
}

async function prepareMail(token, aData) {
    try {
        const data = JSON.stringify(aData);

        const options = {
            host: 'admin.googleapis.com',
            path: '/admin/directory/v1/users',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 'Content-Length': data.length, 'Authorization': `Bearer ${token.token}`,
            },
        };

        const req = https.request(options, res => {
            console.log(`statusCode: ${res.statusCode}`);

            res.on('data', d => {


                process.stdout.write(d);
            });
        });

        req.on('error', error => {
            console.error(error);
        });

        req.write(data);

        // createdEmails.push(studentNo)
        // createdEmailStatus[i] = 1
        // if (i+1 === sizeOfArray) {emailDone = true;}
        req.end();


        // return token.res.data.access_token
    }
    catch (err) {
        console.log('error prepare mail')
        return 0
    }
}



async function requestWithRetry () {
    const MAX_RETRIES = 3;
    for (let i = 0; i <= MAX_RETRIES; i++) {
        try {
            console.log('in request with retry')
            return await oAuth2Client1.getAccessToken();
        } catch (err) {
            const timeout = Math.pow(2, i);
            console.log('Waiting', timeout, 'ms');
            await waitforme(timeout);
            console.log('Retrying', err.message, i);
        }
        // finally {
        //     break;
        // }
    }
}

async function requestWithRetry_gp () {
    const MAX_RETRIES = 3;
    for (let i = 0; i <= MAX_RETRIES; i++) {
        try {
            return await oAuth2Client2.getAccessToken()
        } catch (err) {
            const timeout = Math.pow(2, i);
            console.log('Waiting', timeout, 'ms');
            await waitforme(timeout);
            console.log('Retrying', err.message, i);
        }
    }
}


async function authenticateTest(req, res) {

    // const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    // try {
    //     const session = driver.session({ database: 'neo4j' });
    //     await session.close();
    //     loggedIn = true;
    // } catch (error) {
    //     console.error(`Something went wrong: ${error}`);
    //     loggedIn = false;
    // } finally {
    //     console.log("Connection to DB made successfully")
    //     await driver.close();
    // }
    if (!gLoggedIn) {
        const driver = await DBLogin();
        if (driver) {
            gDriverBank = []
            gDriverBank.push(driver)
            gLoggedIn = true
        }
    }



    if  (gLoggedIn === true) {
        res.status(200).json({
            driver: gDriverBank[0],
            message: "database found and connected",
            status: 200
        });
    }
    else {
        res.status(202).json({
            message: "database not connected",
            status: 202
        });
    }

}

// Step 1: Initiate the OAuth2 flow
app.get('/auth', (req, res) => {
    const authUrl = oauth2ClientTrail.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    res.redirect(authUrl);
});

// Step 2: Handle the OAuth2 callback
app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    try {
        const { tokens } = await oauth2ClientTrail.getToken(code);
        console.log('tokens22::', tokens)
        oauth2ClientTrail.setCredentials(tokens);
        // Now, tokens.access_token can be used to create the email account (Step 4).
        res.send('OAuth2 successful. You can now create the email account.');
    } catch (error) {
        console.error('Error exchanging code for access token:', error);
        res.status(500).send('Failed to complete OAuth2 flow.');
    }
});

//test for the latest email creation
app.get('/create-emails2', async (req, res) => {
    const studentData = [
        {studentNo:'test001', firstName: 'T1', middleName: 'TM', lastName:'TL'},
        {studentNo:'test002', firstName: 'T1', middleName: 'TM', lastName:'TL'},
        // {studentNo:'test003', firstName: 'T1', middleName: 'TM', lastName:'TL'},
        // {studentNo:'test004', firstName: 'T1', middleName: 'TM', lastName:'TL'},
        // {studentNo:'test005', firstName: 'T1', middleName: 'TM', lastName:'TL'}
    ]
    const success = [];
    const failures = [];
    const successGp = [];
    const failuresGp = [];
    let timeout = 30; //seconds
    console.log("start:" + new Date());
    let start = Number(Date.now());
    let end = start + timeout * 1000;
    let requestMarker = [{status: 0, A: null}]
    for (let i = 0; i < studentData.length ; i++) {

        const obj = {
            "primaryEmail": `${studentData[i].studentNo}@topfaith.edu.ng`,
            "name": {
                "givenName": `${studentData[i].firstName}${studentData[i].middleName ? " " + studentData[i].middleName : ''}`,
                "familyName": studentData[i].lastName,
            },
            "suspended": false,
            "password": "123456789",

            "changePasswordAtNextLogin": false,
            "ipWhitelisted": false,
            "ims": [
                {
                    "type": "work",
                    "protocol": "gtalk",
                    "im": `${studentData[i].studentNo}@topfaith.edu.ng`,
                    "primary": true
                }
            ],
            "emails": [
                {
                    "address": `${studentData[i].studentNo}@topfaith.edu.ng`,
                    "type": "home",
                    "customType": "",
                    "primary": true
                }
            ],
        }

        console.log('It ran')

        const myNow = Number(Date.now())
        if (myNow >= end || i == 0 || requestMarker[0].A == null || requestMarker[0].A == undefined){
            console.log('In first-myNow')
            end = myNow + timeout * 1000;
            requestMarker[0].status = 1
        }
        else {
            requestMarker[0].status = 0
            console.log('In else-myNow')
        }
        // const {answer} = await createMailAccount(obj, studentData[i].studentNo, requestMarker);
        createMailAccount(obj, studentData[i].studentNo, requestMarker).then(answer => {
            if (answer[0] === 1) {
                success.push(studentData[i].studentNo)
                requestMarker[0].A = answer[1]
                console.log('requestMarker after success @CreatMailLoop::', requestMarker)
            }
            else if (answer[0] === 0){failures.push(studentData[i].studentNo)}
        });


        await waitforme(4000);
    }
    await waitforme(4000);
    let start2 = Number(Date.now());
    let end2 = start2 + timeout * 1000;
    let requestMarker2 = [{status: 0, A: null}]
    for (let j = 0; j < success.length ; j++) {
        const studData = success[j];
        console.log('@groups, It ran', studData)

        const myNow2 = Number(Date.now())
        if (myNow2 >= end2 || j == 0 || requestMarker2[0].A == null || requestMarker2[0].A == undefined){
            console.log('@groups,In first-myNow')
            end2 = myNow2 + timeout * 1000;
            requestMarker2[0].status = 1
        }
        else {
            requestMarker2[0].status = 0
            console.log('@groups,In else-myNow')
        }
        // const {answer} = await createMailAccount(obj, studentData[i].studentNo, requestMarker);
        add2groupsParent( studData, requestMarker2 ).then(answer => {
            console.log('requestMarker after  @add2groupsParentLoop::', requestMarker2)
            if (answer[0] === 1) {
                successGp.push(studData)
                requestMarker2[0].A = answer[1]
            }
            else if (answer[0] == 0){failuresGp.push(studData)}
        });


        await waitforme(4000);
    }
// console.log('\nXXXXXGeneratedEmailsList::XXXX\n',createdEmails  );

res.status(201).json({
    message: "student  email created successfully", status: 201, data: [success,failures,successGp,failuresGp]

});



});

app.route('/api/create-virtual-accounts').post(onVirtualAccountDataSent)
async function onVirtualAccountDataSent(req,res) {
    const studentData = req.body;
    for (let i = 0; i < studentData.length ; i++) {
        await createPaystackCustomer((studentData)).then(result => {
            if (result == 1) {
            //    customer creation was successful

            }
        })

    }

}

async function createPaystackCustomer(studentData) {
    const https = require('https')
    try {
        const params = JSON.stringify({
            "email": studentData.email,
            "first_name": studentData.firstName,
            "last_name": studentData.lastName,
            "phone": studentData.phone
        })

        const options = {
            hostname: 'api.paystack.co',
            port: 443,
            path: '/customer',
            method: 'POST',
            headers: {
                Authorization: PAYSTACK_SECRET,
                'Content-Type': 'application/json'
            }
        }

        const req = https.request(options, res => {
            let data = ''

            res.on('data', (chunk) => {
                data += chunk
            });

            res.on('end', () => {
                console.log(JSON.parse(data))
            })
        }).on('error', error => {
            console.error(error)
        })

        req.write(params)
        req.end()
        return 1

    }

    catch (e) {
        console.log(`error creating student- ${studentData.lastName} data::`, e)
        return 0
    }

}

async function createVirtualAccount(studentData) {}

async function findUser(username) {
    const query = `match (a:User) where a.staffID = '${username}' and a.isActive = true return a`;
    console.log('query', query);
    const user = await runFindQuery(query,'2')
    console.log('user@findUser::', user);
    return user;

}
app.get('/api/login', async (req, res) => {
    console.log('username', req.query.username);
    const user =  await findUser(req.query.username);
    if (!user) {
        return res.status(400).send ('the user not found')
    }

    if (user && bcrypt.compareSync(req.query.username, user.passwordHash)) {
        res.status(200).send('user Authenticated');
    }
    else {
        res.status(400).send('password is wrong');
    }

});
