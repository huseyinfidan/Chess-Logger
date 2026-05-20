const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Match:
 *       type: object
 *       required:
 *         - opponentName
 *         - playedAs
 *         - result
 *         - date
 *       properties:
 *         id:
 *           type: integer
 *           description: Maçın otomatik oluşturulan ID'si
 *         opponentName:
 *           type: string
 *           description: Rakibin adı
 *         playedAs:
 *           type: string
 *           description: Oynanan renk (Beyaz veya Siyah)
 *         result:
 *           type: string
 *           description: Maçın sonucu (Galibiyet, Mağlubiyet, Beraberlik)
 *         openingId:
 *           type: integer
 *           description: Oynanan açılışın ID'si
 *         date:
 *           type: string
 *           format: date
 *           description: Maçın oynandığı tarih (YYYY-MM-DD)
 *         notes:
 *           type: string
 *           description: Maç hakkında genel notlar
 *         pgn:
 *           type: string
 *           description: Maçın PGN (hamle) kaydı
 */

/**
 * @swagger
 * /api/matches:
 *   get:
 *     summary: Tüm maçları listeler
 *     tags: [Matches]
 *     responses:
 *       200:
 *         description: Maçların listesi başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Match'
 */
router.get('/', matchController.getAllMatches);

/**
 * @swagger
 * /api/matches/stats:
 *   get:
 *     summary: Genel maç istatistiklerini getirir (Dashboard için)
 *     tags: [Matches]
 *     responses:
 *       200:
 *         description: İstatistik verileri başarıyla getirildi
 */
router.get('/stats', matchController.getMatchStats);

/**
 * @swagger
 * /api/matches/bulk:
 *   post:
 *     summary: Birden fazla maçı toplu olarak veritabanına aktarır (Import)
 *     tags: [Matches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Match'
 *     responses:
 *       200:
 *         description: Toplu içe aktarma başarılı
 */
router.post('/bulk', matchController.bulkImportMatches);

/**
 * @swagger
 * /api/matches/{id}:
 *   get:
 *     summary: ID'ye göre maç getirir
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Maç ID'si
 *     responses:
 *       200:
 *         description: Maç detayı getirildi
 *       404:
 *         description: Maç bulunamadı
 */
router.get('/:id', matchController.getMatchById);

/**
 * @swagger
 * /api/matches:
 *   post:
 *     summary: Yeni bir maç kaydı ekler
 *     tags: [Matches]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Match'
 *     responses:
 *       201:
 *         description: Maç başarıyla eklendi
 *       400:
 *         description: Eksik parametre hatası
 */
router.post('/', matchController.createMatch);

/**
 * @swagger
 * /api/matches/{id}:
 *   put:
 *     summary: Mevcut bir maç kaydını günceller
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Maç ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Match'
 *     responses:
 *       200:
 *         description: Maç başarıyla güncellendi
 *       404:
 *         description: Maç bulunamadı
 */
router.put('/:id', matchController.updateMatch);

/**
 * @swagger
 * /api/matches/{id}:
 *   delete:
 *     summary: Belirtilen ID'ye sahip maçı siler
 *     tags: [Matches]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Maç ID'si
 *     responses:
 *       200:
 *         description: Maç başarıyla silindi
 *       404:
 *         description: Maç bulunamadı
 */
router.delete('/:id', matchController.deleteMatch);

module.exports = router;
