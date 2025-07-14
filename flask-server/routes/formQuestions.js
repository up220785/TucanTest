const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    db.all('SELECT * FROM T_Comentarios', [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

router.get('/:id', (req, res) => {
    db.get('SELECT * FROM T_Comentarios WHERE Com_IdComentario = ?', [req.params.id], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(row);
    });
});

router.post('/', (req, res) => {
    const { Com_IdUsuario, Com_IdFormulario, Com_Texto, Com_Idpregunta } = req.body;
    db.run(
        'INSERT INTO T_Comentarios (Com_IdUsuario, Com_IdFormulario, Com_Texto, Com_Fecha, Com_Idpregunta) VALUES (?, ?, ?, date("now"), ?)',
        [Com_IdUsuario, Com_IdFormulario, Com_Texto, Com_Idpregunta],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Comentario creado correctamente' });
        }
    );
});

router.put('/:id', (req, res) => {
    const { Com_IdUsuario, Com_IdFormulario, Com_Texto, Com_Idpregunta } = req.body;
    db.run(
        'UPDATE T_Comentarios SET Com_IdUsuario = ?, Com_IdFormulario = ?, Com_Texto = ?, Com_Idpregunta = ? WHERE Com_IdComentario = ?',
        [Com_IdUsuario, Com_IdFormulario, Com_Texto, Com_Idpregunta, req.params.id],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ changes: this.changes, message: 'Comentario actualizado correctamente' });
        }
    );
});

router.delete('/:id', (req, res) => {
    db.run('DELETE FROM T_Comentarios WHERE Com_IdComentario = ?', [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ changes: this.changes, message: 'Comentario eliminado correctamente' });
    });
});

module.exports = router;