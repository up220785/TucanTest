const express = require('express');
const router = express.Router();
const db = require('../db');

// Obtener todos los formularios
router.get('/', (req, res) => {
    db.all('SELECT * FROM T_Formularios', [], (err, rows) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(rows);
    });
});

// Obtener un formulario por ID
router.get('/:id', (req, res) => {
    db.get('SELECT * FROM T_Formularios WHERE Tform_IdFormulario = ?', [req.params.id], (err, row) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json(row);
    });
});

// Crear un nuevo formulario
router.post('/', (req, res) => {
    const { Tform_Fecha_de_cierre, Tform_IdUsuario, Tform_Tipo } = req.body;
    db.run(
        'INSERT INTO T_Formularios (Tform_Fecha_de_creacion, Tform_Fecha_de_cierre, Tform_IdUsuario, Tform_Tipo) VALUES (date("now"), ?, ?, ?)',
        [Tform_Fecha_de_cierre, Tform_IdUsuario, Tform_Tipo],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ id: this.lastID, message: 'Formulario creado correctamente' });
        }
    );
});

// Actualizar un formulario existente
router.put('/:id', (req, res) => {
    const { Tform_Fecha_de_cierre, Tform_IdUsuario, Tform_Tipo } = req.body;
    db.run(
        'UPDATE T_Formularios SET Tform_Fecha_de_cierre = ?, Tform_IdUsuario = ?, Tform_Tipo = ? WHERE Tform_IdFormulario = ?',
        [Tform_Fecha_de_cierre, Tform_IdUsuario, Tform_Tipo, req.params.id],
        function (err) {
            if (err) return res.status(400).json({ error: err.message });
            res.json({ changes: this.changes, message: 'Formulario actualizado correctamente' });
        }
    );
});

// Eliminar un formulario
router.delete('/:id', (req, res) => {
    db.run('DELETE FROM T_Formularios WHERE Tform_IdFormulario = ?', [req.params.id], function (err) {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ changes: this.changes, message: 'Formulario eliminado correctamente' });
    });
});

module.exports = router;