# PBL5 Demo Plan: ESP32-CAM + ESP32 Sensor + Server API

## 1. Mục tiêu demo

Mục tiêu của demo là kiểm tra hệ thống hoạt động ổn định theo thiết kế mới:

- ESP32-CAM được cấp nguồn riêng bằng sạc dự phòng.
- ESP32 chính được cấp nguồn từ cụm pin 18650 + MT3608.
- ESP32-CAM gửi ảnh lên server theo chu kỳ.
- ESP32 chính gửi dữ liệu siêu âm + GPS lên server mỗi 500ms.
- ESP32 chính điều khiển buzzer theo khoảng cách cục bộ và ngữ cảnh AI mới nhất từ server.
- Server nhận hai luồng dữ liệu độc lập, ghép ảnh với dữ liệu cảm biến gần thời điểm nhất.
- Server chạy object detection trên ảnh và quy đổi kết quả thành ngữ cảnh phía trước gậy.

Trong demo, thành công được xác định khi:

- Server nhận ảnh đều đặn từ ESP32-CAM.
- Server nhận telemetry đều đặn từ ESP32 chính.
- Dữ liệu ảnh và dữ liệu cảm biến có thể ghép theo `device_id` và thời gian server nhận.
- Buzzer đổi kiểu bíp theo ngữ cảnh AI và mức khoảng cách.
- Khi server/AI lỗi, buzzer vẫn fallback theo HC-SR04 để cảnh báo vật gần.
- Không có board nào reset hoặc mất kết nối liên tục.

---

## 2. Kiến trúc tổng thể

```text
ESP32-CAM
  ├─ Nguồn: sạc dự phòng 5V
  ├─ Chức năng:
  │    ├─ Kết nối Wi-Fi
  │    ├─ Chụp ảnh mỗi 5 giây
  │    └─ Gửi ảnh lên server
  └─ Không cần giao tiếp trực tiếp với ESP32 chính

ESP32 chính
  ├─ Nguồn: pin 18650 song song → công tắc → MT3608 → 5V
  ├─ Chức năng:
  │    ├─ Kết nối Wi-Fi
  │    ├─ Đọc HC-SR04
  │    ├─ Đọc GPS NEO-6M
  │    ├─ Điều khiển buzzer cục bộ
  │    └─ Gửi sensor telemetry lên server mỗi 500ms
  └─ Không cần giao tiếp trực tiếp với ESP32-CAM

Server
  ├─ Nhận ảnh từ ESP32-CAM
  ├─ Nhận sensor telemetry từ ESP32 chính
  ├─ Ghép frame với sensor data gần nhất
  ├─ Chạy object detection trên ảnh
  ├─ Quy đổi detection thành scene_context cho ESP32 chính
  ├─ Lưu/log dữ liệu demo
  └─ Trả scene_context mới nhất trong response sensor/state
```

Thiết kế này dùng server làm trung tâm. ESP32-CAM và ESP32 chính không gọi trực tiếp lẫn nhau qua Wi-Fi. Điều này giúp tránh lỗi do client isolation, IP thay đổi, router/hotspot chặn thiết bị nội mạng, và giảm độ phức tạp khi demo.

---

## 3. Thiết kế nguồn

### 3.1 ESP32-CAM

ESP32-CAM dùng nguồn riêng:

```text
Sạc dự phòng 5V → ESP32-CAM 5V/GND
```

Lý do:

- ESP32-CAM có dòng tiêu thụ cao khi chụp ảnh + bật Wi-Fi + upload.
- Đã test thực tế: ESP32-CAM cắm sạc dự phòng và chụp mỗi 5 giây hoạt động tốt.
- Tách nguồn ESP32-CAM khỏi cụm pin chính giúp tránh sụt áp kéo theo ESP32 chính.

### 3.2 ESP32 chính + cụm cảm biến

Nguồn cho ESP32 chính:

```text
2 pin 18650 song song
  ├─ TP4056 B+ / B- để sạc pin
  └─ công tắc → MT3608 → ESP32 chính + HC-SR04 + GPS + buzzer
```

Sơ đồ:

```text
Pin +
 ├── TP4056 B+
 └── công tắc ── MT3608 IN+

Pin -
 ├── TP4056 B-
 └── MT3608 IN-

MT3608 OUT+ → ESP32 5V/VIN
MT3608 OUT- → ESP32 GND
```

