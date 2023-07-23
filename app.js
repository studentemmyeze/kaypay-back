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
require('dotenv').config();



const app = express();
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
try {

    uri = process.env.URI;
    user = process.env.USER;
    password = process.env.PASSWORD;
    CLIENT_ID = process.env.CLIENT_ID ;
    CLIENT_SECRET =  process.env.CLIENT_SECRET ;
    REFRESH_TOKEN =  process.env.REFRESH_TOKEN ;

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

app.route('/api/db-read').get(onDBRead)
async function onDBRead(req, res) {
    gLoggedInLocal = false
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
            readResult.records.map(record => {
                const answer = []
                if (record.keys.length > 1) {
                for (r in record.keys) {
                    // console.log('this is keys::', r)
                    const node = record.get(record.keys[r])
                    answer.push(node.properties)

                }
                // const keysAvailable = record.keys[0]
                if ( count=== 0 ) {console.log('record::', answer)}
                // const node = record.get(keysAvailable)
                // if ( count=== 0 ) {console.log('node::', node.properties)}
                // count += 1

                
                // console.log('node::', node)
                // console.log('node properties::', node.properties)
                // return node.properties
                return answer}
                else {
                    const keysAvailable = record.keys[0]
                    const node = record.get(keysAvailable).properties
                    if ( count=== 0 ) {console.log('node::', node)}
                    count += 1

            // return node.properties
                    return node
                }

    
            });
            aa = aa_temp
        
            }
        else {
            readResult.records.map(record => {
                const rec = record._fields
                // console.log('rec. ::', rec)
                // const rec2 = record['_fields']
                if ( count=== 0 ) {console.log('node::', rec)}
                count += 1
                // console.log('rec2. ::', rec2)
                return rec
            })
            // console.log("aa_else::", aa)
            // aa = aa_temp

        }
        // console.log("aa::", aa)
        
        answer = aa
    } catch (error) {
        console.error(`Something went wrong: ${error}`);
        // return answer
    } finally {
        await session.close();
        
    }
    return answer

    
}




// this backend should do send of email to students

// this backend should do create student emails
app.route('/api/actions_gen_email').post(onEmailDataSent)
async function onEmailDataSent(req, res) {
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

async function createMailAccount(aData, studentNo) {
    try {
        const A = await requestWithRetry();
        await waitforme(2000)

        await prepareMail(A, aData, studentNo );
    }
    catch (error) {
        console.log('CATCH ERROR- Create Mail Account')
        // return 0
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

async function prepareMail(token, aData, studentNo) {
    try {
        const data = JSON.stringify(aData);
        console.log('@PREPAREMAIL-THIS IS TOKEN', token.res.data.access_token)
        //console.log('THIS IS FULL TOKEN', token)
        const options = {
            host: 'admin.googleapis.com',
            path: '/admin/directory/v1/users',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', 'Content-Length': data.length, 'Authorization': `Bearer ${token.res.data.access_token}`,
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
            return await oAuth2Client1.getAccessToken()
        } catch (err) {
            const timeout = Math.pow(2, i);
            console.log('Waiting', timeout, 'ms');
            await waitforme(timeout);
            console.log('Retrying', err.message, i);
        }
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


app.get('/create-emails2', async (req, res) => {
    const studentData = [
        {studentNo:'test001', firstName: 'T1', middleName: 'TM', lastName:'TL'},
        {studentNo:'test002', firstName: 'T1', middleName: 'TM', lastName:'TL'},
        {studentNo:'test003', firstName: 'T1', middleName: 'TM', lastName:'TL'},
    ]
    for (let i = 0; i < studentData.length ; i++) {
        const obj = {
            "primaryEmail": `${studentData[i].studentNo}@topfaith.edu.ng`,
            "name": {
                "givenName": `${studentData[i].firstName}${studentData[i].middleName ? " " + studentData[i].middleName : ''}`,
                "familyName": studentData[i].lastName,
            }
        }

        console.log('It ran')
        await createMailAccount(obj, studentData[i].studentNo);
        await waitforme(4000);
    }

// console.log('\nXXXXXGeneratedEmailsList::XXXX\n',createdEmails  );

res.status(201).json({
    message: "student  email created successfully", status: 201, data: createdEmails

});



});


