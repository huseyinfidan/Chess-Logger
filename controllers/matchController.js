const db = require('../db/database');

// Bütün maçları getir (Açılış bilgisiyle birlikte LEFT JOIN yaparak)
exports.getAllMatches = (req, res) => {
    const sql = `
        SELECT m.id, m.opponentName, m.playedAs, m.result, m.date, m.notes, m.pgn, m.playerRating, o.name as openingName, m.openingId
        FROM matches m
        LEFT JOIN openings o ON m.openingId = o.id
        ORDER BY m.date DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
};

// Tek bir maç detayını getir
exports.getMatchById = (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM matches WHERE id = ?", [id], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!row) {
            return res.status(404).json({ error: "Maç bulunamadı." });
        }
        res.json(row);
    });
};

// Yeni maç ekle
exports.createMatch = (req, res) => {
    const { opponentName, playedAs, result, openingId, date, notes, pgn, playerRating } = req.body;
    
    // Zorunlu alanların kontrolü
    if (!opponentName || !playedAs || !result || !date) {
        return res.status(400).json({ error: "Rakip adı, renk (playedAs), sonuç ve tarih zorunludur." });
    }

    const sql = `INSERT INTO matches (opponentName, playedAs, result, openingId, date, notes, pgn, playerRating) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [
        opponentName, 
        playedAs, 
        result, 
        openingId || null, 
        date, 
        notes || null, 
        pgn || null, 
        playerRating ? parseInt(playerRating) : null
    ];
    
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ 
            id: this.lastID, opponentName, playedAs, result, openingId, date, notes, pgn, playerRating 
        });
    });
};

// Mevcut bir maçı güncelle
exports.updateMatch = (req, res) => {
    const { id } = req.params;
    const { opponentName, playedAs, result, openingId, date, notes, pgn, playerRating } = req.body;

    const sql = `UPDATE matches 
                 SET opponentName = ?, playedAs = ?, result = ?, openingId = ?, date = ?, notes = ?, pgn = ?, playerRating = ? 
                 WHERE id = ?`;
    const params = [
        opponentName, 
        playedAs, 
        result, 
        openingId || null, 
        date, 
        notes || null, 
        pgn || null, 
        playerRating ? parseInt(playerRating) : null,
        id
    ];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Güncellenecek maç bulunamadı." });
        }
        res.json({ message: "Maç başarıyla güncellendi." });
    });
};

// Maç sil
exports.deleteMatch = (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM matches WHERE id = ?", id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Silinecek maç bulunamadı." });
        }
        res.json({ message: "Maç başarıyla silindi." });
    });
};

// Dashboard Maç İstatistiklerini Getir
exports.getMatchStats = (req, res) => {
    const stats = {};
    
    // Genel Maç Dağılımı (Kazanma, Kaybetme, Beraberlik)
    const sqlOverall = `
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN result = 'Galibiyet' THEN 1 ELSE 0 END) as wins,
            SUM(CASE WHEN result = 'Mağlubiyet' THEN 1 ELSE 0 END) as losses,
            SUM(CASE WHEN result = 'Beraberlik' THEN 1 ELSE 0 END) as draws
        FROM matches
    `;

    db.get(sqlOverall, [], (err, overallRow) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        
        stats.overall = overallRow || { total: 0, wins: 0, losses: 0, draws: 0 };

        // Taş rengine (Beyaz/Siyah) göre galibiyet dağılımı
        const sqlColor = `
            SELECT playedAs, result, COUNT(*) as count 
            FROM matches 
            GROUP BY playedAs, result
        `;
        
        db.all(sqlColor, [], (err, colorRows) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            stats.byColor = colorRows;

            // Zaman içindeki ELO gelişimini (tarih sırasıyla) getir
            const sqlRatings = `
                SELECT date, playerRating 
                FROM matches 
                WHERE playerRating IS NOT NULL AND playerRating != ''
                ORDER BY date ASC
            `;

            db.all(sqlRatings, [], (err, ratingRows) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                stats.ratings = ratingRows;
                res.json(stats);
            });
        });
    });
};

// Maçları toplu içe aktarma (Import)
exports.bulkImportMatches = (req, res) => {
    const matches = req.body;
    
    if (!Array.isArray(matches)) {
        return res.status(400).json({ error: "Gövde verisi bir dizi (array) olmalıdır." });
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        
        const stmt = db.prepare(`
            INSERT INTO matches (opponentName, playedAs, result, openingId, date, notes, pgn, playerRating) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);

        try {
            matches.forEach(m => {
                stmt.run(
                    m.opponentName,
                    m.playedAs,
                    m.result,
                    m.openingId || null,
                    m.date,
                    m.notes || null,
                    m.pgn || null,
                    m.playerRating ? parseInt(m.playerRating) : null
                );
            });
            
            stmt.finalize();
            
            db.run("COMMIT", (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: `${matches.length} adet maç başarıyla içe aktarıldı.` });
            });
        } catch (error) {
            db.run("ROLLBACK");
            res.status(500).json({ error: error.message });
        }
    });
};
