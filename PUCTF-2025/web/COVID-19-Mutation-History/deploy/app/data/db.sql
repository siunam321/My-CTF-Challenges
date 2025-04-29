CREATE DATABASE ctf;
USE ctf;

CREATE TABLE entries (
    entryId INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    entryDetails TEXT,
    protected BOOLEAN
);

CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    details TEXT,
    reviewToken TEXT
);

INSERT INTO entries VALUES(1, "Flag Variant (F.1.3.3.7)", "PUCTF25{mUt4T1ON_x55_15_4l5o_4NoTH3r_cOv1d19_MUt4t1oN_v4R14Nt_55b02133dcd0b67440bc04a47c5d16e2}", 1);

INSERT INTO entries VALUES(2, "Alpha Variant (B.1.1.7)", "This variant was first identified in the <strong>United Kingdom</strong> and is associated with <em>increased transmissibility</em>. It has mutations in the spike protein of the virus.", 0);
INSERT INTO entries VALUES(3, "Beta Variant (B.1.351)", "Originating in <strong>South Africa</strong>, this variant has mutations that may <em>affect the efficacy of certain vaccines</em>. It also has changes in the spike protein.", 0);
INSERT INTO entries VALUES(4, "Delta Variant (B.1.617.2)", "Initially identified in <strong>India</strong>, the Delta variant is <em>highly transmissible</em> and has spread globally. It has mutations that may enhance its ability to infect cells.", 0);
INSERT INTO entries VALUES(5, "Omicron Variant (B.1.1.529)", "The Omicron variant, first detected in late 2021, has a large number of mutations, particularly in the spike protein. It is notable for its potential for increased transmissibility.", 0);