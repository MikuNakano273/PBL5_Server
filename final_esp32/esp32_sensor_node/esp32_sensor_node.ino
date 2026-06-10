#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HardwareSerial.h>
#include <math.h>

// PBL5 ESP32 sensor-node demo firmware.
// Hardcoded for final demo: 4G hotspot + production API domain.
const char* WIFI_SSID = "世界一可愛い私";
const char* WIFI_PASSWORD = "kotonekotone";

const char* SERVER_HOST = "pbl5.prodous.dev";
const uint16_t SERVER_PORT = 443;
const char* SENSOR_PATH = "/api/v1/sensor";

const char* DEVICE_ID = "pbl5-01";

const uint8_t TRIG_PIN = 27;
const uint8_t ECHO_PIN = 18;
const uint8_t GPS_RX_PIN = 16;
const uint8_t GPS_TX_PIN = 17;
const uint8_t BUZZER_PIN = 23;
const uint8_t LED_PIN = 2;

const unsigned long SENSOR_POST_INTERVAL_MS = 500;
const unsigned long ULTRASONIC_INTERVAL_MS = 80;
const unsigned long WIFI_CONNECT_TIMEOUT_MS = 15000;
const unsigned long HTTP_RESPONSE_TIMEOUT_MS = 900;
const unsigned long CONTEXT_MAX_AGE_MS = 7000;
const unsigned long CONTEXT_LOCAL_TTL_MS = 8000;
const uint8_t MAX_CONSECUTIVE_NET_FAILURES = 20;

const double FALLBACK_LAT = 16.047079;
const double FALLBACK_LNG = 108.206230;

HardwareSerial GPSSerial(2);

enum AlertLevel {
  ALERT_CLEAR = 0,
  ALERT_VISION_ONLY,
  ALERT_WARNING,
  ALERT_DANGER,
  ALERT_CRITICAL,
};

enum SceneType {
  SCENE_CLEAR = 0,
  SCENE_PERSON,
  SCENE_VEHICLE,
  SCENE_STATIC_OBSTACLE,
  SCENE_UNKNOWN,
  SCENE_STALE,
};

enum RiskLevel {
  RISK_CLEAR = 0,
  RISK_INFO,
  RISK_WARNING,
  RISK_DANGER,
};

struct DistanceState {
  float cm = 0;
  bool valid = false;
  bool obstacleActive = false;
  AlertLevel level = ALERT_CLEAR;
};

struct GpsState {
  bool fix = false;
  double lat = FALLBACK_LAT;
  double lng = FALLBACK_LNG;
  int sats = 0;
};

struct SceneContext {
  SceneType type = SCENE_STALE;
  RiskLevel risk = RISK_CLEAR;
  float confidence = 0;
  unsigned long ageMs = 999999;
  unsigned long receivedAt = 0;
  bool fresh = false;
};

DistanceState distanceState;
GpsState gpsState;
SceneContext sceneContext;

uint32_t sensorSeq = 0;
unsigned long lastUltrasonicAt = 0;
unsigned long lastSensorPostAt = 0;
uint8_t consecutiveNetFailures = 0;

char gpsLine[128];
uint8_t gpsLineLength = 0;

bool buzzerOn = false;
uint8_t buzzerPulseIndex = 0;
uint8_t buzzerPulseCount = 1;
unsigned long buzzerNextAt = 0;
unsigned long buzzerRepeatIntervalMs = 1000;
uint16_t buzzerOnMs = 80;
uint32_t lastBuzzerSignature = 0;

void blinkLed(uint8_t count, uint16_t onMs = 80, uint16_t offMs = 120) {
  for (uint8_t i = 0; i < count; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(onMs);
    digitalWrite(LED_PIN, LOW);
    delay(offMs);
  }
}

const char* alertLevelName(AlertLevel level) {
  switch (level) {
    case ALERT_WARNING:
      return "warning";
    case ALERT_DANGER:
      return "danger";
    case ALERT_CRITICAL:
      return "critical";
    case ALERT_VISION_ONLY:
      return "warning";
    case ALERT_CLEAR:
    default:
      return "clear";
  }
}

