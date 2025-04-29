<?php
require_once "helper/constant.php";
require_once "helper/utils.php";
require_once "helper/database.php";

$title = "Review New Entries";
include_once "templates/header.php";

if (!isset($_GET["id"]) || !isset($_GET["reviewToken"])) {
    echo "<h1 class=\"alert\">Please a review ID and a review token!</h1>\n";
    die();
}

$reviewId = intval($_GET["id"]);
$reviewToken = $_GET["reviewToken"];

$database = new Database();
$review = $database->fetchReviewByToken($reviewId, $reviewToken);
if ($review === false) {
    echo "<h1 class=\"alert\">Invalid review ID or review token!</h1>\n";
    die();
}

$title = htmlspecialchars($review["title"]);
$details = $review["details"];
$reviewOutput = "
<div class=\"mutation-entry\">
    <h2 class=\"mutation-entry-title\">$title</h2>
    <p class=\"mutation-entry-details\">$details</p>
</div>
";
echo $reviewOutput;

include_once "templates/footer.php";
?>