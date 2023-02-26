const express = require('express');
const bodyParser = require("body-parser");
const http = require('http');
const https = require('https');
const https2 = require('https');
const nodemailer = require ('nodemailer')
const {google} = require ('googleapis')
const neo4j = require('neo4j-driver');
const fileUpload = require('express-fileupload');

require('dotenv').config();



const app = express();
const port = 3000
app.listen(port, () => {
    console.log (`Listening on port ${port}`)
})
// test that the api works
console.log("korotepay backend started...")



var fs = require('fs');
uri = '';
user = '';
password = '';
var gLoggedIn = false;

var gDriverBank = []


try {

    uri = process.env.URI
    user = process.env.USER;
    password = process.env.PASSWORD;
    console.log("===========")
    console.log("Done reading settings variables", uri, user);
    console.log("===========")
  
  }
  catch(e) {
    console.log('Error with env variables:', e.stack);
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
        if (answer !== undefined && answer != []) {
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
            const aa_temp = writeResult.records.map(record => {
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
                const rec2 = record['_fields']
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
        const a = readResult.records[0].toObject();
        // console.log("a==", (JSON.stringify(a))['properties'])
        let aa = []
        let count = 0
        if (option === '1') {
        const aa_temp = readResult.records.map(record => {

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
            const aa_temp = readResult.records.map(record => {
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
            const aa_temp = readResult.records.map(record => {
                const rec = record._fields
                // console.log('rec. ::', rec)
                const rec2 = record['_fields']
                if ( count=== 0 ) {console.log('node::', rec)}
                count += 1
                // console.log('rec2. ::', rec2)
                return rec
            })
            // console.log("aa_else::", aa)
            aa = aa_temp

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