SceneType sceneTypeFromString(const String& value) {
  if (value == "clear") return SCENE_CLEAR;
  if (value == "person") return SCENE_PERSON;
  if (value == "vehicle") return SCENE_VEHICLE;
  if (value == "static_obstacle") return SCENE_STATIC_OBSTACLE;
  if (value == "unknown") return SCENE_UNKNOWN;
  if (value == "stale") return SCENE_STALE;
  return SCENE_UNKNOWN;
}

RiskLevel riskLevelFromString(const String& value) {
  if (value == "clear") return RISK_CLEAR;
  if (value == "info") return RISK_INFO;
  if (value == "warning") return RISK_WARNING;
  if (value == "danger") return RISK_DANGER;
  return RISK_CLEAR;
}

bool isContextUsable() {
  if (!sceneContext.fresh) {
    return false;
  }
  if (sceneContext.ageMs > CONTEXT_MAX_AGE_MS) {
    return false;
  }
  if (millis() - sceneContext.receivedAt > CONTEXT_LOCAL_TTL_MS) {
    return false;
  }
  return sceneContext.type != SCENE_CLEAR && sceneContext.type != SCENE_STALE && sceneContext.risk != RISK_CLEAR;
}

float measureDistanceCm() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  unsigned long duration = pulseInLong(ECHO_PIN, HIGH, 25000);
  if (duration == 0) {
    return -1;
  }
  return duration / 58.0f;
}

void updateDistance() {
  float measured = measureDistanceCm();
  distanceState.valid = measured >= 2.0f && measured <= 400.0f;

  if (!distanceState.valid) {
    distanceState.level = ALERT_CLEAR;
    distanceState.obstacleActive = false;
    return;
  }

  distanceState.cm = measured;
  if (!distanceState.obstacleActive && measured < 100.0f) {
    distanceState.obstacleActive = true;
  } else if (distanceState.obstacleActive && measured > 110.0f) {
    distanceState.obstacleActive = false;
  }

  if (measured < 30.0f) {
    distanceState.level = ALERT_CRITICAL;
  } else if (measured < 60.0f) {
    distanceState.level = ALERT_DANGER;
  } else if (measured < 100.0f || distanceState.obstacleActive) {
    distanceState.level = ALERT_WARNING;
  } else {
    distanceState.level = ALERT_CLEAR;
  }
}

double parseNmeaCoordinate(const char* rawValue, const char* hemisphere) {
  if (!rawValue || rawValue[0] == '\0') {
    return 0;
  }
  double raw = atof(rawValue);
  int degrees = (int)(raw / 100);
  double minutes = raw - (degrees * 100);
  double result = degrees + (minutes / 60.0);
  if (hemisphere && (hemisphere[0] == 'S' || hemisphere[0] == 'W')) {
    result = -result;
  }
  return result;
}

bool getNmeaField(const char* line, uint8_t fieldIndex, char* output, size_t outputSize) {
  size_t out = 0;
  uint8_t current = 0;
  const char* p = line;

  while (*p && *p != '\r' && *p != '\n') {
    if (*p == ',') {
      if (current == fieldIndex) {
        break;
      }
      current++;
      p++;
      continue;
    }

    if (current == fieldIndex && out + 1 < outputSize) {
      output[out++] = *p;
    }
    p++;
  }

  output[out] = '\0';
  return current == fieldIndex;
}

