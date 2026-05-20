const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Router dosyalarını dahil etme
const openingRoutes = require('./routes/openingRoutes');
const matchRoutes = require('./routes/matchRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware'ler
app.use(cors());
app.use(express.json()); // JSON formatındaki istek gövdelerini (body) parse eder
app.use(express.static(path.join(__dirname, 'public'))); // Frontend dosyalarını statik olarak sunar

// Swagger Yapılandırması
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Chess Logger API',
            version: '1.0.0',
            description: 'Satranç Maç Günlüğü için REST API Dokümantasyonu',
            contact: {
                name: 'Geliştirici',
            },
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Geliştirme Sunucusu',
            },
        ],
    },
    // Route dosyalarındaki JSDoc yorumlarını analiz ederek dokümantasyon oluşturur
    apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Yönlendirmeleri (İş mantığı controllers klasöründedir)
app.use('/api/openings', openingRoutes);
app.use('/api/matches', matchRoutes);

// SPA ve 404 Yönetimi
app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
        // API isteği ise ve buraya kadar geldiyse 404'tür
        res.status(404).json({ error: "API Endpoint Bulunamadı" });
    } else if (req.method === 'GET') {
        // API dışındaki tüm GET isteklerini index.html'e yönlendir (SPA desteği)
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        next();
    }
});

// Sunucuyu başlatma
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
    console.log(`API Dokümantasyonu: http://localhost:${PORT}/api-docs`);
    console.log(`=========================================`);
});
