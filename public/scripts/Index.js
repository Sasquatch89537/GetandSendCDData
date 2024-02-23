//import DataTable from 'datatables.net';
let table = undefined;
let sendToPrinter = undefined;
let fileSelector = undefined;

$(document).ready(() => {
    //new DataTable('#main_table');
    //callout to get the file as an array of lines convert it to html
    getMasterData();

    fileSelector = $("#file_selector");
    
    fileSelector.on("change", () => {
        console.log(fileSelector.val());
        $("#update_db").removeClass("disabled");
    });

    $("#update_db").on("click", () => {
        $("#update_db").addClass("disabled loading");
        let fileName = fileSelector[0].files[0];
        var reader = new FileReader();
        reader.addEventListener("loadend", function (event) {
            console.log(event.target.result);

            let uploadTimeout = undefined;
            if (reader.result.length == 0) {
                alert("File must contain data");
                $("#update_db").removeClass("loading");
                $("#update_db").addClass("disabled");
                fileSelector.val("");
                return;
            }

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
                            $("#update_db").removeClass("loading");
                            $("#update_db").addClass("disabled");
                            fileSelector.val("");
                        }, 2500);
                    },
                    error: function (xhr, error) { console.log(xhr, error); $("#update_db").removeClassClass("loading disabled"); }
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
        });
    });

    $("#clearCheckbox").checkbox();
    $("#clearCheckbox").on("click", () => {
        let isChecked = $("#clearCheckbox").checkbox("is checked");
        if (isChecked)
            $("#clearPendingJobs").removeClass("disabled");
        else
            $("#clearPendingJobs").addClass("disabled");
    })

    $("#clearPendingJobs").on("click", clearPendingJobs)
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

function clearPendingJobs() {
    $("#clearPendingJobs").addClass("loading disabled");
    $("#clearCheckbox").checkbox("set unchecked");
    $.ajax({
        url: '/clearPendingJobFiles',
        type: 'get',
        success: () => {$("#clearPendingJobs").removeClass("loading")},
        error: function (xhr, error) { console.log(xhr, error); $("#clearPendingJobs").removeClass("loading disabled")}
    });

}

function checkPendingJobFiles() {
    $.ajax({
        url: '/checkJobFiles',
        type: 'get',
        dataType: 'json',
        success: function (data) {
            let pending = data.filter((d) => { return d.toUpperCase().endsWith(".JRQ") });
            $("#pendingCount").text(pending.length);
            $("#pendingJobsList").html(pending.map((d) => { return "<tr><td>" + d.toString() + "</td></tr>" }).join(""));

            data = data.filter((d) => { return d.toUpperCase().endsWith(".INP") })
            $("#inProgressCount").text(data.length);
            $("#inProgressJobsList").html(data.map((d) => { return "<tr><td>" + d.toString() + "</td></tr>" }).join(""));
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