Không dùng `OUT+ / OUT-` của TP4056 để cấp tải chính, vì kết quả đo cho thấy OUT của mạch sạc bị dao động khi ESP32 bật Wi-Fi. TP4056 chỉ dùng để sạc pin.

Lưu ý an toàn:

- Đây là giải pháp phù hợp cho demo/test.
- Không nên để pin tụt dưới khoảng 3.2V–3.3V.
- Thiết kế lâu dài nên dùng BMS 1S/protection board đủ dòng hoặc module sạc + boost 5V 2A chuyên cho 18650.

---

## 4. Pin map ESP32 chính

```text
HC-SR04 TRIG  → GPIO27
HC-SR04 ECHO  → GPIO18 qua chia áp 10k/20k
GPS TX        → ESP32 GPIO16
GPS RX        → ESP32 GPIO17
Buzzer        → GPIO23
LED built-in  → GPIO2
```

### 4.1 HC-SR04

HC-SR04 dùng 5V, nhưng Echo trả về mức 5V. ESP32 chỉ chịu logic 3.3V, nên bắt buộc chia áp Echo.

```text
HC-SR04 ECHO ----[10k]----+---- GPIO18 ESP32
                          |
                        [20k]
                          |
                         GND
```

Không nối Echo trực tiếp vào GPIO ESP32.

### 4.2 GPS NEO-6M

```text
GPS VCC → 5V hoặc 3.3V tùy module
GPS GND → GND
GPS TX  → ESP32 GPIO16
GPS RX  → ESP32 GPIO17
```

Trong nhà GPS có thể không bắt fix. Demo vẫn có thể dùng tọa độ giả khi chưa có fix để test API.

### 4.3 Buzzer

Nếu là buzzer module 3 chân:

```text
Buzzer VCC → 5V
Buzzer GND → GND
Buzzer IN  → GPIO23
```

Nếu là buzzer 2 chân, nên dùng transistor nếu buzzer ăn dòng lớn. Với test ngắn có thể kéo trực tiếp nếu buzzer nhỏ, nhưng không khuyến nghị cho thiết kế cuối.

---

## 5. API cần có

API tối thiểu cho demo gồm 2 endpoint:

```text
POST /api/v1/sensor
POST /api/v1/frame
```

API tùy chọn để xem trạng thái demo:

```text
GET /api/v1/state?device_id=pbl5-01
```

---

## 6. API: ESP32 chính gửi sensor data

### Endpoint

```http
POST /api/v1/sensor
Content-Type: application/json
```

### Chu kỳ gửi

ESP32 chính gửi dữ liệu mỗi 500ms.

### Payload

```json
{
  "device_id": "pbl5-01",
  "type": "sensor",
  "seq": 123,
  "millis": 456789,
  "distance_cm": 72.4,
  "distance_valid": true,
  "obstacle_in_1m": true,
  "alert_level": "warning",
  "gps": {
    "fix": false,
    "lat": 16.047079,
    "lng": 108.206230,
    "sats": 0
  }
}
```

### Ý nghĩa field

| Field | Ý nghĩa |
|---|---|
| `device_id` | ID chung của thiết bị demo |
| `type` | Loại dữ liệu, ở đây là `sensor` |
| `seq` | Số thứ tự gói tin |
| `millis` | Thời gian tính từ khi ESP32 boot |
| `distance_cm` | Khoảng cách đo được từ HC-SR04 |
| `distance_valid` | `true` nếu đo hợp lệ |
| `obstacle_in_1m` | `true` nếu có vật trong 1m |
| `alert_level` | Mức cảnh báo: `clear`, `warning`, `danger`, `critical` |
| `gps.fix` | GPS có fix thật hay không |
| `gps.lat` | Vĩ độ |
| `gps.lng` | Kinh độ |
| `gps.sats` | Số vệ tinh GPS |

### Response

```json
{
  "ok": true,
  "scene_context": {
    "type": "person",
    "risk_level": "warning",
    "confidence": 0.82,
    "age_ms": 1200,
    "fresh": true
  }
}
```

ESP32 chính dùng `scene_context` để đổi kiểu bíp và thể hiện tương tác AI với phần cứng. Tuy nhiên, nếu request lỗi hoặc context quá cũ, ESP32 vẫn phải fallback theo khoảng cách HC-SR04.

### Ngữ cảnh server trả về

Server quy đổi kết quả nhận diện ảnh thành một trong các ngữ cảnh:

