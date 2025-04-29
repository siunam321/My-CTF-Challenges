<?php
defined("ADMIN_USERNAME") or die("No direct access");

header(CSP_HEADER);
if (session_status() === PHP_SESSION_NONE) {
    session_start(COOKIE_ATTRIBUTES);
}

function isAuthenticated() {
    if (!isset($_SESSION["username"])) {
        return false;
    }
    
    return true;
}

function validateSession() {
    if (!isAuthenticated()) {
        header("Location: /login.php");
        die();
    }
}

function isAdmin() {
    if (!isset($_SESSION["username"])) {
        return false;
    }

    if ($_SESSION["username"] !== ADMIN_USERNAME) {
        return false;
    }

    return true;
}

function validateLogin($username, $password) {
    // currently we only support the admin user :(
    if ($username === ADMIN_USERNAME && $password === ADMIN_PASSWORD) {
        return true;
    } else {
        return false;
    }
}

function logout() {
    session_destroy();
    header("Location: /login.php");
    die();
}

function sanitizeHTML($unsafeHtml) {
    $dom = new DOMDocument();
    $dom->loadHTML($unsafeHtml, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);

    $xpath = new DOMXPath($dom);
    // we don't want HTML comments
    $comments = $xpath->query("//comment()");
    foreach ($comments as $comment) {
        $comment->parentNode->removeChild($comment);
    }

    $elements = $dom->getElementsByTagName("*");
    for ($i = $elements->length - 1; $i >= 0; $i--) {
        $element = $elements->item($i);

        // only allow whitelisted HTML tags, as defined in 
        // constant variable `ALLOWED_HTML_TAGS`
        if (!isset(ALLOWED_HTML_TAGS[$element->nodeName])) {
            $parent = $element->parentNode;
            $parent->removeChild($element);
        }

        // we don't want any attributes in all HTML elements
        while ($element->hasAttributes()) {
            $attributeName = $element->attributes->item(0)->name;
            $element->removeAttribute($attributeName);
        }
    }

    // remove HTML element `DOCTYPE`
    return preg_replace("/<!DOCTYPE\s+HTML.*>/", "", $dom->saveHTML());
}