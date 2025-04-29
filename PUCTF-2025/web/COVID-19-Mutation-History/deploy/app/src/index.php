<?php
require_once "helper/constant.php";
require_once "helper/utils.php";
require_once "helper/database.php";

$title = "Home";
include_once "templates/header.php";

$database = new Database();
$mutationEntries = $database->fetchMutationEntries();

foreach ($mutationEntries as $mutationEntry) {
    $entryId = intval($mutationEntry["entryId"]);
    $title = htmlspecialchars($mutationEntry["title"]);
    $mutationEntryOutput = "
    <div class=\"mutation-entry\">
        <h2 class=\"mutation-entry-title\"><a href=\"/mutation.php?id=$entryId\">$title</a></h2>
    </div>
    ";
    echo $mutationEntryOutput;
}

include_once "templates/footer.php";
?>