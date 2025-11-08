// server.js
import express from "express"; // framework que permite crear un servidor HTTP fácilmente.
import mongoose from "mongoose"; // librería que conecta Node.js con MongoDB.
import cors from "cors"; // permite que otros dispositivos (como el ESP32) hagan peticiones al servidor sin bloqueos.
import dotenv from "dotenv"; // permite leer variables del archivo .env (por ejemplo, la URI de MongoDB).

dotenv.config(); //Carga las variables del archivo .env (como MONGO_URI)
const app = express(); // Crea la aplicación de Express

app.use(cors()); // habilita el acceso desde cualquier origen
app.use(express.json()); // permite que Express entienda los datos en formato JSON

//Conexión a MongoDB Atlas
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch(err => console.error("Error al conectar a MongoDB:", err));

// Esquema de tus sensores
const sensorSchema = new mongoose.Schema({
  device_id: String,
  temperature: Number,
  humidity: Number,
  light: Number,
  led_state: Boolean,
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model("SensorData", sensorSchema); // Creación de modelo (colección en mongo)

// Endpoint para recibir datos desde el ESP32, deben ser JSON
app.post("/data", async (req, res) => {
  try {
    const { device_id, temperature, humidity, light, led_state } = req.body;

    if (!device_id || temperature === undefined || humidity === undefined || light === undefined || led_state === undefined) {
      return res.status(400).json({ error: "Faltan campos en la solicitud" });
    }

    const newData = new SensorData({ device_id, temperature, humidity, light, led_state }); // Crea documento SensorData con los valores
    await newData.save(); // Guardamos el documento en la base de datos

    res.status(201).json({ message: "Datos guardados correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar los datos" });
  }
});

// Endpoint opcional para consultar últimos registros
app.get("/data", async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(20);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los datos" });
  }
});

// Endpoint de prueba http://localhost:3000/ solo si tiene node instalado  node server.js
app.get("/", (req, res) => {
  res.send("API IoT ESP32 + MongoDB Atlas funcionando correctamente!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