void processGpsLine(const char* line) {
  char field[20];
  if (strncmp(line, "$GPRMC", 6) == 0 || strncmp(line, "$GNRMC", 6) == 0) {
    char status[4], latRaw[20], latHem[4], lngRaw[20], lngHem[4];
    getNmeaField(line, 2, status, sizeof(status));
    getNmeaField(line, 3, latRaw, sizeof(latRaw));
    getNmeaField(line, 4, latHem, sizeof(latHem));
    getNmeaField(line, 5, lngRaw, sizeof(lngRaw));
    getNmeaField(line, 6, lngHem, sizeof(lngHem));

    if (status[0] == 'A' && latRaw[0] && lngRaw[0]) {
      gpsState.fix = true;
      gpsState.lat = parseNmeaCoordinate(latRaw, latHem);
      gpsState.lng = parseNmeaCoordinate(lngRaw, lngHem);
    } else {
      gpsState.fix = false;
      gpsState.lat = FALLBACK_LAT;
      gpsState.lng = FALLBACK_LNG;
    }
    return;
  }

  if (strncmp(line, "$GPGGA", 6) == 0 || strncmp(line, "$GNGGA", 6) == 0) {
    char fixQuality[6], sats[6], latRaw[20], latHem[4], lngRaw[20], lngHem[4];
    getNmeaField(line, 2, latRaw, sizeof(latRaw));
    getNmeaField(line, 3, latHem, sizeof(latHem));
    getNmeaField(line, 4, lngRaw, sizeof(lngRaw));
    getNmeaField(line, 5, lngHem, sizeof(lngHem));
    getNmeaField(line, 6, fixQuality, sizeof(fixQuality));
    getNmeaField(line, 7, sats, sizeof(sats));

    gpsState.sats = atoi(sats);
    if (atoi(fixQuality) > 0 && latRaw[0] && lngRaw[0]) {
      gpsState.fix = true;
      gpsState.lat = parseNmeaCoordinate(latRaw, latHem);
      gpsState.lng = parseNmeaCoordinate(lngRaw, lngHem);
    }
  }
}

void readGps() {
  while (GPSSerial.available()) {
    char c = (char)GPSSerial.read();
    if (c == '\n') {
      gpsLine[gpsLineLength] = '\0';
      processGpsLine(gpsLine);
      gpsLineLength = 0;
    } else if (c != '\r' && gpsLineLength + 1 < sizeof(gpsLine)) {
      gpsLine[gpsLineLength++] = c;
    } else if (gpsLineLength + 1 >= sizeof(gpsLine)) {
      gpsLineLength = 0;
    }
  }
}

void connectWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  Serial.printf("Connecting to Wi-Fi SSID: %s\n", WIFI_SSID);
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startedAt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startedAt < WIFI_CONNECT_TIMEOUT_MS) {
    readGps();
    updateBuzzer();
    delay(50);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi connected. ESP32 IP: ");
    Serial.println(WiFi.localIP());
    blinkLed(2);
  } else {
    Serial.println("Wi-Fi connect timeout; will retry.");
    blinkLed(1, 400, 120);
  }
}

String jsonEscape(const char* value) {
  String out;
  while (*value) {
    if (*value == '"' || *value == '\\') {
      out += '\\';
    }
    out += *value++;
  }
  return out;
}

String buildSensorJson() {
  String payload;
  payload.reserve(384);
  payload += "{";
  payload += "\"device_id\":\"";
  payload += jsonEscape(DEVICE_ID);
  payload += "\",\"type\":\"sensor\"";
  payload += ",\"seq\":";
  payload += sensorSeq;
  payload += ",\"millis\":";
  payload += millis();
  payload += ",\"distance_cm\":";
  payload += distanceState.valid ? String(distanceState.cm, 1) : "0";
  payload += ",\"distance_valid\":";
  payload += distanceState.valid ? "true" : "false";
  payload += ",\"obstacle_in_1m\":";
  payload += distanceState.level != ALERT_CLEAR ? "true" : "false";
  payload += ",\"alert_level\":\"";
  payload += alertLevelName(distanceState.level);
  payload += "\",\"gps\":{";
  payload += "\"fix\":";
  payload += gpsState.fix ? "true" : "false";
  payload += ",\"lat\":";
  payload += String(gpsState.lat, 6);
  payload += ",\"lng\":";
  payload += String(gpsState.lng, 6);
  payload += ",\"sats\":";
  payload += gpsState.sats;
  payload += "}}";
  return payload;
}

String extractJsonStringField(const String& source, const char* key) {
  String needle = "\"";
  needle += key;
  needle += "\"";
  int keyIndex = source.indexOf(needle);
  if (keyIndex < 0) return "";
  int colon = source.indexOf(':', keyIndex + needle.length());
  if (colon < 0) return "";
  int firstQuote = source.indexOf('"', colon + 1);
  if (firstQuote < 0) return "";
  int secondQuote = source.indexOf('"', firstQuote + 1);
  if (secondQuote < 0) return "";
  return source.substring(firstQuote + 1, secondQuote);
}

