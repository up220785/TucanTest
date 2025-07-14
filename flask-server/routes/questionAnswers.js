const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todas las respuestas
router.get('/', (req, res) => {
    db.all('SELECT * FROM C_Respuestas', [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

// Obtener una respuesta por ID
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM C_Respuestas WHERE Res_IdRespuesta = ?', [req.params.id], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(row);
    });
});

// Crear una nueva respuesta
router.post('/', (req, res) => {
    const { Res_TextoRespuesta, Res_ValorRespuesta } = req.body;
    db.run(
        'INSERT INTO C_Respuestas (Res_TextoRespuesta, Res_ValorRespuesta) VALUES (?, ?)',
        [Res_TextoRespuesta, Res_ValorRespuesta],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Respuesta creada correctamente' });
        }
    );
});

// Actualizar una respuesta existente
router.put('/:id', (req, res) => {
    const { Res_TextoRespuesta, Res_ValorRespuesta } = req.body;
    db.run(
        'UPDATE C_Respuestas SET Res_TextoRespuesta = ?, Res_ValorRespuesta = ? WHERE Res_IdRespuesta = ?',
        [Res_TextoRespuesta, Res_ValorRespuesta, req.params.id],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ changes: this.changes, message: 'Respuesta actualizada correctamente' });
        }
    );
});

// Eliminar una respuesta
router.delete('/:id', (req, res) => {
    db.run('DELETE FROM C_Respuestas WHERE Res_IdRespuesta = ?', [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ changes: this.changes, message: 'Respuesta eliminada correctamente' });
    });
});

module.exports = router;