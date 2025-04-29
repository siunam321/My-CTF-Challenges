const sqlite3 = require('sqlite3');
const utils = require('./helper');
const FLAG = process.env.FLAG || 'PUCTF25{fake_flag_do_not_submit}';
const ADMIN_USERNAME = 'administrator';
const AUTHOR_USERNAME = process.env.AUTHOR_USERNAME || 'siunam';
const DEFAULT_ROLE = 'guest';
const DEFAULT_APPROVAL = 0; // 0 = Not approved, 1 = Approved

const adminPassword = ADMIN_USERNAME + '|' + utils.generateSecureRandomString(24);
const adminPasswordHash = utils.hashPassword(adminPassword);

const realAuthorPassword = process.env.AUTHOR_PASSWORD || utils.generateSecureRandomString(24);
const authorPassword = AUTHOR_USERNAME + '|' + realAuthorPassword;
const authorPasswordHash = utils.hashPassword(authorPassword);

var db;
function initDatabase() {
    db = new sqlite3.Database(':memory:', (err) => {
        if (err) {
            console.error(`[-] Unable to connect to the SQLite database. Please contact admin if this happened during the CTF. Error message: ${err.message}`);
            throw err;
        }
        console.log('[+] Connected to the SQLite database.');
    });

    db.serialize(() => {
        db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT, role TEXT CHECK(role IN ("admin", "author", "guest")))');
        db.run('CREATE TABLE IF NOT EXISTS memos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, body TEXT, approved BOOLEAN, visibility BOOLEAN, username TEXT, FOREIGN KEY(username) REFERENCES user(username))');
        
        db.run(`INSERT OR REPLACE INTO users (id, username, password, role) VALUES (1, '${ADMIN_USERNAME}', '${adminPasswordHash}', 'admin')`);
        db.run(`INSERT OR REPLACE INTO users (id, username, password, role) VALUES (2, '${AUTHOR_USERNAME}', '${authorPasswordHash}', 'author')`);
        
        db.run(`INSERT OR REPLACE INTO memos (id, title, body, approved, visibility, username) VALUES (1, 'Flag Memo', '${FLAG}', 1, 0, '${ADMIN_USERNAME}')`);
        db.run(`INSERT OR REPLACE INTO memos (id, title, body, approved, visibility, username) VALUES (2, 'Hello World!', 'Lorem ipsum odor amet, consectetuer adipiscing elit. Molestie in class accumsan lorem imperdiet. Donec pharetra orci cursus erat ligula. Cras est phasellus orci commodo varius aliquam netus at inceptos. Felis sodales volutpat hendrerit tellus mus ultricies ligula praesent fames. Pellentesque maximus ornare faucibus eu, congue vel quam. Platea erat venenatis nisl congue platea fermentum nascetur maximus. Class curabitur vitae torquent pulvinar maximus convallis.', 1, 1, '${AUTHOR_USERNAME}')`);
    });

    console.log(`[*] Admin "${ADMIN_USERNAME}" password: ${adminPassword} | Hash: ${adminPasswordHash}`);
    console.log(`[*] Author "${AUTHOR_USERNAME}" password: ${authorPassword} | Hash: ${authorPasswordHash}`);
}

function getApprovedPublicMemos() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM memos WHERE approved = 1 AND visibility = 1', (err, rows) => {
            if (err) {
                reject(err);
            }

            resolve(rows);
        });
    });
}

function getUnapprovedPublicMemos() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM memos WHERE approved = 0 AND visibility = 1', (err, rows) => {
            if (err) {
                reject(err);
            }

            resolve(rows);
        });
    });
}

function getMemosByUsername(username) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM memos WHERE username = ?', [username], (err, rows) => {
            if (err) {
                reject(err);
            }

            resolve(rows);
        });
    });
}

function getMemoById(memoId) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM memos WHERE id = ?', [memoId], (err, row) => {
            if (err) {
                reject(err);
            }

            resolve(row);
        });
    });
}

function createMemo(username, title, content, visibility) {
    (visibility === 'public') ? visibility = 1 : visibility = 0;
    (visibility === 0) ? approved = 1 : approved = DEFAULT_APPROVAL; // private memo doesn't require approval

    return new Promise((resolve, reject) => {
        db.run('INSERT INTO memos (title, body, approved, visibility, username) VALUES (?, ?, ?, ?, ?)', [title, content, approved, visibility, username], (err) => {
            if (err) {
                reject(err);
            }

            resolve();
        });
    });
}

function approveMemo(memoId) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE memos SET approved = 1 WHERE id = ?', [memoId], (err) => {
            if (err) {
                reject(err);
            }

            resolve();
        });
    });
}

function updateMemo(memoId, title, content, visibility) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE memos SET title = ?, body = ?, visibility = ? WHERE id = ?', [title, content, visibility, memoId], (err) => {
            if (err) {
                reject(err);
            }

            resolve();
        });
    });
}

function getUserByUsername(username) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
            if (err) {
                reject(err);
            }

            resolve(row);
        });
    });
}

async function isDuplicateUsername(username) {
    return await getUserByUsername(username).then((rows) => {
        return !!rows;
    }).catch((err) => {
        return false;
    });
}

function register(username, password) {
    return new Promise((resolve, reject) => {
        const passwordHash = utils.hashPassword(`${username}|${password}`);
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, passwordHash, DEFAULT_ROLE], (err) => {
            if (err) {
                reject(err);
            }

            resolve();
        });
    });
}

function login(username, password) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
            if (err) {
                reject(err);
            }
            
            if (!row || !utils.checkPassword(`${username}|${password}`, row.password)) {
                resolve(false);
            }

            resolve(row);
        });
    });
}

function updateUsername(userId, newUsername, password) {
    const realPassword = password.split('|')[1];
    const newPassword = `${newUsername}|${realPassword}`;
    const newPasswordHash = utils.hashPassword(newPassword);
    return new Promise((resolve, reject) => {
        db.run('UPDATE users SET username = ?, password = ? WHERE id = ?', [newUsername, newPasswordHash, userId], (err) => {
            if (err) {
                reject(err);
            }

            resolve(newPassword);
        });
    });
}

module.exports = {
    initDatabase,
    getApprovedPublicMemos,
    getUnapprovedPublicMemos,
    getMemosByUsername,
    getMemoById,
    createMemo,
    approveMemo,
    updateMemo,
    getUserByUsername,
    isDuplicateUsername,
    register,
    login,
    updateUsername
};