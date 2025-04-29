<?php
require_once "helper/constant.php";
require_once "helper/utils.php";

$title = "Submit New Mutation Entry";
include_once "templates/header.php";

$message = "";
if (isset($_POST["submit-mutation-title"]) && isset($_POST["submit-mutation-details"])) {
    $entryTitle = htmlspecialchars($_POST["submit-mutation-title"]);
    $entryDetails = sanitizeHTML($_POST["submit-mutation-details"]);
    $reviewToken = bin2hex(random_bytes(32));

    require_once "helper/database.php";
    $database = new Database();
    $insertedId = $database->insertNewReviewMutationEntry($entryTitle, $entryDetails, $reviewToken);
    if ($insertedId) {
        $message = "<h1 class=\"success\">Thank you for your submission! You can send the <a class=\"review-link\" href=\"/review.php?id=$insertedId&reviewToken=$reviewToken\" target=\"_blank\">review link</a> to the administrator user at the <a class=\"review-link\" href=\"/report\" target=\"_blank\">report page</a>; he will add your entry to this website once it's approved!</h1>\n";
    } else {
        $message = "<h1 class=\"alert\">Unable to submit a new mutation entry!</h1>\n";
    }
}

echo ($message) ? $message : "";
?>

<div class="submit-mutation-form">
    <h2>Add New Mutation Entry</h2>
    <form action="/submit.php" method="post">
        <label for="submit-mutation-title">Mutation Title:</label>
        <input id="submit-mutation-title" type="text" name="submit-mutation-title" placeholder="Enter mutation title" required>
        <label for="submit-mutation-details">Mutation Details: (Limited HTML code is supported)</label>
        <textarea id="submit-mutation-details" name="submit-mutation-details" placeholder="Enter mutation details. I.e.: This variant was originated from <strong>South Africa</strong>, [...]" rows="4" required></textarea>
        <input type="submit" value="Submit for Review">
    </form>
</div>

<?php
include_once "templates/footer.php";
?>