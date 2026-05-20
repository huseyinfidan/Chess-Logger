const express = require('express');
const router = express.Router();
const openingController = require('../controllers/openingController');

/**
 * @swagger
 * components:
 *   schemas:
 *     Opening:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         id:
 *           type: integer
 *           description: Açılışın otomatik oluşturulan ID'si
 *         name:
 *           type: string
 *           description: Açılışın adı (Örn. Sicilya Savunması)
 *         type:
 *           type: string
 *           description: Açılışın türü (Açık, Kapalı, Yarı Açık vb.)
 */

/**
 * @swagger
 * /api/openings:
 *   get:
 *     summary: Tüm açılışları listeler
 *     tags: [Openings]
 *     responses:
 *       200:
 *         description: Açılışların listesi başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Opening'
 */
router.get('/', openingController.getAllOpenings);

/**
 * @swagger
 * /api/openings/stats:
 *   get:
 *     summary: Açılışların maç istatistiklerini (tercih edilme ve kazanma oranlarını) getirir
 *     tags: [Openings]
 *     responses:
 *       200:
 *         description: İstatistikler başarıyla getirildi
 */
router.get('/stats', openingController.getOpeningStats);

/**
 * @swagger
 * /api/openings:
 *   post:
 *     summary: Yeni bir açılış ekler
 *     tags: [Openings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Opening'
 *     responses:
 *       201:
 *         description: Açılış başarıyla oluşturuldu
 *       400:
 *         description: Eksik parametre hatası
 */
router.post('/', openingController.createOpening);

/**
 * @swagger
 * /api/openings/{id}:
 *   delete:
 *     summary: Belirtilen ID'ye sahip açılışı siler
 *     tags: [Openings]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Açılış ID'si
 *     responses:
 *       200:
 *         description: Açılış başarıyla silindi
 *       404:
 *         description: Açılış bulunamadı
 */
router.delete('/:id', openingController.deleteOpening);

module.exports = router;
