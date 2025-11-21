// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Conexión a MongoDB Atlas
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log(" Conectado a MongoDB Atlas"))
  .catch(err => console.error(" Error al conectar a MongoDB:", err));

//  ESQUEMA ACTUALIZADO - Incluye TODOS tus sensores
const sensorSchema = new mongoose.Schema({
  device_id: String,
  temperature: Number,
  humidity: Number,
  light: Number,
  distance_cm: Number,        
  led_state: Boolean,
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model("SensorData", sensorSchema);

//  Endpoint para recibir datos desde el ESP32
app.post("/data", async (req, res) => {
  try {
    const { device_id, temperature, humidity, light, distance_cm, led_state } = req.body;

    // Validación básica
    if (!device_id) {
      return res.status(400).json({ error: "device_id es requerido" });
    }

    // Crear nuevo documento con TODOS los datos
    const newData = new SensorData({ 
      device_id, 
      temperature, 
      humidity, 
      light, 
      distance_cm,    // ⬅️ Incluye distancia
      led_state 
    });
    
    await newData.save();

    console.log("📊 Datos guardados:", newData);
    res.status(201).json({ 
      success: true,
      message: "Datos guardados correctamente",
      data: newData 
    });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Error al guardar los datos" });
  }
});

// Endpoint para consultar últimos registros (para el dashboard)
app.get("/data", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50; // Por defecto 50 registros
    const data = await SensorData.find()
      .sort({ timestamp: -1 })
      .limit(limit);
    
    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Error al obtener los datos" });
  }
});

//  Endpoint para obtener el último registro
app.get("/data/latest", async (req, res) => {
  try {
    const latestData = await SensorData.findOne().sort({ timestamp: -1 });
    
    if (!latestData) {
      return res.json({ 
        success: false, 
        message: "No hay datos disponibles" 
      });
    }
    
    res.json({
      success: true,
      data: latestData
    });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Error al obtener datos" });
  }
});

// Endpoint de prueba
app.get("/", (req, res) => {
  res.json({
    message: "🚀 API IoT ESP32 + MongoDB Atlas funcionando!",
    endpoints: {
      "POST /data": "Recibir datos del ESP32",
      "GET /data": "Obtener todos los registros (query: ?limit=50)",
      "GET /data/latest": "Obtener último registro"
    },
    status: "online"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📡 Endpoints disponibles:`);
  console.log(`   POST http://localhost:${PORT}/data`);
  console.log(`   GET  http://localhost:${PORT}/data`);
  console.log(`   GET  http://localhost:${PORT}/data/latest`);
});
