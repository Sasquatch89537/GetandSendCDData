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

            $.ajax({
                url: '/uploadDBFile',
                data: { data: reader.result },
                type: 'get',
                success: (data) => {
                    console.log("uploaded file");
                    table.destroy();
                    getMasterData();
                    $("#update_db").addClass("disabled");
                    $("#file_selector").val = "";
                },
                error: function (xhr, error) { console.log(xhr, error); }
            });
        })
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

    //$("#settings").on("click", openSettingsPage);
    $("#selectAll").on("click", selectAllRows);
    $("#unselectAll").on("click", unselectAllRows);

    sendToPrinter = $("#sendToPrinter");
    sendToPrinter.on('click', function () {
        sendRowsToPrinter();
    });

    checkPendingJobFiles();
    setInterval(() => {
        checkPendingJobFiles();
    }, 2500);
});

function checkPendingJobFiles() {
    $.ajax({
        url: '/checkJobFiles',
        type: 'get',
        dataType: 'json',
        success: function (data) {
            $("#pendingCount").text(data.length);
            $("#pendingJobs").attr("hidden", data.length == 0);
            $("#pendingJobsList").attr("hidden", data.length == 0);
            $("#pendingJobsList").html(data.join('\n'));
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
            { data: "index" },
            { data: "clientId" },
            { data: "clientName" },
            { data: "clientNumber" }
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
            data: { data: formattedData.splice(0, 5) },
            type: 'get',
            dataType: 'json',
            success: () => { },
            error: function (xhr, error) { console.log(xhr, error); }
        });
        unselectAllRows();
    }
}
