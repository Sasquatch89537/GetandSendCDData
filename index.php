<?php
session_start();

//required extensions
require_once("/var/www/html/CDprinter/phpGrid_Lite/conf.php");
include_once("dbConnect.php");
/***
 * This page initiates the process of printing a cd with client Year End VMR data. This page receives an upload of a list of clients. It allows you to select the clients
 * to print and then creates a .jrq file per company which is a job file and sends it to the network hot drive which is being monitored by the CD printer. The job file points to
 * the network location of the data to print and the merges the label information to create a label for the cd
 *
 */


if(isset($_SESSION['errorMsg'])){
    $error = $_SESSION['errorMsg'];
    $clear = "<li><a href='clear.php'>Clear</a></li>";
}
else{
    $error = "";
    $clear = "";
}

if(isset($_SESSION['fileName'])){
    $download = "<li><a href='download.php'>Download</a></li>";
    $clear = "<li><a href='clear.php'>Clear</a></li>";
}
else{
    $download = "";
    $clear = "";
}

if(isset($_SESSION['output'])){
    $output = $_SESSION['output'];
}
else{
    $output = "";
}


?>
<!DOCTYPE html>
<html>
<head>
  <title>CD Producer</title>

    <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js"></script>
    <!-- Latest compiled and minified CSS -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" integrity="sha384-1q8mTJOASx8j1Au+a5WDVnPi2lkFfwwEAa8hDDdjZlpLegxhjVME1fgjWPGmkzs7" crossorigin="anonymous">

    <!-- Optional theme -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap-theme.min.css" integrity="sha384-fLW2N01lMqjakBkx3l/M9EahuwpSfeNvV63J5ezn3uZzapT0u7EYsXMjQV+0En5r" crossorigin="anonymous">

    <!-- Latest compiled and minified JavaScript -->
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" integrity="sha384-0mSbJDEHialfmuBBQP6A4Qrprq5OVfW37PRR3j5ELqxss1yVqOtnepnHVP9aJ7xS" crossorigin="anonymous"></script>

    <style>
        .row{
            width:auto;
            height:auto;
            margin: 2em 0em 2em 0em;
        }
        ul{
            color: cadetblue;
        }
        #contentDiv{
            color: black;
            background-color: whitesmoke;
            width: auto;
            height: auto;
            margin-bottom: 2em;
            margin-left: 1em;
            margin-top: 2em;
        }
        #clientDiv{
            margin-bottom: 2em;

        }
        #uploadDiv{
            border: darkgoldenrod;
        }
        h4{
            color: whitesmoke;
        }
        input:hover{
            background-color: cadetblue;

        }
        input{
            color: whitesmoke;
        }
        button{
            background-color: whitesmoke;
            border-radius: 5px;
            box-shadow: blanchedalmond;
        }
        button:hover{
            background-color: cadetblue;
        }

    </style>
    <script>
        function saveSelectedRows(){
            //alert("saveRows");
            gdata = $('#clients').jqGrid('getRowData');
            console.log(gdata);
            rows = getSelRows();
            console.log(rows);
            if (rows == "") {
                alert("no rows selected");
                return;
            } else {
                selIndices = [];  // get index selected
                $.each(gdata, function(index, value){
                    if($.inArray(value["rowId"], rows) != -1){
                        selIndices.push(index);
                    }
                });
                console.log(selIndices);
                selRows = [];   // get row object from each index selected
                $.each(gdata, function(index, value){
                    if($.inArray(index, selIndices) != -1){
                        selRows.push(gdata[index]);
                    }
                })
                console.log(selRows);
                $.ajax({
                    url: 'newProcessor.php',
                    data: {selectedRows: selRows},
                    type: 'POST',
                    dataType: 'HTML',
                    success: function(data){ $("#outputDiv").html(data);},
                    error: function(xhr, error) { console.log(xhr, error);}
                });
                alert('Successfully posted to a remote URL via $.ajax. Await response.');
            }
        }
    </script>
</head>
<body>
<nav class="navbar navbar-default">
    <div class="container-fluid">
        <!-- Brand and toggle get grouped for better mobile display -->
        <div class="navbar-header">
            <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1" aria-expanded="false">
                <span class="sr-only">Toggle navigation</span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
            </button>
            <a class="navbar-brand" href="index.php"><img src="http://paydayhcm.com/wp/wp-content/themes/bytechild/img/payday-logo.png"></a>
        </div>

        <!-- Collect the nav links, forms, and other content for toggling -->
        <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
            <ul class="nav navbar-nav">

               <?php echo $download; echo $clear;  ?>

            </ul>

        </div><!-- /.navbar-collapse -->
    </div><!-- /.container-fluid -->
</nav>
<div class="container">

    <div class="row">

        <div class="col-md-12" id="clientDiv">
            <?php
            $mysqli = MysqliConfiguration::getMysqli();
            /*phpgrid.com/documentation/*/
            $dg = new C_DataGrid("SELECT * FROM clients", "rowId", "clients");
            $dg->set_multiselect(true);
            //$dg->enable_search(true);
            //$dg->enable_export('EXCEL');
            $dg->set_pagesize(50);
            $dg->enable_edit('INLINE', 'D');
            $dg->display();



            ?>
            <button type="button" onclick="saveSelectedRows();">Create Job Files</button>
        </div>

        <div class="row">
            <div class="col-lg-12" id="outputDiv">

            </div>
        </div>
        <div class="row">

            <div class="col-lg-12" id="contentDiv">
                <h2>Updating the Client Database ... </h2>
                <h4>
                    <ul>
                        <li>Pull list of clients from Evolution>Client>Client Screen Ctrl+E.</li>
                        <li>Save the list.</li>
                        <li>Open the list in Excel.</li>
                        <li>Save as a .csv.</li>
                        <li>Open .csv in notepad++ and save as a .txt file.</li>
                        <li>Upload the .txt list of clients here.</li>
                    </ul>
                </h4>
                <h5>This will update the client list in this application's Client Database</h5>
                <div id="uploadDiv">
                    <form id="clientListForm" action="dbrefresh.php" method="POST" enctype="multipart/form-data">
                        <table class="table">
                            <tr><td><input type="file" name="fileUpload" id="fileUpload"></td><td><button type="submit">Update Client Database</button></td></tr>

                        </table>
                    </form>
                </div>
                <div id="displayDiv">
                    <?php echo $error . "<br>"; echo $output . "<br>"; ?>
                </div>

            </div>

        </div>
    </div>


 </div>
</body>
</html>