const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    db.all('SELECT * FROM C_Usuarios', [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

router.get('/:id', (req, res) => {
    db.get('SELECT * FROM C_Usuarios WHERE Cusu_IdUsuario = ?', [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(row);
    });
});

router.post('/', (req, res) => {
    const { Cusu_Nombre, Cusu_CorreoElectronico, Cusu_Tipo, Cusu_edo } = req.body;
    db.run(
        'INSERT INTO C_Usuarios (Cusu_Fecha_de_registro, Cusu_Nombre, Cusu_CorreoElectronico, Cusu_Tipo, Cusu_edo) VALUES (date("now"), ?, ?, ?, ?)',
        [Cusu_Nombre, Cusu_CorreoElectronico, Cusu_Tipo, Cusu_edo],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({
                id: this.lastID,
                message: 'User created successfully'
            });
        }
    );
});

router.put('/:id', (req, res) => {
    const { Cusu_Nombre, Cusu_CorreoElectronico, Cusu_Tipo, Cusu_edo } = req.body;
    db.run(
        'UPDATE C_Usuarios SET Cusu_Nombre = ?, Cusu_CorreoElectronico = ?, Cusu_Tipo = ?, Cusu_edo = ? WHERE Cusu_IdUsuario = ?',
        [Cusu_Nombre, Cusu_CorreoElectronico, Cusu_Tipo, Cusu_edo, req.params.id],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({
                changes: this.changes,
                message: 'User updated successfully'
            });
        }
    );
});

router.delete('/:id', (req, res) => {
    db.run(
        'DELETE FROM C_Usuarios WHERE Cusu_IdUsuario = ?',
        [req.params.id],
        function (err) {
            if (err) {
                res.status(400).json({ error: err.message });
                return;
            }
            res.json({
                changes: this.changes,
                message: 'User deleted successfully'
            });
        }
    );
});

module.exports = router;