float extractJsonFloatField(const String& source, const char* key, float fallback) {
  String needle = "\"";
  needle += key;
  needle += "\"";
  int keyIndex = source.indexOf(needle);
  if (keyIndex < 0) return fallback;
  int colon = source.indexOf(':', keyIndex + needle.length());
  if (colon < 0) return fallback;
  int end = colon + 1;
  while (end < (int)source.length() && source[end] == ' ') end++;
  int start = end;
  while (end < (int)source.length() && (isDigit(source[end]) || source[end] == '.' || source[end] == '-')) end++;
  return source.substring(start, end).toFloat();
}

bool extractJsonBoolField(const String& source, const char* key, bool fallback) {
  String needle = "\"";
  needle += key;
  needle += "\"";
  int keyIndex = source.indexOf(needle);
  if (keyIndex < 0) return fallback;
  int colon = source.indexOf(':', keyIndex + needle.length());
  if (colon < 0) return fallback;
  int start = colon + 1;
  while (start < (int)source.length() && source[start] == ' ') start++;
  if (source.startsWith("true", start)) return true;
  if (source.startsWith("false", start)) return false;
  return fallback;
}

void parseSceneContext(const String& body) {
  int contextIndex = body.indexOf("\"scene_context\"");
  if (contextIndex < 0) {
    return;
  }

  String context = body.substring(contextIndex);
  String type = extractJsonStringField(context, "type");
  String risk = extractJsonStringField(context, "risk_level");

  sceneContext.type = sceneTypeFromString(type);
  sceneContext.risk = riskLevelFromString(risk);
  sceneContext.confidence = extractJsonFloatField(context, "confidence", 0);
  sceneContext.ageMs = (unsigned long)extractJsonFloatField(context, "age_ms", 999999);
  sceneContext.fresh = extractJsonBoolField(context, "fresh", sceneContext.ageMs <= CONTEXT_MAX_AGE_MS);
  sceneContext.receivedAt = millis();

  Serial.print("Scene context: ");
  Serial.print(type);
  Serial.print(", risk=");
  Serial.print(risk);
  Serial.print(", age_ms=");
  Serial.println(sceneContext.ageMs);
}

bool postSensor() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    if (WiFi.status() != WL_CONNECTED) {
      return false;
    }
  }

  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(HTTP_RESPONSE_TIMEOUT_MS / 1000 + 1);
  if (!client.connect(SERVER_HOST, SERVER_PORT)) {
    Serial.println("Failed to connect to sensor API");
    return false;
  }

  sensorSeq++;
  String payload = buildSensorJson();

  client.printf("POST %s HTTP/1.1\r\n", SENSOR_PATH);
  client.printf("Host: %s:%u\r\n", SERVER_HOST, SERVER_PORT);
  client.print("Content-Type: application/json\r\n");
  client.printf("Content-Length: %u\r\n", payload.length());
  client.print("Connection: close\r\n\r\n");
  client.print(payload);

  unsigned long deadline = millis() + HTTP_RESPONSE_TIMEOUT_MS;
  while (client.connected() && !client.available() && millis() < deadline) {
    readGps();
    updateBuzzer();
    delay(10);
  }

  String statusLine = client.readStringUntil('\n');
  statusLine.trim();

  bool inBody = false;
  String body;
  while (client.available()) {
    String line = client.readStringUntil('\n');
    if (!inBody) {
      if (line == "\r" || line.length() == 0) {
        inBody = true;
      }
    } else {
      body += line;
    }
  }
  client.stop();

  Serial.print("Sensor response: ");
  Serial.println(statusLine);
  if (body.length() > 0) {
    parseSceneContext(body);
  }
  return statusLine.indexOf("200") >= 0;
}

