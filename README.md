## Greenhouse IoT Backend System
Sebuah sistem backend untuk manajemen IoT rumah kaca yang terintegrasi dengan sensor data, kontrol perangkat, dan komunikasi real-time melalui MQTT.

### Fitur Utama
#### Sensor Data Management
- Data Ingestion: REST API untuk menerima data sensor (suhu, kelembaban, kelembaban tanah, intensitas cahaya, CO2)
- Validasi Data: Validasi input dengan Joi schema
- Penyimpanan: Penyimpanan data ke database dengan Sequelize ORM
- Retrieval: API untuk mengambil data sensor dengan filtering dan pagination

#### Device Control
- Kontrol Perangkat: REST API untuk mengontrol perangkat (ON/OFF)
- MQTT Integration: Publikasi perintah ke MQTT broker
- Command Logging: Log semua perintah yang dikirim ke perangkat
- Real-time Communication: Komunikasi real-time dengan perangkat IoT

#### System Health Monitoring
- Health Check: Endpoint untuk memeriksa status sistem
- Service Monitoring: Monitoring koneksi database dan MQTT
- System Metrics: Informasi sistem (uptime, memory usage, dll)

#### Security & Reliability
- Input Validation: Validasi semua input request
- Error Handling: Error handling yang komprehensif
- Rate Limiting: Proteksi terhadap DDoS attacks
- Structured Logging: Logging terstruktur dengan Winston
- CORS Configuration: Konfigurasi CORS yang aman

### Arsitektur Sistem
<p align="center">
  <img src="img/Arsitektur Sistem Greenhouse IoT Backend.png" alt="Architecture Diagram" width="600"/>
</p>

### Flow Data:
- Sensor → Backend: Sensor mengirim data via HTTP POST ke /api/sensor-data
- Backend → Database: Data disimpan ke MySQL database
- User → Backend: User mengirim perintah kontrol via HTTP POST ke /api/device-control
- Backend → MQTT: Backend mempublikasikan perintah ke MQTT broker
- MQTT → Devices: Perangkat IoT menerima perintah via MQTT subscription

## Teknologi Stack
### Backend Framework
- Node.js: Runtime JavaScript
- Express.js: Web framework untuk REST API
- Sequelize: ORM untuk database operations

### Database
- MySQL: Database utama (dengan Laragon untuk development)
- SQLite: Alternatif untuk development/testing

### Messaging
- MQTT: Protokol messaging untuk IoT
- Mosquitto: MQTT broker

### Security & Validation
- Joi: Schema validation
- Helmet: Security headers
- CORS: Cross-Origin Resource Sharing
- Express Rate Limit: Rate limiting middleware

### Logging & Monitoring
- Winston: Structured logging
- Morgan: HTTP request logging

### Testing
- Jest: Testing framework
- Supertest: HTTP assertion library

### Development Tools
- Nodemon: Auto-restart untuk development
- Dotenv: Environment variables management

## Prerequisites
###Software yang Diperlukan
- Node.js (v18 atau lebih tinggi)
- MySQL (via Laragon atau standalone)
- Mosquitto MQTT Broker
- Git (untuk version control)

### Konfigurasi MQTT
- Broker: Mosquitto pada localhost:1883
- Topic Pattern: greenhouse/control/{device_id}
- oS: 1 (At least once delivery)

## Menjalankan Aplikasi
### Development Mode
```bash
# Install dependencies (jika belum)
npm install

# Setup database
npm run setup:mysql

# Start MQTT broker (terminal 1)
mosquitto -v

# Start aplikasi dengan hot reload (terminal 2)
npm run dev
```

### API Documentation
Base URL
```bash
http://localhost:3000/api
```

### Sensor Data Ingestion
POST /api/sensor-data
Menyimpan data sensor dari perangkat IoT.
Request:
```bash
POST /api/sensor-data
Content-Type: application/json
```

Body:
```bash
json
{
  "sensorId": "temperature_sensor_1",
  "temperature": 25.5,
  "humidity": 60.5,
  "soilMoisture": 45.0,
  "lightIntensity": 800,
  "co2Level": 420,
  "timestamp": "2024-01-15T10:30:00Z"
}
```
Field Requirements:
| Fitur | Type | Status |
|------|--------|
| API Sensor | ✅ |
| Auth JWT | ⏳ |
| soilMoisture | ❌ |