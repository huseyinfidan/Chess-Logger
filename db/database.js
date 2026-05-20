const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Veritabanı dosyası için yol belirliyoruz
const dbPath = path.resolve(__dirname, 'chesslogger.db');

// SQLite veritabanına bağlanıyoruz
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Veritabanına bağlanırken hata oluştu:', err.message);
    } else {
        console.log('SQLite veritabanına başarıyla bağlanıldı.');
        initDb();
    }
});

// Veritabanı tablolarını başlatan fonksiyon
function initDb() {
    db.serialize(() => {
        // Açılışlar (openings) tablosu
        db.run(`CREATE TABLE IF NOT EXISTS openings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            type TEXT NOT NULL
        )`);

        // Maçlar (matches) tablosu
        db.run(`CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            opponentName TEXT NOT NULL,
            playedAs TEXT NOT NULL,
            result TEXT NOT NULL,
            openingId INTEGER,
            date TEXT NOT NULL,
            notes TEXT,
            pgn TEXT,
            playerRating INTEGER,
            FOREIGN KEY(openingId) REFERENCES openings(id)
        )`);

        // Eski veritabanı dosyaları için kolon ekleme migrasyonu
        db.run(`ALTER TABLE matches ADD COLUMN notes TEXT`, (err) => {
            // Kolon zaten varsa hata verecektir, yoksayıyoruz
        });
        db.run(`ALTER TABLE matches ADD COLUMN pgn TEXT`, (err) => {
            // Kolon zaten varsa hata verecektir, yoksayıyoruz
        });
        db.run(`ALTER TABLE matches ADD COLUMN playerRating INTEGER`, (err) => {
            // Kolon zaten varsa hata verecektir, yoksayıyoruz
        });

        // Eğer açılışlar tablosu boşsa varsayılan bazı açılışları ekleyelim
        db.get("SELECT COUNT(*) AS count FROM openings", (err, row) => {
            if (!err && row.count === 0) {
                const stmt = db.prepare("INSERT INTO openings (name, type) VALUES (?, ?)");
                stmt.run("Sicilya Savunması", "Yarı Açık");
                stmt.run("İspanyol Açılışı (Ruy Lopez)", "Açık");
                stmt.run("Vezir Gambiti", "Kapalı");
                stmt.run("Fransız Savunması", "Yarı Açık");
                stmt.run("Caro-Kann Savunması", "Yarı Açık");
                stmt.finalize();
                console.log("Varsayılan satranç açılışları eklendi.");
            }
        });
    });
}

module.exports = db;
