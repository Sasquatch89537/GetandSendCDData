//import DataTable from 'datatables.net';
let table = undefined;
let sendToPrinter = undefined;

$(document).ready(() => {
    //new DataTable('#main_table');
    //callout to get the file as an array of lines convert it to html
    getMasterData();

    $("#file_selector").on("change", () => {
        console.log($("#file_selector").val());
        $("#update_db").removeClass("disabled");
    });

    $("#update_db").on("click", () => {
        let fileName = $("#file_selector")[0].files[0];
        var reader = new FileReader();
        reader.addEventListener("loadend", function (event) {
            console.log(event.target.result);

            let uploadTimeout = undefined;
            let readerArray = reader.result.replace("\r", "").split("\n");
            while (readerArray.length > 0) {
                let splicedData = readerArray.splice(0, 100)
                $.ajax({
                    url: '/uploadDBFileChunk',
                    data: { data: splicedData.join("\n") },
                    type: 'get',
                    success: (data) => {
                        if (uploadTimeout != undefined) {
                            clearTimeout(uploadTimeout);
                        }
                        uploadTimeout = setTimeout(() => {
                            console.log("uploaded file");
                            table.destroy();
                            getMasterData();
                            $("#update_db").addClass("disabled");
                            $("#file_selector").val = "";
                        }, 2500);
                    },
                    error: function (xhr, error) { console.log(xhr, error); }
                });
            }
        });

        reader.readAsText(fileName);
    });

    $("#clear_db").on("click", () => {
        $.ajax({
            url: '/clearMasterData',
            type: 'get',
            success: () => {
                table.destroy(); getMasterData();
            },
            error: function (xhr, error) { console.log(xhr, error); }
        });;
    });

    $("#selectAll").on("click", selectAllRows);
    $("#unselectAll").on("click", unselectAllRows);

    sendToPrinter = $("#sendToPrinter");
    sendToPrinter.on('click', function () {
        sendRowsToPrinter();
    });

    checkPendingJobFiles();
    setInterval(() => {
        checkPendingJobFiles();
    }, 5000);
});

function checkPendingJobFiles() {
    $.ajax({
        url: '/checkJobFiles',
        type: 'get',
        dataType: 'json',
        success: function (data) {
            let pending = data.filter((d) => {return d.toUpperCase().includes("PROGRESS") == false});
            $("#pendingCount").text(pending.length);
            $("#pendingJobsList").html(pending.map((d) => { return "<tr><td>"+d.toString()+"</td></tr>"}).join(""));

            data = data.filter((d) => {return d.toUpperCase().includes("PROGRESS")} )
            $("#inProgressCount").text(data.length);
            $("#inProgressJobsList").html(data.map((d) => { return "<tr><td>"+d.toString()+"</td></tr>"}).join(""));
        },
        error: function (xhr, error) { console.log(xhr, error); }
    });
}

function getMasterData() {
    $.ajax({
        url: '/readMasterData',
        type: 'get',
        dataType: 'json',
        success: (result) => initializeTable(result)
    });
}

function initializeTable(data) {
    //console.log(data);
    table = $("#main_table").DataTable({
        data: data,
        columns: [
            { data: "clientId" },
            { data: "clientName" },
        ]
    });
    table.on('click', 'tbody tr', function (e) {
        e.currentTarget.classList.toggle('selected');
        updateTableSelected();
    });
}

function updateTableSelected() {

    let totalSel = table.rows('.selected').data().length;
    $("#selectedText").text("Total Selected: " + totalSel);

    if (totalSel > 0) {
        sendToPrinter.addClass("enabled");
        sendToPrinter.removeClass("disabled");
    }
    else {
        sendToPrinter.addClass("disabled");
        sendToPrinter.removeClass("enabled");
    }
}

function unselectAllRows() {
    table.rows('.selected').nodes().to$().removeClass('selected');
    updateTableSelected();
}

function selectAllRows() {
    table.rows().nodes().to$().addClass('selected');
    updateTableSelected();
}

function updateTableData() {
    $("#main_table").DataTable({ data: data })
}

function sendRowsToPrinter() {
    let selRows = table.rows('.selected').data();
    console.log(selRows);
    let formattedData = [];
    for (let i = 0; i < selRows.length; i++) {
        //formattedData += i + "," + selRows[i].join(",") + "\n";
        formattedData.push(selRows[i]);
    }

    console.log("Formatted Data", formattedData);

    while (formattedData.length > 0) {
        $.ajax({
            url: '/createJobFiles',
            data: { data: formattedData.splice(0, 10) },
            type: 'get',
            dataType: 'json',
            success: () => { },
            error: function (xhr, error) { console.log(xhr, error); }
        });
        unselectAllRows();
    }
}