| `scene_context.type` | Ý nghĩa |
|---|---|
| `clear` | Không thấy vật đáng chú ý |
| `person` | Có người phía trước |
| `vehicle` | Có xe máy, xe đạp, ô tô, xe tải hoặc phương tiện tương tự |
| `static_obstacle` | Vật cản tĩnh như ghế, cột, thùng, chướng ngại vật |
| `unknown` | AI thấy vật nhưng không chắc loại |
| `stale` | Chưa có ảnh mới hoặc detection đã quá cũ |

Server là nơi quy định giới hạn context. ESP32 chính không tự suy luận object type từ ảnh và không gọi API riêng để lấy context. ESP32 chính gửi `POST /api/v1/sensor`; server lưu telemetry rồi trả `scene_context` mới nhất trong response của chính request đó.

Contract final cho `scene_context`:

```json
{
  "type": "person",
  "risk_level": "warning",
  "confidence": 0.82,
  "age_ms": 1200,
  "fresh": true
}
```

Giá trị hợp lệ:

```text
type:
  clear | person | vehicle | static_obstacle | unknown | stale

risk_level:
  clear | info | warning | danger
```

Nếu server trả `type` hoặc `risk_level` ngoài danh sách trên, ESP32 chính coi context đó như `unknown` hoặc `stale` và fallback theo HC-SR04. Điều này giúp demo không bị lỗi nếu server thay đổi response.

Quy tắc freshness:

```text
age_ms <= 7000:
  fresh = true

age_ms > 7000:
  coi như stale, ESP32 không dùng để ép cảnh báo mạnh
```

---

## 7. API: ESP32-CAM gửi ảnh

### Endpoint

```http
POST /api/v1/frame
Content-Type: multipart/form-data
```

### Chu kỳ gửi

ESP32-CAM chụp và gửi ảnh mỗi 5 giây.

### Form fields

```text
device_id = pbl5-01
type = frame
cam_seq = 45
millis = 987654
image = esp32cam.jpg
```

### Response

```json
{
  "ok": true,
  "frame_id": "frame_45",
  "matched_sensor": {
    "seq": 123,
    "distance_cm": 72.4,
    "gps": {
      "fix": false,
      "lat": 16.047079,
      "lng": 108.206230
    }
  },
  "detection": {
    "type": "static_obstacle",
    "risk_level": "warning",
    "confidence": 0.76
  }
}
```

Nếu chưa có object detection, server có thể trả:

```json
{
  "ok": true,
  "detection": {
    "type": "unknown",
    "risk_level": "clear",
    "confidence": 0
  }
}
```

---

## 8. API: xem trạng thái demo

### Endpoint

```http
GET /api/v1/state?device_id=pbl5-01
```

### Response

```json
{
  "device_id": "pbl5-01",
  "latest_sensor": {
    "seq": 123,
    "distance_cm": 72.4,
    "obstacle_in_1m": true,
    "alert_level": "warning",
    "gps": {
      "fix": false,
      "lat": 16.047079,
      "lng": 108.206230
    }
  },
  "latest_frame": {
    "frame_id": "frame_45",
    "image_url": "/uploads/frame_45.jpg"
  },
  "scene_context": {
    "type": "static_obstacle",
    "risk_level": "warning",
    "confidence": 0.76,
    "age_ms": 1200,
    "fresh": true
  }
}
```

Endpoint này dùng để demo/debug, không bắt buộc cho ESP32.

---

## 9. Quy trình hoạt động

### 9.1 Khi không có vật gần

```text
ESP32 chính:
  - Đọc HC-SR04
  - Đọc GPS
  - Không bật buzzer
  - Gửi /sensor mỗi 500ms với obstacle_in_1m = false

ESP32-CAM:
  - Chụp ảnh mỗi 5s
  - Gửi /frame lên server

Server:
  - Lưu sensor data gần nhất
  - Lưu ảnh gần nhất
  - Ghép ảnh với sensor data gần thời điểm nhận nhất
  - Trả scene_context = clear/stale nếu chưa có detection mới
```

### 9.2 Khi có vật trong 1m

```text
HC-SR04 đo được distance < 100cm
→ ESP32 chính bật buzzer theo khoảng cách ngay
→ ESP32 chính gửi obstacle_in_1m = true lên /sensor
→ Server trả scene_context mới nhất từ ảnh nếu có
→ ESP32 chính đổi kiểu bíp theo scene_context nếu context còn mới
→ Frame tiếp theo từ ESP32-CAM được ghép với distance/GPS gần nhất
```

Buzzer không chờ server để cảnh báo vật gần, nhưng có dùng scene_context từ server để đổi kiểu bíp khi có dữ liệu AI mới.

