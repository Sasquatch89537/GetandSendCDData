//import DataTable from 'datatables.net';
var table = undefined;

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

    document.querySelector('#button').addEventListener('click', function () {
        saveSelectedRows();
    });
});

function getMasterData() { 
    $.ajax({
        url: '/readMasterData',
        type: 'get',
        dataType: 'json',
        success: (result) => initializeTable(result)
    });
}

function initializeTable(data) {
    console.log(data);
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
    });
}

function updateTableData() {
    $("#main_table").DataTable({ data: data })
}

function saveSelectedRows() {
    let selRows = table.rows('.selected').data();
    console.log(selRows);
    let formattedData = [];
    for (let i = 0; i < selRows.length; i++) {
        //formattedData += i + "," + selRows[i].join(",") + "\n";
        formattedData.push(selRows[i]);
    }

    console.log("Formatted Data", formattedData);

    $.ajax({
        url: '/clientData',
        data: { data: formattedData },
        type: 'get',
        dataType: 'json',
        success: function (data) {/*actions on success*/ },
        error: function (xhr, error) { console.log(xhr, error); }
    });
    // alert('Successfully posted to a remote URL via $.ajax. Await response.');

}
