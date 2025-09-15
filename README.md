# screenshot Server

Script nhỏ cho phép bạn chụp ảnh tất cả trang phục GTA, phụ kiện/đối tượng hoặc xe cộ trên nền xanh lá.
Bạn có thể sử dụng chúng cho kho đồ, cửa hàng trang phục hoặc cửa hàng xe.

## Sử dụng hình ảnh
Bạn được tự do sử dụng hình ảnh trong các dự án mã nguồn mở với ghi công phù hợp.
Để sử dụng thương mại, vui lòng liên hệ với tôi trên Discord để thảo luận về điều kiện.

## Tính năng chính
- Chụp ảnh tất cả trang phục GTA, bao gồm trang phục addon
- Chụp ảnh tất cả đối tượng và phụ kiện trong GTA, bao gồm phụ kiện addon
- Chụp ảnh tất cả xe cộ trong GTA, bao gồm xe addon
- Ảnh được đặt tên chi tiết để tích hợp dễ dàng vào script của bạn
- Giao diện tiến trình tối giản cho sự tiện lợi của người dùng
- Nhân vật gần như hoàn toàn vô hình
- Vị trí camera có thể tùy chỉnh thông qua cài đặt cấu hình
- Tùy chọn bật chu trình qua các biến thể texture
- Tự động loại bỏ nền xanh lá
- Sử dụng hộp xanh lá lớn


