const db = require('../db/database');

// Bütün açılışları getir
exports.getAllOpenings = (req, res) => {
    db.all("SELECT * FROM openings", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
};

// Yeni açılış ekle
exports.createOpening = (req, res) => {
    const { name, type } = req.body;
    
    // Basit bir validasyon
    if (!name || !type) {
        return res.status(400).json({ error: "Name ve type alanları zorunludur." });
    }
    
    const sql = "INSERT INTO openings (name, type) VALUES (?, ?)";
    db.run(sql, [name, type], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, name, type });
    });
};

// Açılış sil
exports.deleteOpening = (req, res) => {
    const { id } = req.params;
    db.run("DELETE FROM openings WHERE id = ?", id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "Silinecek açılış bulunamadı." });
        }
        res.json({ message: "Açılış başarıyla silindi." });
    });
};

// Açılış Bazlı Başarı Analitiğini Getir
exports.getOpeningStats = (req, res) => {
    const sql = `
        SELECT 
            o.id,
            o.name,
            o.type,
            COUNT(m.id) as totalMatches,
            SUM(CASE WHEN m.result = 'Galibiyet' THEN 1 ELSE 0 END) as wins,
            SUM(CASE WHEN m.result = 'Mağlubiyet' THEN 1 ELSE 0 END) as losses,
            SUM(CASE WHEN m.result = 'Beraberlik' THEN 1 ELSE 0 END) as draws,
            ROUND((CAST(SUM(CASE WHEN m.result = 'Galibiyet' THEN 1 ELSE 0 END) AS REAL) / COUNT(m.id)) * 100, 2) as winRate
        FROM openings o
        INNER JOIN matches m ON o.id = m.openingId
        GROUP BY o.id, o.name, o.type
        ORDER BY totalMatches DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
};