AlertLevel effectiveAlertLevel() {
  AlertLevel level = distanceState.level;
  if (level == ALERT_CRITICAL) {
    return ALERT_CRITICAL;
  }

  if (!isContextUsable()) {
    return level;
  }

  if (sceneContext.type == SCENE_VEHICLE || sceneContext.risk == RISK_DANGER) {
    return level >= ALERT_DANGER ? level : ALERT_DANGER;
  }
  if (sceneContext.type == SCENE_PERSON || sceneContext.type == SCENE_STATIC_OBSTACLE || sceneContext.risk == RISK_WARNING) {
    return level >= ALERT_WARNING ? level : ALERT_WARNING;
  }
  if (sceneContext.type == SCENE_UNKNOWN || sceneContext.risk == RISK_INFO) {
    return level == ALERT_CLEAR ? ALERT_VISION_ONLY : level;
  }
  return level;
}

uint8_t currentPulseCount() {
  if (!isContextUsable()) {
    return 1;
  }
  if (sceneContext.type == SCENE_VEHICLE) {
    return 3;
  }
  if (sceneContext.type == SCENE_PERSON) {
    return 2;
  }
  return 1;
}

void configureBuzzer(AlertLevel level, uint8_t pulseCount) {
  buzzerPulseCount = pulseCount;
  switch (level) {
    case ALERT_CRITICAL:
      buzzerRepeatIntervalMs = 230;
      buzzerOnMs = 90;
      buzzerPulseCount = 1;
      break;
    case ALERT_DANGER:
      buzzerRepeatIntervalMs = 450;
      buzzerOnMs = 85;
      break;
    case ALERT_WARNING:
      buzzerRepeatIntervalMs = 1000;
      buzzerOnMs = 90;
      break;
    case ALERT_VISION_ONLY:
      buzzerRepeatIntervalMs = 2000;
      buzzerOnMs = 70;
      break;
    case ALERT_CLEAR:
    default:
      buzzerRepeatIntervalMs = 1000;
      buzzerOnMs = 0;
      break;
  }
}

void updateBuzzer() {
  AlertLevel level = effectiveAlertLevel();
  uint8_t pulses = currentPulseCount();
  configureBuzzer(level, pulses);

  uint32_t signature = ((uint32_t)level << 8) | buzzerPulseCount;
  unsigned long now = millis();

  if (level == ALERT_CLEAR) {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerOn = false;
    buzzerPulseIndex = 0;
    buzzerNextAt = now;
    lastBuzzerSignature = signature;
    return;
  }

  if (signature != lastBuzzerSignature) {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerOn = false;
    buzzerPulseIndex = 0;
    buzzerNextAt = now;
    lastBuzzerSignature = signature;
  }

  if (now < buzzerNextAt) {
    return;
  }

  if (buzzerOn) {
    digitalWrite(BUZZER_PIN, LOW);
    buzzerOn = false;
    buzzerPulseIndex++;
    if (buzzerPulseIndex >= buzzerPulseCount) {
      buzzerPulseIndex = 0;
      buzzerNextAt = now + buzzerRepeatIntervalMs;
    } else {
      buzzerNextAt = now + 120;
    }
    return;
  }

  digitalWrite(BUZZER_PIN, HIGH);
  buzzerOn = true;
  buzzerNextAt = now + buzzerOnMs;
}

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(TRIG_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  GPSSerial.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);

  Serial.println();
  Serial.println("PBL5 ESP32 sensor node");
  Serial.printf("Device: %s\n", DEVICE_ID);
  Serial.printf("Sensor endpoint: https://%s%s\n", SERVER_HOST, SENSOR_PATH);
  blinkLed(1);
  connectWifi();
}

void loop() {
  unsigned long now = millis();
  readGps();

  if (now - lastUltrasonicAt >= ULTRASONIC_INTERVAL_MS) {
    lastUltrasonicAt = now;
    updateDistance();
  }

  updateBuzzer();

  if (now - lastSensorPostAt >= SENSOR_POST_INTERVAL_MS) {
    lastSensorPostAt = now;
    bool ok = postSensor();
    if (ok) {
      consecutiveNetFailures = 0;
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    } else {
      consecutiveNetFailures++;
      Serial.printf("Sensor post failed. Consecutive network failures: %u\n", consecutiveNetFailures);
      if (consecutiveNetFailures >= MAX_CONSECUTIVE_NET_FAILURES) {
        Serial.println("Too many network failures; restarting");
        blinkLed(4, 150, 100);
        delay(500);
        ESP.restart();
      }
    }
  }

  delay(5);
}
