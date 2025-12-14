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

GET /api/sensor-data

Mengambil data sensor dengan filtering.

```bash
GET /api/sensor-data?sensorId=temperature_sensor_1&startDate=2024-01-01&limit=10
```

Response (200):
```bash
json
{
  "status": "success",
  "count": 10,
  "data": [
    {
      "id": 1,
      "sensorId": "temperature_sensor_1",
      "temperature": 25.5,
      "humidity": 60.5,
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 150,
    "totalPages": 15
  }
}
```

### Device Control
POST /api/device-control
Mengirim perintah kontrol ke perangkat IoT via MQTT.

Request:
```bash
POST /api/device-control
Content-Type: application/json
```

Body:
```bash
json
{
  "deviceId": "fan_1",
  "command": "ON"
}
```

Response (Success - 200):
```bash
json
{
  "status": "success",
  "message": "Command sent successfully",
  "data": {
    "deviceId": "fan_1",
    "command": "ON",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

Response (Error - 500):
```bash
json
{
  "status": "error",
  "message": "MQTT broker is not connected"
}
```

GET /api/device-logs

Mengambil log perintah perangkat.

Response (200):
```bash
json
{
  "status": "success",
  "count": 5,
  "data": [
    {
      "id": 1,
      "deviceId": "fan_1",
      "command": "ON",
      "status": "SUCCESS",
      "topic": "greenhouse/control/fan_1",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### System Health

GET /api/status
Memeriksa status sistem dan koneksi services.

Request:

GET /api/status
Response (200):

```bash
json
{
  "status": "operational",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "backend": "operational",
    "database": "connected",
    "mqtt": "connected"
  },
  "system": {
    "uptime": 3600,
    "memoryUsage": {
      "rss": 102850560,
      "heapTotal": 75644928,
      "heapUsed": 58122328,
      "external": 10245632
    },
    "nodeVersion": "v18.15.0",
    "platform": "linux"
  }
}
```

Status Levels:
- operational: Semua services berjalan normal
- degraded: Satu atau lebih services mengalami masalah
- error: System mengalami error yang signifikan

GET /health

Simple health check untuk load balancer/monitoring.

Response (200):
``` bash
json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### MQTT Integration
Topic Structure

greenhouse/control/{device_id}

#### Message Format
```bash
json
{
  "deviceId": "fan_1",
  "command": "ON",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Testing MQTT
Subscribe ke Topic
```bash
# Subscribe ke semua topic greenhouse
mosquitto_sub -h localhost -p 1883 -t "greenhouse/#" -v

# Subscribe ke topic spesifik device
mosquitto_sub -h localhost -p 1883 -t "greenhouse/control/fan_1" -v
```

### Publish Manual
```bash
# Publish test message
mosquitto_pub -h localhost -p 1883 -t "greenhouse/control/fan_1" \
  -m '{"deviceId":"fan_1","command":"ON","timestamp":"2024-01-15T10:30:00Z"}'
```

### Test dengan API
```bash
curl -X POST http://localhost:3000/api/device-control \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"fan_1","command":"ON"}'
```

### MQTT QoS
- QoS 1: At least once delivery
- Retained Messages: Tidak digunakan
- Clean Session: Ya

### Testing
Menjalankan Test
Semua Test
```bash
npm test
```

#### Test Spesifik
```bash
# Test sensor saja
npm run test:sensor

# Test device saja
npm run test:device

# Test status saja
npm run test:status
```

#### Test dengan Coverage
```bash
npm run test:coverage
# Buka coverage/lcov-report/index.html untuk melihat report
```

#### Watch Mode
```bash
npm run test:watch
```