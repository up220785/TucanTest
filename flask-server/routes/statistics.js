const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todas las estadísticas
router.get('/', (req, res) => {
    db.all('SELECT * FROM T_Estadisticas', [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

// Obtener una estadística por ID
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM T_Estadisticas WHERE Esta_IdEstadistica = ?', [req.params.id], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(row);
    });
});

// Crear nueva estadística
router.post('/', (req, res) => {
    const {
        Esta_IdFormulario,
        Esta_PromedioEstadistica,
        Esta_MaximoEstadistica,
        Esta_MinimoEstadistica,
        Esta_TipoEstadistica,
        Esta_DescripcionEstadistica
    } = req.body;

    db.run(
        'INSERT INTO T_Estadisticas (Esta_IdFormulario, Esta_PromedioEstadistica, Esta_MaximoEstadistica, Esta_MinimoEstadistica, Esta_TipoEstadistica, Esta_DescripcionEstadistica) VALUES (?, ?, ?, ?, ?, ?)',
        [Esta_IdFormulario, Esta_PromedioEstadistica, Esta_MaximoEstadistica, Esta_MinimoEstadistica, Esta_TipoEstadistica, Esta_DescripcionEstadistica],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Estadística creada correctamente' });
        }
    );
});

// Actualizar estadística existente
router.put('/:id', (req, res) => {
    const {
        Esta_IdFormulario,
        Esta_PromedioEstadistica,
        Esta_MaximoEstadistica,
        Esta_MinimoEstadistica,
        Esta_TipoEstadistica,
        Esta_DescripcionEstadistica
    } = req.body;

    db.run(
        'UPDATE T_Estadisticas SET Esta_IdFormulario = ?, Esta_PromedioEstadistica = ?, Esta_MaximoEstadistica = ?, Esta_MinimoEstadistica = ?, Esta_TipoEstadistica = ?, Esta_DescripcionEstadistica = ? WHERE Esta_IdEstadistica = ?',
        [Esta_IdFormulario, Esta_PromedioEstadistica, Esta_MaximoEstadistica, Esta_MinimoEstadistica, Esta_TipoEstadistica, Esta_DescripcionEstadistica, req.params.id],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ changes: this.changes, message: 'Estadística actualizada correctamente' });
        }
    );
});

// Eliminar estadística
router.delete('/:id', (req, res) => {
    db.run('DELETE FROM T_Estadisticas WHERE Esta_IdEstadistica = ?', [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ changes: this.changes, message: 'Estadística eliminada correctamente' });
    });
});

module.exports = router;