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
    files.filter(f => f.toUpperCase().endsWith(".JRQ")).map(f => fs.unlinkSync(job_path + "/" + f));
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
            let temp = clientCSVRowToJSON(line);
            if (temp != undefined)
                fileContents.push(temp);
        }
    }
    console.log(fileContents);
    return fileContents;
}

function parseCSV(str) {
    const arr = [];
    let quote = false;  // 'true' means we're inside a quoted field

    // Iterate over each character, keep track of current row and column (of the returned array)
    for (let row = 0, col = 0, c = 0; c < str.length; c++) {
        let cc = str[c], nc = str[c + 1];        // Current character, next character
        arr[row] = arr[row] || [];             // Create a new row if necessary
        arr[row][col] = arr[row][col] || '';   // Create a new column (start with empty string) if necessary

        // If the current character is a quotation mark, and we're inside a
        // quoted field, and the next character is also a quotation mark,
        // add a quotation mark to the current column and skip the next character
        if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }

        // If it's just one quotation mark, begin/end quoted field
        if (cc == '"') { quote = !quote; continue; }

        // If it's a comma and we're not in a quoted field, move on to the next column
        if (cc == ',' && !quote) { ++col; continue; }

        // If it's a newline (CRLF) and we're not in a quoted field, skip the next character
        // and move on to the next row and move to column 0 of that new row
        if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }

        // If it's a newline (LF or CR) and we're not in a quoted field,
        // move on to the next row and move to column 0 of that new row
        if (cc == '\n' && !quote) { ++row; col = 0; continue; }
        if (cc == '\r' && !quote) { ++row; col = 0; continue; }

        // Otherwise, append the current character to the current column
        arr[row][col] += cc;
    }
    return arr;
}

function clientCSVRowToJSON(data) {
    //console.log(parseCSV(data).filter((d) => { return d[0] != undefined }).map((d) => { return [d[0], d[1]] }))
    let dataArray = parseCSV(data).filter((d) => { return d[0] != undefined }).map((d) => { return [d[0], d[1]] });

    // Checking to make sure the file line has enough characters
    if (dataArray.length != 2) {
        //console.log("There's an issue with the line ", dataArray)
    }

    console.log(dataArray[0][0].length > 0);
    if (dataArray[0][0].length) {
        return {
            clientId: dataArray[0][0],
            clientName: dataArray[0][1],
        }
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
            fs.writeFileSync(job_path + "/" + obj.clientName.replace(/[ &\/\\#,+()$~%.'":*?<>{}]/g, "") + "_CDJobFile.jrq", fileContents.join('\n'));
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