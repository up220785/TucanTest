const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    db.all('SELECT * FROM C_Preguntas', [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

router.get('/:id', (req, res) => {
    db.get('SELECT * FROM C_Preguntas WHERE Pre_IdPregunta = ?', [req.params.id], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(row);
    });
});

router.post('/', (req, res) => {
    const { Pre_TextoPregunta, Pre_TipoPregunta, Pre_obligatorioPregunta, Pre_TextoRespuestaPregunta } = req.body;
    db.run(
        'INSERT INTO C_Preguntas (Pre_TextoPregunta, Pre_TipoPregunta, Pre_obligatorioPregunta, Pre_TextoRespuestaPregunta) VALUES (?, ?, ?, ?)',
        [Pre_TextoPregunta, Pre_TipoPregunta, Pre_obligatorioPregunta, Pre_TextoRespuestaPregunta],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Pregunta creada correctamente' });
        }
    );
});

router.put('/:id', (req, res) => {
    const { Pre_TextoPregunta, Pre_TipoPregunta, Pre_obligatorioPregunta, Pre_TextoRespuestaPregunta } = req.body;
    db.run(
        'UPDATE C_Preguntas SET Pre_TextoPregunta = ?, Pre_TipoPregunta = ?, Pre_obligatorioPregunta = ?, Pre_TextoRespuestaPregunta = ? WHERE Pre_IdPregunta = ?',
        [Pre_TextoPregunta, Pre_TipoPregunta, Pre_obligatorioPregunta, Pre_TextoRespuestaPregunta, req.params.id],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ changes: this.changes, message: 'Pregunta actualizada correctamente' });
        }
    );
});

router.delete('/:id', (req, res) => {
    db.run('DELETE FROM C_Preguntas WHERE Pre_IdPregunta = ?', [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ changes: this.changes, message: 'Pregunta eliminada correctamente' });
    });
});

module.exports = router;