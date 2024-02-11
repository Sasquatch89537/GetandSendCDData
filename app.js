const express = require('express');
const fs = require("fs");
const readline = require('readline');
const app = express();
const port = 3000;

// Serve static files
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/readMasterData', (req, res) => {
    readMasterFile("./masterData.csv").then((contents) => {
        console.log(contents);
        res.send(contents);
    });
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

app.get('/clientData', (req, res) => {
    console.log(req.query.data);
    createJobFiles(req.query.data)
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

function writeMasterFile() {

}

function clientCSVRowToJSON(data) {
    let dataArray = data.split(',');
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
        let path = './testFiles';

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