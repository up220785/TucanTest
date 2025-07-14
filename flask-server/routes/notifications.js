const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    db.all('SELECT * FROM T_Notificaciónes', [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

router.get('/:id', (req, res) => {
    db.get('SELECT * FROM T_Notificaciónes WHERE Noti_IdNotificacion = ?', [req.params.id], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(row);
    });
});

router.post('/', (req, res) => {
    const { Noti_IdUsuario, Noti_Mensaje, Noti_Estado } = req.body;
    db.run(
        'INSERT INTO T_Notificaciónes (Noti_IdUsuario, Noti_Fecha, Noti_Mensaje, Noti_Estado) VALUES (?, date("now"), ?, ?)',
        [Noti_IdUsuario, Noti_Mensaje, Noti_Estado],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Notificación creada correctamente' });
        }
    );
});

router.put('/:id', (req, res) => {
    const { Noti_IdUsuario, Noti_Mensaje, Noti_Estado } = req.body;
    db.run(
        'UPDATE T_Notificaciónes SET Noti_IdUsuario = ?, Noti_Mensaje = ?, Noti_Estado = ? WHERE Noti_IdNotificacion = ?',
        [Noti_IdUsuario, Noti_Mensaje, Noti_Estado, req.params.id],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ changes: this.changes, message: 'Notificación actualizada correctamente' });
        }
    );
});

router.delete('/:id', (req, res) => {
    db.run('DELETE FROM T_Notificaciónes WHERE Noti_IdNotificacion = ?', [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ changes: this.changes, message: 'Notificación eliminada correctamente' });
    });
});

module.exports = router;