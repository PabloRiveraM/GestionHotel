const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Configura tu conexión MySQL
const db = mysql.createConnection({
    host: '127.0.1',
    user: 'root',
    password: 'Pablo2l3l4l5',
    database: 'hotel_db'
});

// Ejemplo: Obtener habitaciones
app.get('/api/habitaciones', (req, res) => {
    db.query('SELECT * FROM habitaciones', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.json(results);
    });
});

// Ejemplo: Guardar reservación
app.post('/api/reservaciones', (req, res) => {
    const data = req.body;
    db.query('INSERT INTO reservaciones SET ?', data, (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ id: result.insertId });
    });
});

// Editar reservación
app.put('/api/reservaciones/:id', (req, res) => {
    const id = req.params.id;
    const data = req.body;
    db.query('UPDATE reservaciones SET ? WHERE id = ?', [data, id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ updated: result.affectedRows });
    });
});

// Eliminar reservación
app.delete('/api/reservaciones/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM reservaciones WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ deleted: result.affectedRows });
    });
});

// Editar habitación
app.put('/api/habitaciones/:id', (req, res) => {
    const id = req.params.id;
    const data = req.body;
    db.query('UPDATE habitaciones SET ? WHERE id = ?', [data, id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ updated: result.affectedRows });
    });
});

// Eliminar habitación
app.delete('/api/habitaciones/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM habitaciones WHERE id = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.json({ deleted: result.affectedRows });
    });
});

app.listen(3000, () => console.log('API corriendo en http://localhost:3000'));