### 9.3 Khi AI thấy ngữ cảnh nguy hiểm nhưng siêu âm chưa dưới 1m

```text
ESP32-CAM gửi ảnh lên server
→ Server nhận diện person/vehicle/static_obstacle
→ Server lưu scene_context mới nhất
→ ESP32 chính gửi /sensor chu kỳ tiếp theo
→ Server trả scene_context trong response
→ ESP32 chính có thể bíp mức vision_only để thể hiện cảnh báo từ AI
```

Chỉ dùng cảnh báo kiểu `vision_only` nếu `scene_context.fresh = true` và `age_ms <= 7000`.

### 9.4 Khi server hoặc Internet lỗi

```text
ESP32 chính:
  - Vẫn đọc siêu âm
  - Vẫn điều khiển buzzer theo khoảng cách
  - Bỏ qua request lỗi và gửi lại ở chu kỳ tiếp theo
  - Dùng scene_context cuối cùng nếu còn mới, nếu quá 7 giây thì bỏ

ESP32-CAM:
  - Tiếp tục chụp/upload ở chu kỳ tiếp theo
```

Không để lỗi server làm mất chức năng cảnh báo gần.

---

## 10. Cách server ghép ảnh với sensor data

Vì ESP32 chính gửi sensor data mỗi 500ms, còn ESP32-CAM gửi ảnh mỗi 5s, server chỉ cần lưu sensor data mới nhất theo `device_id`.

Khi nhận ảnh:

```text
1. Server nhận POST /api/v1/frame
2. Lấy latest_sensor của cùng device_id
3. Nếu latest_sensor đủ mới, ví dụ nhận trong vòng 2 giây gần đây, ghép vào frame
4. Nếu latest_sensor quá cũ, đánh dấu sensor_missing
5. Lưu frame + distance + GPS + detection
```

Không nên ghép bằng `millis` của hai board, vì ESP32 chính và ESP32-CAM boot ở hai thời điểm khác nhau. Với demo, dùng thời gian server nhận request là đủ.

Ví dụ:

```text
10:00:00.500 server nhận sensor seq=100
10:00:01.000 server nhận sensor seq=101
10:00:01.200 server nhận frame cam_seq=20

→ frame cam_seq=20 ghép với sensor seq=101
```

---

## 11. Logic buzzer trên ESP32 chính

Buzzer được quyết định bởi 2 input:

```text
1. distance_level từ HC-SR04 trên ESP32 chính
2. scene_context từ AI trên server
```

Server không gửi lệnh bật/tắt buzzer trực tiếp. Server chỉ trả ngữ cảnh. ESP32 chính là nơi quyết định cuối cùng, vì ESP32 có khoảng cách realtime và phải còn cảnh báo được khi server chậm hoặc mất mạng.

### 11.1 Distance level

ESP32 chính chia khoảng cách thành các mức:

```text
distance < 30cm:
  distance_level = critical

30cm <= distance < 60cm:
  distance_level = danger

60cm <= distance < 100cm:
  distance_level = warning

>= 100cm hoặc không đo được:
  distance_level = clear
```

Nên có hysteresis để tránh tắt/bật liên tục quanh ngưỡng 100cm:

```text
Bắt đầu cảnh báo khi distance < 100cm.
Chỉ tắt hẳn khi distance > 110cm.
```

### 11.2 Khi nào buzzer kêu

Buzzer kêu nếu một trong hai điều kiện đúng:

```text
distance_level != clear
OR scene_context.fresh = true AND scene_context.risk_level != clear
```

Buzzer im lặng nếu:

```text
distance >= 110cm
AND scene_context là clear/stale/unknown yếu
```

Nếu HC-SR04 lỗi hoặc server lỗi, không được làm hệ thống treo. ESP32 dùng dữ liệu còn lại:

```text
HC-SR04 lỗi, AI fresh có risk:
  bíp theo vision_only

Server lỗi, distance < 100cm:
  bíp theo khoảng cách

Server lỗi và distance >= 100cm:
  im lặng
```

### 11.3 Tốc độ bíp theo khoảng cách

Khoảng cách quyết định độ gấp:

```text
clear:
  im lặng

vision_only:
  1 cụm bíp nhẹ mỗi 2000ms

warning:
  1 cụm bíp mỗi 1000ms

danger:
  1 cụm bíp mỗi 450ms

critical:
  bíp rất nhanh mỗi 200-250ms
```

### 11.4 Kiểu cụm bíp theo scene_context

