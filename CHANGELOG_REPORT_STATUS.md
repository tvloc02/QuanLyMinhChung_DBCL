# Changelog - Cập Nhật Flow Trạng Thái Báo Cáo

## Ngày: 12/11/2025

### 🎯 Mục Tiêu
Sửa lại flow trạng thái báo cáo để rõ ràng hơn, tách biệt quy trình viết báo cáo, xem xét, đánh giá và phát hành.

---

## 📋 Các Thay Đổi Chính

### 1. **Report Model** (`backend/models/report/Report.js`)

#### Status Enum - CŨ:
```javascript
enum: ['draft', 'public', 'approved', 'rejected', 'published', 'in_progress', 'submitted']
```

#### Status Enum - MỚI:
```javascript
enum: ['draft', 'public', 'rejected', 'approved', 'in_evaluation', 'published']
```

#### Các Thay Đổi:
- ❌ **Xóa**: `in_progress`, `submitted` (không cần thiết)
- ✅ **Thêm**: `in_evaluation` (đang đánh giá)
- ✅ **Sắp xếp lại**: Flow tuyến tính rõ ràng hơn

#### Methods Mới:
```javascript
// Công khai báo cáo để Manager/Admin xem xét
reportSchema.methods.makePublic = async function(userId)

// Chấp thuận báo cáo
reportSchema.methods.approve = async function(userId, feedback = '')

// Từ chối báo cáo
reportSchema.methods.reject = async function(userId, reason)

// Phát hành báo cáo (đã có sẵn, cập nhật logic)
reportSchema.methods.publish = async function(userId)
```

---

### 2. **Assignment Controller** (`backend/controllers/report/assignmentController.js`)

#### Validation Mới:
```javascript
// CHỈ cho phép tạo assignment khi report có status = 'approved'
if (report.status !== 'approved') {
    return res.status(400).json({
        success: false,
        message: 'Chỉ có thể phân công đánh giá báo cáo đã được chấp thuận'
    });
}
```

#### Bulk Create:
- Cập nhật để chỉ tìm reports với `status: 'approved'`
- Thông báo lỗi rõ ràng hơn

---

### 3. **Report Controller** (`backend/controllers/report/reportController.js`)

#### Publish Report Logic:
```javascript
// Chỉ cho phép publish khi:
// 1. Status = 'in_evaluation'
// 2. Có ít nhất 1 đánh giá hoàn thành

if (report.status !== 'in_evaluation') {
    return res.status(400).json({
        message: 'Chỉ có thể phát hành báo cáo đang trong quá trình đánh giá'
    });
}

const completedAssignments = await Assignment.countDocuments({
    reportId: report._id,
    status: 'completed'
});

if (completedAssignments === 0) {
    return res.status(400).json({
        message: 'Báo cáo phải có ít nhất một đánh giá hoàn thành trước khi phát hành'
    });
}
```

#### Status Filters:
- Cập nhật tất cả queries để loại bỏ `in_progress`, `submitted`
- Thêm `in_evaluation` vào các filters
- Cập nhật user access queries

---

### 4. **Activity Log Model** (`backend/models/system/ActivityLog.js`)

#### Actions Mới:
```javascript
'report_make_public',  // Công khai báo cáo
'report_approve',      // Chấp thuận báo cáo
'report_reject',       // Từ chối báo cáo
'report_publish',      // Phát hành báo cáo (đã có, giữ nguyên)
```

#### Text Mapping:
```javascript
'report_make_public': 'Công khai báo cáo',
'report_approve': 'Chấp thuận báo cáo',
'report_reject': 'Từ chối báo cáo',
'report_publish': 'Phát hành báo cáo',
```

---

## 🔄 Flow Mới

### Luồng Chính:
```
1. draft (Bản nháp)
   ↓ Reporter submit
2. public (Công khai)
   ↓ Manager/Admin xem xét
   ├─→ approved (Chấp thuận)
   │   ↓ Tạo Assignment
   │   in_evaluation (Đang đánh giá)
   │   ↓ Evaluator hoàn thành
   │   published (Phát hành)
   │
   └─→ rejected (Từ chối)
       ↓ Reporter chỉnh sửa
       public (Submit lại)
```

### Quy Tắc:
1. **Assignment chỉ được tạo khi report = `approved`**
2. **Khi tạo Assignment → report tự động chuyển sang `in_evaluation`**
3. **Publish chỉ được phép khi:**
   - Report status = `in_evaluation`
   - Có ít nhất 1 assignment với status = `completed`

---

## 📝 Tài Liệu

### File Tham Khảo:
- `REPORT_STATUS_FLOW.md` - Chi tiết flow và quy tắc
- `CHANGELOG_REPORT_STATUS.md` - File này

### Models Đã Cập Nhật:
- ✅ `backend/models/report/Report.js`
  - Status enum mới
  - Methods: `approve()`, `reject()`, `makePublic()`, `publish()`
- ✅ `backend/models/report/Assignment.js`
  - Post-save hook tự động chuyển report sang 'in_evaluation'
- ✅ `backend/models/system/ActivityLog.js`
  - Actions mới: `report_make_public`, `report_approve`, `report_reject`

### Controllers Đã Cập Nhật:
- ✅ `backend/controllers/report/reportController.js`
  - `approveReport()` - Chỉ approve khi status = 'public'
  - `rejectReport()` - Chỉ reject khi status = 'public', yêu cầu lý do
  - `makePublic()` - Chỉ từ 'draft' hoặc 'rejected'
  - `publishReport()` - Chỉ khi 'in_evaluation' và có đánh giá hoàn thành
- ✅ `backend/controllers/report/assignmentController.js`
  - `createAssignment()` - Chỉ tạo khi report status = 'approved'
  - `bulkCreateAssignments()` - Chỉ tạo khi report status = 'approved'

---

## ⚠️ Breaking Changes

### 1. Status Values
- Code cũ sử dụng `in_progress` hoặc `submitted` sẽ không hoạt động
- Cần cập nhật frontend để sử dụng status mới

### 2. Assignment Creation
- Không thể tạo assignment cho report có status khác `approved`
- Code cũ tạo assignment cho `published` reports sẽ fail

### 3. Publish Logic
- Không thể publish report ở status `approved` nữa
- Phải có assignment completed trước khi publish

---

## 🔧 Migration Cần Thiết

### Database Migration:
```javascript
// Cập nhật các reports có status cũ
db.reports.updateMany(
    { status: 'in_progress' },
    { $set: { status: 'draft' } }
);

db.reports.updateMany(
    { status: 'submitted' },
    { $set: { status: 'public' } }
);
```

### Frontend Updates Cần Thiết:
1. Cập nhật status constants
2. Cập nhật UI hiển thị status
3. Cập nhật logic transitions giữa các status
4. Thêm buttons cho approve/reject/makePublic
5. Cập nhật validation rules

---

## ✅ Testing Checklist

- [ ] Tạo report mới (draft)
- [ ] Submit report (draft → public)
- [ ] Approve report (public → approved)
- [ ] Reject report (public → rejected)
- [ ] Resubmit after rejection (rejected → public)
- [ ] Create assignment (approved → in_evaluation)
- [ ] Complete evaluation
- [ ] Publish report (in_evaluation → published)
- [ ] Verify permissions cho từng action
- [ ] Verify activity logs được tạo đúng

---

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, tham khảo:
- `REPORT_STATUS_FLOW.md` - Flow chi tiết
- Backend logs - Kiểm tra validation errors
- Activity logs - Theo dõi status transitions
