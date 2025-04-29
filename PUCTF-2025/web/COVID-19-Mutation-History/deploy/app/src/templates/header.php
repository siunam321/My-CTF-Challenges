<?php
defined("ADMIN_USERNAME") or die("No direct access");
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/static/css/main.css">
    <title><?=$title?> | <?=SITE_TITLE?></title>
</head>
<body>
    <div class="navbar">
        <?php
        $isAuthenticated = isAuthenticated();
        if (strtolower($title) === "home") {
            echo "<a class=\"active\" href=\"/\">$title</a>\n";
        } else {
            echo "<a href=\"/\">Home</a>\n";
        }
        if (strtolower($title) === "submit new mutation entry") {
            echo "<a class=\"active\" href=\"/submit.php\">$title</a>\n";
        } else {
            echo "<a href=\"/submit.php\">Submit New Mutation Entry</a>\n";
        }
        
        if ($isAuthenticated) {
            echo "<a href=\"/logout.php\">Logout (Username: " . $_SESSION["username"] . ")</a>\n";
        }

        if (!$isAuthenticated) {
            if (strtolower($title) === "login") {
                echo "<a class=\"active\" href=\"/login.php\">$title</a>\n";
            } else {
                echo "<a href=\"/login.php\">Login</a>\n";
            }
            if (strtolower($title) === "register") {
                echo "<a class=\"active\" href=\"/register.php\">$title</a>\n";
            } else {
                echo "<a href=\"/register.php\">Register</a>\n";
            }
        }
        ?>
    </div>
    <div class="container">
        <h1><?=$title?></h1>
        