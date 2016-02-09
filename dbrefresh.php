<?php
include_once("dbConnect.php");
session_start();
//var_dump($_FILES);
if(isset($_FILES['fileUpload'])) {
//File Upload and Validate Process
    try {
        if (($log = fopen("log.txt", "a")) === false) { //open a log.txt file
//if unable to open throw exception
            throw new RuntimeException("Log File Did Not Open.");
        }
        $today = new DateTime('now'); //create a date for now
        fwrite($log, $today->format("Y-m-d H:i:s") . PHP_EOL); //post the date to the log.txt
        fwrite($log, "--------------------------------------------------------------------------------" . PHP_EOL); //post to log.txt
//check file size
        if ($_FILES['fileUpload']['size'] > 2000000) {
            fwrite($log, "Exceeded Filesize Limit: " . $_FILES['fileUpload']['size'] . PHP_EOL);
            throw new RuntimeException('Exceeded Filesize Limit.');
        }
        if ($_FILES['fileUpload']['error'] != 0 || is_array($_FILES['fileUpload']['error'])) {
            fwrite($log, "Invalid Parameters - no file Uploaded" . PHP_EOL);
            throw new RuntimeException("Invalid Parameters - no file Selected for Upload");
        }
        switch ($_FILES['fileUpload']['error']) {
            case UPLOAD_ERR_OK:
                break;
            case UPLOAD_ERR_NO_FILE:
                fwrite($log, "No File Sent." . PHP_EOL);
                throw new RuntimeException("No File Sent.");
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                fwrite($log, "Exceeded Filesize Limit." . PHP_EOL);
                throw new RuntimeException("Exceeded Filesize Limit.");
            default:
                fwrite($log, "Unknown Errors." . PHP_EOL);
                throw new RuntimeException("Unknown Errors.");
        }
        $name = $_FILES['fileUpload']['name']; //get file name
        fwrite($log, "FileName: $name" . PHP_EOL); //write to log.txt
        $type = $_FILES["fileUpload"]["type"];//get file type
        fwrite($log, "FileType: $type" . PHP_EOL); //write to log.txt
        $tmp_name = $_FILES['fileUpload']['tmp_name']; //get file temp name
        fwrite($log, "File TempName: $tmp_name" . PHP_EOL); //write to log.txt
        $tempArr = explode(".", $_FILES['fileUpload']['name']); //set file name into an array
        $extension = end($tempArr); //get file extension
        fwrite($log, "Extension: $extension" . PHP_EOL); //write to log.txt
        $goodExts = array("csv", "txt");
        $goodTypes = array("text/csv", "application/vnd.ms-excel", "text/plain");
//test to ensure that uploaded file extension and type are acceptable - if not throw exception
        if (in_array($extension, $goodExts) === false || in_array($type, $goodTypes) === false) {
            fwrite($log, "This page only accepts .csv or .txt files, please upload the correct format." . PHP_EOL);
            throw new Exception("This page only accepts .csv or .txt files, please upload the correct format.");
        }
//move the file from temp location to the server - if fail throw exception
        $directory = "/var/www/html/CDprinter/UploadedFiles";
        if (move_uploaded_file($tmp_name, "$directory/$name")) {
            fwrite($log, "File Successfully Uploaded." . PHP_EOL);
//echo "<p>File Successfully Uploaded.</p>";
        } else {
            fwrite($log, "Unable to Move File to /UploadedFiles." . PHP_EOL);
            throw new RuntimeException("Unable to Move File to /UploadedFiles.");
        }
//rename the file using todays date and time
        $month = $today->format("m");
        $day = $today->format('d');
        $year = $today->format('y');
        $time = $today->format('H-i-s');
        $newName = "$directory/EvoClientList-$month-$day-$year-$time.$extension";
        if ((rename("$directory/$name", $newName))) {
            fwrite($log, "File Renamed to: $newName" . PHP_EOL);
//echo "<p>File Renamed to: $newName </p>";
        } else {
            fwrite($log, "Unable to Rename File: $name" . PHP_EOL);
            throw new RuntimeException("Unable to Rename File: $name");
        }
        $handle = fopen($newName, "r");
        if ($handle === false) {
            fwrite($log, "Unable to Open Stream." . PHP_EOL);
            throw new RuntimeException("Unable to Open Stream.");
        } else {
            fwrite($log, "Stream Opened Successfully." . PHP_EOL);
//echo "<p>Stream Opened Successfully.</p>";
        }
        $fileData = array();
//read the data in line by line
        while (!feof($handle)) {
            $line_of_data = fgets($handle); //gets data from file one line at a time
            $line_of_data = trim($line_of_data); //trims the data
            $fileData[] = str_getcsv($line_of_data, ",", "\""); //breaks the line up into pieces that the array can store

        }


//var_dump($fileData);
        $data = $fileData;
//var_dump($data);
//close file reading stream
        fclose($handle);

        fwrite($log, "Close Log --------------------------------------------------------------------------------" . PHP_EOL . PHP_EOL);
        fclose($log);
        $mysqli = MysqliConfiguration::getMysqli();

// create query template
        $query = "TRUNCATE TABLE clients";
        $statement = $mysqli->prepare($query);

// execute the statement
        if ($statement->execute() === false) {
            throw(new mysqli_sql_exception("Unable to execute mySQL statement Truncate"));
        }


// handle degenerate cases
        if (gettype($mysqli) !== "object" || get_class($mysqli) !== "mysqli") {
            throw(new mysqli_sql_exception("input is not a mysqli object"));
        }


        foreach ($data as $line) {

// create query template
            $query = "INSERT INTO clients(clientId, clientName, clientNumber) VALUES(?, ?, ?)";
            $statement = $mysqli->prepare($query);

// bind the member variables to the place holders in the template
            $wasClean = $statement->bind_param("ssi", $line[0], $line[1],
                $line[2]);
            if ($wasClean === false) {
                throw(new mysqli_sql_exception("Unable to bind parameters"));
            }
// execute the statement

            if ($statement->execute() === false) {
                throw(new mysqli_sql_exception("Unable to execute mySQL statement"));
            }


        }

        $_SESSION['output'] = "<p>Successful Upload</p>";
        header("Location: index.php");


    } catch (Exception $e) {
        $_SESSION['errorMsg'] = $e->getMessage();
        header("Location: index.php");
    }
}
?>