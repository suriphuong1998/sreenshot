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
- **Vehicle**: Tự động tạo bằng `CreateVehicle()`, chụp 1 ảnh
- **Object**: Tự động tạo bằng `CreateObjectNoOffset()`, chụp 37 ảnh (360°)

**Cấu trúc lưu:**
- **Vehicle**: `vehicles/adder.png`
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
├── adder.png
├── zentorno.png
└── ...

objects/
├── weapon_pistol_0.png
├── weapon_pistol_1.png
└── ...
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