const express = require('express');
const fs = require("fs");
const path = require('path')
const readline = require('readline');
const app = express();
const port = 3000;

//! For local development
//var path = './testFiles';

var job_path = 'C:/PTBurnJobs';

// Serve static files
app.use(express.static('public'));
app.use('/stylesheets', express.static(path.join(__dirname, 'public/stylesheets')))
app.use('/scripts', express.static(path.join(__dirname, 'public/scripts')))

app.get('/', (req, res) => {
    console.log("Client Connected");
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/readMasterData', (req, res) => {
    if (!fs.existsSync("./masterData.csv"))
        fs.writeFileSync("./masterData.csv", "");

    readMasterFile("./masterData.csv").then((contents) => {
        res.send(contents);
    });
})

app.get('/clearMasterData', (req, res) => {
    fs.writeFileSync("./masterData.csv", "");
    res.sendStatus(200);
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

app.get('/createJobFiles', (req, res) => {
    //console.log(req.query.data);
    createJobFiles(req.query.data)
    res.sendStatus(200);
})

app.get('/clearPendingJobFiles', (req, res) => {
    //console.log(req.query.data);
    const files = fs.readdirSync(job_path);
    
    // Delete Done Files
    files.filter(f => f.toUpperCase().endsWith(".JRQ")).map(f => fs.unlinkSync(job_path+"/"+f));
    res.sendStatus(200);
})

app.get('/uploadDBFile', (req, res) => {
    console.log("uploadDBFile", req.query.data);

    fs.writeFileSync("./masterData.csv", req.query.data);
    res.sendStatus(200);
});

app.get('/uploadDBFileChunk', (req, res) => {
    console.log("uploadDBFileChunk", req.query.data);

    fs.appendFileSync("./masterData.csv", req.query.data + "\n");
    res.sendStatus(200);
});

app.get('/checkJobFiles', (req, res) => {
    //console.log("Checking pending jobs");
    if (!fs.existsSync(job_path)) {
        fs.mkdirSync(job_path, { recursive: true });
    }
    const files = fs.readdirSync(job_path);
    
    // Delete Done Files
    files.filter(f => f.toUpperCase().endsWith(".DON")).map(f => fs.unlinkSync(job_path+"/"+f));
    
    res.send(files.length > 0 ? files : []);
})


async function readMasterFile(path) {
    const fileStream = fs.createReadStream(path);
    const rl = readline.createInterface({
        input: fileStream,
        terminal: false,
        crlfDelay: Infinity
    });

    let fileContents = [];
    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        if (line.length > 0) {
            fileContents.push(clientCSVRowToJSON(line));
        }
    }
    return fileContents;
}


function clientCSVRowToJSON(data) {
    let dataArray = data.split(',');

    // Checking to make sure the file line has enough characters
    if (dataArray.length != 2) {
        console.log("There's an issue with the line ", dataArray)
    }

    return {
        clientId: dataArray[0],
        clientName: dataArray[1],
    }
}

function createJobFiles(masterData) {
    for (let obj of masterData) {
        //console.log(obj);
        let fileContents = createJobFileFromRow(obj);

        try {
            if (!fs.existsSync(job_path)) {
                fs.mkdirSync(job_path);
            }
            fs.writeFileSync(job_path + "/" + obj.clientName + "_CDJobFile.jrq", fileContents.join('\n'));
            // file written successfully
        } catch (err) {
            console.error(err);
        }

        // Transfer the file
    }
}

function createJobFileFromRow(data) {
    let fileContents = [];
    fileContents.push("JobID = " + data.clientId);//.$arr['clientId'],
    fileContents.push("ClientID = CLIENT");
    fileContents.push("Data = C:\\PTBurnData\\FileTrees\\" + data.clientId);//.$arr['clientId'],
    fileContents.push("CloseDisc = YES");
    fileContents.push("VerifyDisc = YES");
    fileContents.push("MergeField = " + data.clientId + " - " + data.clientName);
    fileContents.push("PrintLabel = C:\\PTBurnData\\LabelData\\CDlabelimage.std");

    return fileContents;
}