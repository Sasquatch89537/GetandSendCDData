//import DataTable from 'datatables.net';
var table = undefined;

$(document).ready(() => {
    //new DataTable('#main_table');
    //callout to get the file as an array of lines convert it to html
    let data = [];
    $.ajax({
        url: '/readMasterData',
        type: 'get',
        dataType: 'json',
        success: (result) => initializeTable(result)
    });

    document.querySelector('#button').addEventListener('click', function () {
        saveSelectedRows();
    });

});

function initializeTable(data) {
    console.log(data);
    table = $("#main_table").DataTable({
        data: data,
        columns: [
            {data:"index"},
            {data:"clientId"},
            {data:"clientName"},
            {data:"clientNumber"}
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
