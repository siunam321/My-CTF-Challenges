<?php
require_once "helper/constant.php";
require_once "helper/utils.php";

if (isAuthenticated()) {
    header("Location: /index.php");
    die();
}

$message = "";
if (isset($_POST["username"]) && isset($_POST["password"])) {
    $isLoginSuccessful = validateLogin((string) $_POST["username"], (string) $_POST["password"]);
    if ($isLoginSuccessful) {
        $_SESSION["username"] = htmlspecialchars($_POST["username"]);
        header("Location: /index.php");
        die();
    } else {
        $message = "<h1 class=\"alert\">Incorrect username or password!</h1>\n";
    }
}

$title = "Login";
include_once "templates/header.php";

echo ($message) ? $message : "";
?>

<form action="/login.php" method="post">
    <label for="username">Username:</label>
    <input id="username" name="username" type="text" placeholder="Username" required>
    <label for="password">Password:</label>
    <input id="password" name="password" type="password" placeholder="Password" required>
    <button type="submit">Login</button>
</form>
<p>Don't have an account? <a href="/register.php">Sign up</a></p>

<?php
include_once "templates/footer.php";
?>