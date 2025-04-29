<?php
require_once "helper/constant.php";
require_once "helper/utils.php";

if (isAuthenticated()) {
    header("Location: /index.php");
    die();
}

$title = "Register";
include_once "templates/header.php";
?>

<p>
    <strong>Currently we don't allow user registration yet. Stay tuned!</strong>
</p>

<?php
include_once "templates/footer.php";
?>