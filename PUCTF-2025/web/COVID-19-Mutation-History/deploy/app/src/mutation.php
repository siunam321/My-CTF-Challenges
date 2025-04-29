<?php
require_once "helper/constant.php";
require_once "helper/utils.php";
require_once "helper/database.php";

$title = "Mutation Entry";
include_once "templates/header.php";

if (!isset($_GET["id"])) {
    echo "<h1 class=\"alert\">Please provide a mutation entry ID!</h1>\n";
    die();
}

$database = new Database();

$entryId = intval($_GET["id"]);
$mutationEntry = $database->fetchMutationEntryById($entryId);
if ($mutationEntry === false) {
    echo "<h1 class=\"alert\">Invalid mutation entry ID!</h1>\n";
    die();
}

$isEntryProtected = boolval($mutationEntry["protected"]);
$title = htmlspecialchars($mutationEntry["title"]);
$entryDetails = $mutationEntry["entryDetails"];

if ($isEntryProtected === true && !isAdmin()) {
    $entryDetails = "Protected entry.<br>You are not allowed to view this entry unless you are an administrator user.";
}

$mutationEntryOutput = "
<div class=\"mutation-entry\">
    <h2 class=\"mutation-entry-title\">$title</h2>
    <p class=\"mutation-entry-details\">$entryDetails</p>
</div>
";
echo $mutationEntryOutput;

include_once "templates/footer.php";
?>