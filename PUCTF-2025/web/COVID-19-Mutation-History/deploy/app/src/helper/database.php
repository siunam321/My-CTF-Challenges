<?php
defined("ADMIN_USERNAME") or die("No direct access");

class Database {
    public $connection;

    function __construct() {
        $this->connection = $this->connectDatabase();
    }

    function connectDatabase() {
        $connection = new mysqli(DATABASE_HOSTNAME, DATABASE_USERNAME, DATABASE_PASSWORD, DATABASE_NAME);
        if ($connection->connect_error) {
            die("MySQL connection failed. Please contact admin if this happened during the CTF on the remote instance.");
        }
        return $connection;
    }

    function fetchMutationEntries() {
        $sql = "SELECT * FROM entries";
        $result = $this->connection->query($sql);
        if ($result->num_rows > 0) {
            return mysqli_fetch_all($result, MYSQLI_ASSOC);
        } else {
            return false;
        }
    }

    function fetchMutationEntryById($entryId) {
        $sql = "SELECT * FROM entries WHERE entryId = ?";
        $preparedStatement = $this->connection->prepare($sql);
        $preparedStatement->bind_param("i", $entryId);

        $preparedStatement->execute();
        $result = $preparedStatement->get_result();
        $row = $result->fetch_assoc();
        if (empty($row)) {
            return false;
        } else {
            return $row;
        }
    }

    function fetchReviewByToken($id, $token) {
        $sql = "SELECT * FROM reviews WHERE id = ? AND reviewToken = ?";
        $preparedStatement = $this->connection->prepare($sql);
        $preparedStatement->bind_param("is", $id, $token);

        $preparedStatement->execute();
        $result = $preparedStatement->get_result();
        $row = $result->fetch_assoc();
        if (empty($row)) {
            return false;
        } else {
            return $row;
        }
    }

    function insertNewReviewMutationEntry($title, $details, $reviewToken) {
        $sql = "INSERT INTO reviews (title, details, reviewToken) VALUES(?, ?, ?)";
        $preparedStatement = $this->connection->prepare($sql);
        $preparedStatement->bind_param("sss", $title, $details, $reviewToken);

        $preparedStatement->execute();
        if ($preparedStatement->error) {
            return false;
        }

        return $preparedStatement->insert_id;
    }
}