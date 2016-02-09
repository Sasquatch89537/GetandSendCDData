<?php

session_start();
//var_dump($_FILES);
if(isset($_FILES['fileUpload'])){
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
        //array_shift($fileData);
        $data = $fileData;
        //var_dump($data);
        //close file reading stream
        fclose($handle);
        //$_SESSION['fileData'] = $fileData;

        fwrite($log, "Close Log --------------------------------------------------------------------------------" . PHP_EOL . PHP_EOL);
        fclose($log);
        $lines = array();
        //prepare the lines of the job file ASCII

        foreach($data as $key => $job){
            if($job[0] !== null) {
                $lines[] = array(
                    "JobID = " . $job[1],
                    "ClientID = 7PURTELL",
                    "Data = C:\\PTBurnData\\FileTrees\\" . $job[0],
                    "CloseDisc = YES",
                    "DeleteFiles = YES",
                    "VerifyDisc = YES",
                    "MergeField = " . $job[0] . " - " . $job[1],
                    "PrintLabel = C:\\PTBurnData\\LabelData\\CDlabelimage.std",
                     /***
                     * Note that the print file specified within the JRQ must be a SureThing file, and it must have been designed with a Merge File specified.
                     * Note that the fields should be specified in the correct order to match the SureThing design.
                     *
                     *
                     *
                     *
                     */
                );




            }

        }
        //var_dump($lines);
        //create the file

        $ftp_host = "7Purtell";
        $ftp_user_name = "brendan";
        $ftp_user_pass = "ftp";
        $connect_it = ftp_connect($ftp_host);
        $login_result = ftp_login($connect_it, $ftp_user_name, $ftp_user_pass);
        foreach($lines as $arr) {
            $fileName = "ftp/jobfile ". substr($arr[0],8). " " .$today->format("M-d-Y-H-s").".txt";
            if (($myfile = fopen($fileName, "w")) === false) { //open the file
                //if unable to open throw exception
                throw new RuntimeException("Could Not Open File Location on Server.");
            }
            foreach($arr as $line){
                fwrite($myfile, $line . PHP_EOL);
            }
            fclose($myfile);
            $remote_file = substr($arr[0],8) . " jobfile.jrq";
            $local_file = $fileName;
            var_dump($remote_file);
            if(ftp_put($connect_it, $remote_file, $local_file, FTP_BINARY)){
                $output = "Successful Transfer";
            } else{
                throw new RuntimeException("Unsuccessful Transfer.");
            }

        }
        ftp_close($connect_it);

        $_SESSION['output'] = $output;
        header("Location: index.php");


    }catch(Exception $e){
        $_SESSION['errorMsg'] = $e->getMessage();
        //header("Location: index.php");
    }
}





?>