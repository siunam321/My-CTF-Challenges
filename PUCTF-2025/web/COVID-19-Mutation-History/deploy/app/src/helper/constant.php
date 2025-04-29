<?php
define("SITE_TITLE", "COVID-19 Mutation History");

define("ADMIN_USERNAME", getenv("ADMIN_USERNAME") ?: "admin");
define("ADMIN_PASSWORD", getenv("ADMIN_PASSWORD") ?: "very_secure_password_do_not_attempt_to_brute_force_it");

define("DATABASE_HOSTNAME", "localhost");
define("DATABASE_USERNAME", getenv("DATABASE_USERNAME") ?: "root");
define("DATABASE_PASSWORD", getenv("DATABASE_PASSWORD") ?: "root");
define("DATABASE_NAME", getenv("DATABASE_NAME") ?: "ctf");

define("COOKIE_ATTRIBUTES", array(
    "cookie_httponly" => true,
    "cookie_samesite" => "Strict"
));

define("CSP_HEADER", "Content-Security-Policy: default-src 'self'; script-src 'unsafe-inline';");

define("ALLOWED_HTML_TAGS", array_flip(array("p", "strong", "b", "em", "ul", "ol", "li")));