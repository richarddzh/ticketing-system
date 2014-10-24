<?php
header("Content-Type: application/json");
$result = new stdClass();
$result->installed = file_exists("../config.php");
echo json_encode($result);
?>