## Cài đặt
**Dependencies**
- [screenshot-basic](https://github.com/citizenfx/screenshot-basic)
- yarn

### Bước 1
Đơn giản đặt resource vào thư mục resources của bạn.

**Không sử dụng thư mục con như `resources/[scripts]` vì sẽ gây ra lỗi script.**

## Cách sử dụng

### Chụp tất cả trang phục
Thực thi lệnh `/screenshot` để bắt đầu quá trình chụp ảnh trang phục.
Hãy kiên nhẫn vì có thể mất một chút thời gian để hoàn thành, và nên không can thiệp vào PC của bạn trong quá trình này.

**Kết quả:** Chụp tất cả trang phục và phụ kiện của cả nam và nữ
**Cấu trúc lưu:** `clothings/male/legs/legs_3_1.png`, `clothings/female/tops/tops_5_2.png`

### Chụp trang phục cụ thể
Sử dụng lệnh `/customscreenshot` để chụp một trang phục cụ thể.

**Cú pháp:**
```
/customscreenshot <gender> <component_name> <drawable/all> [camera_settings]
```

**Ví dụ:**
```
/customscreenshot male legs all
/customscreenshot female tops 5
/customscreenshot both head all
/customscreenshot male glasses 3
```

**Ví dụ với camera_settings:**
```
/customscreenshot male legs all {"fov": 50, "rotation": {"x": 0, "y": 0, "z": 15}, "zPos": 0.26}
/customscreenshot female tops 5 {"fov": 45, "rotation": {"x": 0, "y": 0, "z": 0}, "zPos": 0.65}
```

### 📷 **Camera Settings**

Tham số `camera_settings` cho phép tùy chỉnh góc chụp và vị trí camera:

**Format JSON:**
```json
{
  "fov": 50,
  "rotation": {
    "x": 0,
    "y": 0, 
    "z": 15
  },
  "zPos": 0.26
}
```

**Tham số:**
- **`fov`** (number): Góc nhìn camera (10-90 độ)
  - `10-30`: Góc hẹp, chi tiết cao
  - `40-60`: Góc trung bình (mặc định)
  - `70-90`: Góc rộng, toàn cảnh

- **`rotation`** (object): Xoay camera
  - **`x`**: Xoay dọc (-180 đến 180)
  - **`y`**: Xoay ngang (-180 đến 180)  
  - **`z`**: Xoay trục (-180 đến 180)

- **`zPos`** (number): Vị trí camera theo trục Z
  - `0.1-0.5`: Camera gần, chi tiết
  - `0.6-1.0`: Camera trung bình (mặc định)
  - `1.1-2.0`: Camera xa, toàn cảnh

**Ví dụ thực tế:**
```
# Chụp quần với góc rộng
/customscreenshot male legs all {"fov": 70, "zPos": 1.2}

# Chụp mũ với góc hẹp, chi tiết
/customscreenshot female head all {"fov": 25, "zPos": 0.3}

# Chụp áo với xoay góc 45 độ
/customscreenshot male tops 5 {"rotation": {"z": 45}, "fov": 55}
```

**Component names có sẵn:**
- `head` (mũ)
- `glasses` (kính)
- `ears` (tai nghe)
- `torso` (áo trong)
- `legs` (quần)
- `bags` (túi)
- `feet` (giày)
- `accessories` (phụ kiện)
- `undershirts` (áo trong)
- `bodyarmor` (áo giáp)
- `decals` (hình xăm)
- `tops` (áo ngoài)

**Tự động phân loại:**
- **PROPS**: head, glasses, ears, feet, accessories
- **CLOTHING**: torso, legs, bags, undershirts, bodyarmor, decals, tops

### Chụp đối tượng/xe cộ
Để chụp đối tượng hoặc xe cộ, sử dụng lệnh `/screenshotobject`.

**Cú pháp:**
```
/screenshotobject <model>
```

**Ví dụ:**
```
/screenshotobject weapon_pistol
/screenshotobject adder
/screenshotobject prop_chair
```

**Tự động nhận biết:**
- **Vehicle**: Tự động tạo bằng `CreateVehicle()`, chụp 37 ảnh (360°)
- **Object**: Tự động tạo bằng `CreateObjectNoOffset()`, chụp 37 ảnh (360°)

**Cấu trúc lưu:**
- **Vehicle**: `vehicles/adder_0.png` đến `vehicles/adder_36.png`
- **Object**: `objects/weapon_pistol_0.png` đến `objects/weapon_pistol_36.png`

## Cấu trúc thư mục

```
clothings/
├── male/
│   ├── legs/
│   │   ├── legs_3_1.png
│   │   └── ...
│   ├── tops/
│   │   ├── tops_5_2.png
│   │   └── ...
│   └── ...
└── female/
    ├── legs/
    │   ├── legs_3_1.png
    │   └── ...
    └── ...

vehicles/
├── adder_0.png
├── adder_1.png
├── adder_2.png
├── ...
├── adder_36.png
├── zentorno_0.png
├── zentorno_1.png
└── ...

objects/
├── weapon_pistol_0.png
├── weapon_pistol_1.png
├── weapon_pistol_2.png
├── ...
└── weapon_pistol_36.png
```

## 💖 Hỗ trợ dự án

Dự án này được phát triển miễn phí với mục đích hỗ trợ cộng đồng FiveM. Nếu bạn thấy hữu ích và muốn ủng hộ để duy trì phát triển, bạn có thể:

---

### 🏦 **Thông tin chuyển khoản**

<table>
<tr>
<td><strong>🏛️ Ngân hàng</strong></td>
<td>Techcombank</td>
</tr>
<tr>
<td><strong>💳 Số tài khoản</strong></td>
<td><code>3500188888</code></td>
</tr>
<tr>
<td><strong>👤 Tên chủ tài khoản</strong></td>
<td><code>NGUYEN KY PHUONG</code></td>
</tr>
</table>

---

### 📱 **QR Code chuyển khoản**

<div align="center">

![QR Code](https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021138540010A00000072701240006970407011035001888880208QRIBFTTA53037045802VN83008400630481DB)

**Quét mã QR để chuyển khoản nhanh chóng**

</div>

---

### 🎯 **Cách thức ủng hộ**

1. **📱 Quét QR code** bằng app ngân hàng bất kỳ
2. **💳 Chuyển khoản** trực tiếp qua số tài khoản
3. **💰 Số tiền** tùy ý, không giới hạn

---

### 🙏 **Lời cảm ơn**

Mọi sự ủng hộ của bạn đều được đánh giá cao và sẽ được sử dụng để:
- 🔧 Cải thiện và phát triển thêm tính năng
- 🐛 Sửa lỗi và tối ưu hóa hiệu suất  
- 📚 Tạo thêm tài liệu hướng dẫn
- 🌟 Duy trì dự án miễn phí cho cộng đồng

**Cảm ơn bạn đã tin tưởng và ủng hộ! 💝**