const express = require('express');
const fs = require("fs");
const readline = require('readline');
const app = express();
const port = 63025;

var path = './testFiles';

// Serve static files
app.use(express.static('public'));

app.get('/', (req, res) => {
    console.log("Client Connected");
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/readMasterData', (req, res) => {
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
    console.log(req.query.data);
    createJobFiles(req.query.data)
    res.sendStatus(200);
})

app.get('/uploadDBFile', (req, res) => {
    //console.log("uploadDBFile", req.query.data);
    fs.writeFileSync("./masterData.csv", req.query.data);
    res.sendStatus(200);
});

app.get('/checkJobFiles', (req, res) => {
    //console.log("Checking pending jobs");
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
    const files = fs.readdirSync(path);
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
        fileContents.push(clientCSVRowToJSON(line));
    }
    return fileContents;
}


function clientCSVRowToJSON(data) {
    let dataArray = data.split(',');

    // Checking to make sure the file line has enough characters
    if (dataArray.length != 4) {
        console.log("There's an issue with the line ", dataArray)
    }

    return {
        index: dataArray[0],
        clientId: dataArray[1],
        clientName: dataArray[2],
        clientNumber: dataArray[3]
    }
}

function createJobFiles(masterData) {
    for (let obj of masterData) {
        console.log(obj);
        let fileContents = createJobFileFromRow(obj);

        try {
            if (!fs.existsSync(path)) {
                fs.mkdirSync(path);
            }
            fs.writeFileSync(path + "/" + obj.clientName + "_CDJobFile.jrq", fileContents.join('\n'));
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