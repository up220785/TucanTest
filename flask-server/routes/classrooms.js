const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    db.all('SELECT * FROM T_Aula', [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

router.get('/:id', (req, res) => {
    db.get('SELECT * FROM T_Aula WHERE Taul_IdAula = ?', [req.params.id], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(row);
    });
});

router.post('/', (req, res) => {
    const { Taul_Nombre, Taul_IdUsuario, Taul_Descripcion, Taul_edo } = req.body;
    db.run(
        'INSERT INTO T_Aula (Taul_Nombre, Taul_IdUsuario, Taul_Fecha_Registro, Taul_Descripcion, Taul_edo) VALUES (?, ?, date("now"), ?, ?)',
        [Taul_Nombre, Taul_IdUsuario, Taul_Descripcion, Taul_edo],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Aula creada correctamente' });
        }
    );
});

router.put('/:id', (req, res) => {
    const { Taul_Nombre, Taul_IdUsuario, Taul_Descripcion, Taul_edo } = req.body;
    db.run(
        'UPDATE T_Aula SET Taul_Nombre = ?, Taul_IdUsuario = ?, Taul_Descripcion = ?, Taul_edo = ? WHERE Taul_IdAula = ?',
        [Taul_Nombre, Taul_IdUsuario, Taul_Descripcion, Taul_edo, req.params.id],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ changes: this.changes, message: 'Aula actualizada correctamente' });
        }
    );
});

router.delete('/:id', (req, res) => {
    db.run('DELETE FROM T_Aula WHERE Taul_IdAula = ?', [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ changes: this.changes, message: 'Aula eliminada correctamente' });
    });
});

module.exports = router;