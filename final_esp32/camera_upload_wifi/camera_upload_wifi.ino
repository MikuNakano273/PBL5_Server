#include "esp_camera.h"
#include <WiFi.h>
#include <WiFiClientSecure.h>

// PBL5 ESP32-CAM demo firmware.
// Hardcoded for demo: 4G hotspot + Cloudflare Tunnel domain.
const char* WIFI_SSID = "世界一可愛い私";
const char* WIFI_PASSWORD = "kotonekotone";

const char* SERVER_HOST = "pbl5.prodous.dev";
const uint16_t SERVER_PORT = 443;
const char* SERVER_PATH = "/api/v1/frame";

const char* DEVICE_ID = "pbl5-01";
const unsigned long CAPTURE_INTERVAL_MS = 5000;
const unsigned long WIFI_CONNECT_TIMEOUT_MS = 15000;
const unsigned long SERVER_RESPONSE_TIMEOUT_MS = 8000;
const size_t UPLOAD_CHUNK_BYTES = 1024;
const uint8_t MAX_CONSECUTIVE_FAILURES = 8;

// AI Thinker ESP32-CAM pin map.
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22
#define FLASH_LED_GPIO     4

uint32_t camSeq = 0;
unsigned long lastCaptureAt = 0;
uint8_t consecutiveFailures = 0;

void blinkFlash(uint8_t count, uint16_t onMs = 80, uint16_t offMs = 120) {
  for (uint8_t i = 0; i < count; i++) {
    digitalWrite(FLASH_LED_GPIO, HIGH);
    delay(onMs);
    digitalWrite(FLASH_LED_GPIO, LOW);
    delay(offMs);
  }
}

bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_VGA;
  config.jpeg_quality = 12;
  config.fb_count = 1;
  config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  config.fb_location = CAMERA_FB_IN_PSRAM;

  if (psramFound()) {
    config.fb_count = 1;
    config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  } else {
    config.frame_size = FRAMESIZE_QVGA;
    config.fb_location = CAMERA_FB_IN_DRAM;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
    return false;
  }

  sensor_t* sensor = esp_camera_sensor_get();
  sensor->set_framesize(sensor, config.frame_size);
  sensor->set_quality(sensor, config.jpeg_quality);
  sensor->set_brightness(sensor, 0);
  sensor->set_contrast(sensor, 0);
  sensor->set_saturation(sensor, 0);
  return true;
}

bool looksLikeJpeg(camera_fb_t* fb) {
  return fb
    && fb->len > 32
    && fb->buf[0] == 0xff
    && fb->buf[1] == 0xd8
    && fb->buf[2] == 0xff
    && fb->buf[fb->len - 2] == 0xff
    && fb->buf[fb->len - 1] == 0xd9;
}

bool writeAll(WiFiClientSecure& client, const uint8_t* data, size_t length) {
  size_t written = 0;
  while (written < length) {
    size_t chunk = min(UPLOAD_CHUNK_BYTES, length - written);
    size_t n = client.write(data + written, chunk);
    if (n == 0) {
      return false;
    }
    written += n;
    delay(1);
  }
  return true;
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
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi connected. ESP32-CAM IP: ");
    Serial.println(WiFi.localIP());
    blinkFlash(2);
  } else {
    Serial.println("Wi-Fi connect timeout; will retry.");
    blinkFlash(1, 500, 120);
  }
}

bool uploadFrame(camera_fb_t* fb) {
  WiFiClientSecure client;
  client.setInsecure();
  client.setTimeout(SERVER_RESPONSE_TIMEOUT_MS / 1000);
  if (!client.connect(SERVER_HOST, SERVER_PORT)) {
    Serial.println("Failed to connect to receiver API");
    return false;
  }

  String boundary = "----PBL5ESP32CAMBoundary";
  String head;
  head += "--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"device_id\"\r\n\r\n";
  head += DEVICE_ID;
  head += "\r\n--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"type\"\r\n\r\n";
  head += "frame";
  head += "\r\n--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"cam_seq\"\r\n\r\n";
  head += String(camSeq);
  head += "\r\n--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"millis\"\r\n\r\n";
  head += String(millis());
  head += "\r\n--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"image\"; filename=\"esp32cam.jpg\"\r\n";
  head += "Content-Type: image/jpeg\r\n\r\n";

  String tail = "\r\n--" + boundary + "--\r\n";
  size_t contentLength = head.length() + fb->len + tail.length();

  client.printf("POST %s HTTP/1.1\r\n", SERVER_PATH);
  client.printf("Host: %s:%u\r\n", SERVER_HOST, SERVER_PORT);
  client.printf("Content-Type: multipart/form-data; boundary=%s\r\n", boundary.c_str());
  client.printf("Content-Length: %u\r\n", static_cast<unsigned int>(contentLength));
  client.print("Connection: close\r\n\r\n");
  client.print(head);
  if (!writeAll(client, fb->buf, fb->len)) {
    Serial.println("Failed while writing JPEG bytes");
    client.stop();
    return false;
  }
  client.print(tail);

  unsigned long deadline = millis() + SERVER_RESPONSE_TIMEOUT_MS;
  while (client.connected() && !client.available() && millis() < deadline) {
    delay(10);
  }

  String statusLine = client.readStringUntil('\n');
  statusLine.trim();
  Serial.print("Receiver response: ");
  Serial.println(statusLine);
  client.stop();
  return statusLine.indexOf("200") >= 0;
}

bool captureAndUpload() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWifi();
    if (WiFi.status() != WL_CONNECTED) {
      return false;
    }
  }

  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return false;
  }

  if (!looksLikeJpeg(fb)) {
    Serial.println("Captured invalid JPEG header/footer; dropping frame");
    blinkFlash(2, 180, 80);
    esp_camera_fb_return(fb);
    return false;
  }

  camSeq++;
  Serial.printf("Captured frame #%u, %u bytes\n", camSeq, fb->len);
  bool ok = uploadFrame(fb);
  Serial.println(ok ? "Upload ok" : "Upload failed");
  if (ok) {
    blinkFlash(3);
  } else {
    blinkFlash(2, 400, 120);
  }
  esp_camera_fb_return(fb);
  return ok;
}

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(false);
  Serial.println();
  pinMode(FLASH_LED_GPIO, OUTPUT);
  digitalWrite(FLASH_LED_GPIO, LOW);
  blinkFlash(1);

  Serial.printf("Device: %s\n", DEVICE_ID);
  Serial.printf("Upload endpoint: https://%s%s\n", SERVER_HOST, SERVER_PATH);

  if (!initCamera()) {
    Serial.println("Camera unavailable; restarting in 5 seconds");
    blinkFlash(5, 300, 120);
    delay(5000);
    ESP.restart();
  }

  connectWifi();
}

void loop() {
  unsigned long now = millis();
  if (now - lastCaptureAt >= CAPTURE_INTERVAL_MS) {
    lastCaptureAt = now;
    if (captureAndUpload()) {
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      Serial.printf("Consecutive failures: %u\n", consecutiveFailures);
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        Serial.println("Too many failures; restarting");
        blinkFlash(4, 220, 120);
        delay(1000);
        ESP.restart();
      }
    }
  }
  delay(10);
}
