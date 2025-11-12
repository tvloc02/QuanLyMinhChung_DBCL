# Flow Trạng Thái Báo Cáo (Report Status Flow)

## Tổng Quan

Hệ thống quản lý báo cáo với 6 trạng thái chính, theo flow tuyến tính từ soạn thảo đến phát hành.

## Các Trạng Thái

### 1. **draft** (Bản nháp)
- **Mô tả**: Báo cáo đang được soạn thảo
- **Người thực hiện**: Reporter (người được giao nhiệm vụ viết báo cáo)
- **Hành động có thể**:
  - Chỉnh sửa nội dung
  - Lưu bản nháp
  - Chuyển sang trạng thái `public` khi hoàn thành

### 2. **public** (Công khai)
- **Mô tả**: Báo cáo được công khai để Manager/Admin xem xét
- **Người thực hiện**: Reporter submit báo cáo
- **Hành động có thể**:
  - Manager/Admin xem xét báo cáo
  - Chấp thuận → chuyển sang `approved`
  - Từ chối → chuyển sang `rejected`

### 3. **rejected** (Từ chối)
- **Mô tả**: Báo cáo bị từ chối, cần chỉnh sửa
- **Người thực hiện**: Manager/Admin từ chối với lý do cụ thể
- **Hành động có thể**:
  - Reporter xem lý do từ chối
  - Chỉnh sửa báo cáo
  - Submit lại → chuyển về `public`

### 4. **approved** (Chấp thuận)
- **Mô tả**: Báo cáo được chấp thuận, sẵn sàng giao cho chuyên gia đánh giá
- **Người thực hiện**: Manager/Admin chấp thuận báo cáo
- **Hành động có thể**:
  - Manager/Admin tạo Assignment (phân công đánh giá)
  - Giao báo cáo cho Evaluator (chuyên gia)
  - Khi có Assignment được tạo → tự động chuyển sang `in_evaluation`

### 5. **in_evaluation** (Đang đánh giá)
- **Mô tả**: Báo cáo đang được chuyên gia đánh giá
- **Người thực hiện**: Evaluator (chuyên gia) đánh giá báo cáo
- **Hành động có thể**:
  - Evaluator xem báo cáo
  - Evaluator tạo Evaluation (đánh giá)
  - Evaluator submit đánh giá
  - Khi tất cả đánh giá hoàn thành → Manager/Admin có thể phát hành

### 6. **published** (Phát hành)
- **Mô tả**: Báo cáo và kết quả đánh giá được phát hành công khai
- **Người thực hiện**: Manager/Admin phát hành báo cáo
- **Nội dung phát hành**:
  - Nội dung báo cáo đầy đủ
  - Tất cả các đánh giá từ chuyên gia
  - Điểm số và nhận xét
- **Hành động có thể**:
  - Xem báo cáo và đánh giá
  - Tải xuống báo cáo
  - Xuất báo cáo

## Flow Chart

```
┌─────────┐
│  draft  │ ← Reporter soạn thảo
└────┬────┘
     │ Submit
     ▼
┌─────────┐
│ public  │ ← Manager/Admin xem xét
└────┬────┘
     │
     ├─── Chấp thuận ──→ ┌──────────┐
     │                   │ approved │ ← Sẵn sàng giao cho chuyên gia
     │                   └────┬─────┘
     │                        │ Tạo Assignment
     │                        ▼
     │                   ┌────────────────┐
     │                   │ in_evaluation  │ ← Chuyên gia đánh giá
     │                   └────┬───────────┘
     │                        │ Hoàn thành đánh giá
     │                        ▼
     │                   ┌───────────┐
     │                   │ published │ ← Phát hành báo cáo + đánh giá
     │                   └───────────┘
     │
     └─── Từ chối ──→ ┌──────────┐
                      │ rejected │ ← Cần chỉnh sửa
                      └────┬─────┘
                           │ Chỉnh sửa & Submit lại
                           ▼
                      ┌─────────┐
                      │ public  │
                      └─────────┘
```

## Quy Tắc Quan Trọng

### 1. Assignment (Phân công đánh giá)
- **Chỉ có thể tạo Assignment khi báo cáo ở trạng thái `approved`**
- Khi tạo Assignment:
  - Báo cáo tự động chuyển sang `in_evaluation`
  - Chuyên gia nhận thông báo
  - Chuyên gia có thể xem báo cáo và tạo đánh giá

### 2. Quyền Hạn
- **Reporter**: Tạo, chỉnh sửa (draft, rejected), submit (public)
- **Manager/Admin**: Xem xét, chấp thuận/từ chối, tạo Assignment, phát hành
- **Evaluator**: Xem báo cáo (in_evaluation), tạo đánh giá

### 3. Validation
- Không thể tạo Assignment nếu báo cáo không ở trạng thái `approved`
- Không thể phát hành nếu chưa có đánh giá hoàn thành
- Không thể chỉnh sửa báo cáo khi đang ở trạng thái `in_evaluation` hoặc `published`

## Thay Đổi So Với Trước

### Đã Xóa
- ❌ `in_progress` - Không cần thiết, thay bằng `draft`
- ❌ `submitted` - Không cần thiết, thay bằng `public`

### Đã Thêm
- ✅ `in_evaluation` - Trạng thái mới cho quá trình đánh giá
- ✅ Flow rõ ràng hơn: draft → public → approved → in_evaluation → published

### Lợi Ích
1. **Flow tuyến tính**: Dễ hiểu, dễ theo dõi
2. **Phân quyền rõ ràng**: Mỗi role có trách nhiệm cụ thể
3. **Tách biệt quy trình**: Viết báo cáo → Xem xét → Đánh giá → Phát hành
4. **Dễ mở rộng**: Có thể thêm trạng thái mới nếu cần