Ngữ cảnh AI quyết định kiểu cụm bíp:

```text
person:
  bíp đôi: beep-beep

vehicle:
  bíp ba nhịp nhanh: beep-beep-beep

static_obstacle:
  bíp đơn: beep

unknown:
  bíp đơn ngắn, nhẹ hơn

clear/stale:
  dùng pattern mặc định theo distance
```

### 11.5 Priority

```text
1. distance < 30cm:
   critical luôn thắng, bất kể AI nói gì

2. vehicle fresh:
   nâng tối thiểu lên danger

3. person fresh:
   dùng bíp đôi, tối thiểu warning

4. static_obstacle fresh:
   dùng bíp đơn, tối thiểu warning

5. không có AI hoặc AI stale:
   fallback theo distance
```

### 11.6 Ví dụ hành vi

```text
Không có vật, AI clear:
  im lặng

Có vật 80cm, AI chưa có ảnh:
  bíp chậm mặc định

Có người trong ảnh, distance 80cm:
  bíp đôi chậm

Có xe trong ảnh, distance 120cm:
  bíp vision_only hoặc danger nhẹ để thể hiện AI

Có vật 25cm, AI clear:
  bíp critical rất nhanh

Server mất mạng:
  buzzer vẫn chạy theo HC-SR04
```

---

## 12. Thứ tự test đề xuất

### Bước 1: Test nguồn ESP32 chính

```text
Pin → công tắc → MT3608 → ESP32 chính
```

Yêu cầu:

- MT3608 output giữ khoảng 4.8V–5.1V khi ESP32 bật Wi-Fi.
- ESP32 không reset liên tục.
- Webhook/server nhận sensor JSON đều.

### Bước 2: Test HC-SR04

Yêu cầu:

- `distance_cm` thay đổi khi đưa tay/vật lại gần.
- `obstacle_in_1m` chuyển đúng true/false.
- Buzzer bíp khi khoảng cách dưới 100cm.

### Bước 3: Test GPS

Yêu cầu:

- Nếu ngoài trời, GPS có thể fix và trả lat/lng thật.
- Nếu trong nhà, dùng tọa độ giả để test server.
- `gps.fix` phải thể hiện đúng trạng thái thật/giả.

### Bước 4: Test ESP32-CAM riêng

Yêu cầu:

- ESP32-CAM dùng sạc dự phòng.
- Chụp ảnh mỗi 5 giây.
- Server nhận ảnh đều.
- Không reset khi upload.

### Bước 5: Test full demo

Yêu cầu:

- Server nhận sensor mỗi 500ms.
- Server nhận ảnh mỗi 5s.
- Server ghép ảnh với sensor data gần nhất.
- Server trả scene_context từ AI cho ESP32 chính.
- Buzzer đổi kiểu bíp theo scene_context và distance_level.
- Buzzer vẫn fallback theo HC-SR04 khi server/AI lỗi.
- Hệ thống chạy ổn định vài phút.

---

## 13. Điều kiện demo thành công

Demo được xem là thành công nếu:

```text
1. ESP32 chính gửi sensor data đều mỗi 500ms.
2. ESP32-CAM gửi ảnh đều mỗi 5s.
3. Server hiển thị được ảnh + distance + GPS gần thời điểm đó.
4. Server tạo được scene_context từ ảnh và trả về cho ESP32 chính.
5. Khi có vật < 1m, buzzer bíp theo mức khoảng cách.
6. Khi AI nhận diện person/vehicle/static_obstacle, buzzer đổi kiểu bíp tương ứng.
7. Khi mất server/Internet tạm thời, buzzer vẫn hoạt động theo HC-SR04.
8. Không có hiện tượng reset nguồn liên tục trong vài phút demo.
```

---

## 14. Ghi chú mở rộng sau demo

Các cải tiến sau demo có thể cân nhắc:

- Thêm BMS 1S hoặc module sạc + boost 5V 2A cho nhánh ESP32 chính.
- Thêm tụ 470uF–1000uF gần ESP32 chính.
- Tối ưu server để nhận sensor batch thay vì gửi HTTP mỗi 500ms.
- Dùng MQTT/WebSocket nếu cần realtime hơn.
- Tối ưu object detection để giảm độ trễ scene_context.
- Cho ESP32 chính lấy config buzzer/context từ server để đổi rule mà không cần nạp lại firmware.
- Thêm trang web demo hiển thị ảnh mới nhất, distance, GPS, trạng thái buzzer.
