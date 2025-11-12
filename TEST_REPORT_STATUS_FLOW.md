# Test Report Status Flow

## 🎯 Mục Đích
Hướng dẫn test flow trạng thái báo cáo mới sau khi cập nhật.

---

## 📋 Flow Cần Test

```
draft → public → approved → in_evaluation → published
              ↓
           rejected → (quay lại public)
```

---

## ✅ Test Cases

### 1. Tạo Báo Cáo Mới (Draft)
**Endpoint:** `POST /api/reports`

**Expected:**
- Status mặc định = `draft`
- Chỉ người tạo và admin/manager có thể xem

**Test:**
```bash
# Tạo report mới
POST /api/reports
{
  "title": "Test Report",
  "type": "standard",
  "content": "Test content"
}

# Verify: status = 'draft'
```

---

### 2. Công Khai Báo Cáo (Draft → Public)
**Endpoint:** `POST /api/reports/:id/make-public`

**Conditions:**
- Status hiện tại = `draft` hoặc `rejected`
- Người tạo hoặc admin/manager

**Expected:**
- Status chuyển sang `public`
- Activity log: `report_make_public`

**Test:**
```bash
POST /api/reports/{reportId}/make-public

# Verify: status = 'public'
```

---

### 3. Chấp Thuận Báo Cáo (Public → Approved)
**Endpoint:** `POST /api/reports/:id/approve`

**Conditions:**
- Status hiện tại = `public`
- Manager hoặc Admin

**Body:**
```json
{
  "feedback": "Báo cáo đạt yêu cầu, chấp thuận để đánh giá"
}
```

**Expected:**
- Status chuyển sang `approved`
- `approvedBy`, `approvedAt`, `approvalFeedback` được set
- Activity log: `report_approve`

**Test:**
```bash
POST /api/reports/{reportId}/approve
{
  "feedback": "Chấp thuận báo cáo"
}

# Verify: status = 'approved'
```

---

### 4. Từ Chối Báo Cáo (Public → Rejected)
**Endpoint:** `POST /api/reports/:id/reject`

**Conditions:**
- Status hiện tại = `public`
- Manager hoặc Admin
- **Bắt buộc** có `feedback`

**Body:**
```json
{
  "feedback": "Báo cáo cần bổ sung thêm dữ liệu minh chứng"
}
```

**Expected:**
- Status chuyển sang `rejected`
- `rejectedBy`, `rejectedAt`, `rejectionFeedback` được set
- Thêm vào `rejectionHistory`
- Activity log: `report_reject`

**Test:**
```bash
POST /api/reports/{reportId}/reject
{
  "feedback": "Cần bổ sung minh chứng"
}

# Verify: status = 'rejected'
```

---

### 5. Tạo Assignment (Approved → In_Evaluation)
**Endpoint:** `POST /api/assignments`

**Conditions:**
- Report status = `approved`
- Manager hoặc Admin

**Body:**
```json
{
  "reportId": "...",
  "evaluatorId": "...",
  "deadline": "2025-12-31",
  "priority": "normal",
  "assignmentNote": "Đánh giá báo cáo này"
}
```

**Expected:**
- Assignment được tạo thành công
- **Report tự động chuyển sang `in_evaluation`** (qua post-save hook)
- Activity log: `assignment_create`

**Test:**
```bash
POST /api/assignments
{
  "reportId": "{reportId}",
  "evaluatorId": "{evaluatorId}",
  "deadline": "2025-12-31",
  "priority": "normal"
}

# Verify: 
# 1. Assignment created
# 2. Report status = 'in_evaluation'
```

---

### 6. Hoàn Thành Đánh Giá
**Endpoint:** `POST /api/evaluations` (hoặc complete assignment)

**Expected:**
- Assignment status = `completed`
- Evaluation được tạo

**Test:**
```bash
# Evaluator hoàn thành đánh giá
POST /api/evaluations
{
  "assignmentId": "{assignmentId}",
  "score": 85,
  "feedback": "Báo cáo tốt"
}

# Verify: assignment.status = 'completed'
```

---

### 7. Phát Hành Báo Cáo (In_Evaluation → Published)
**Endpoint:** `POST /api/reports/:id/publish`

**Conditions:**
- Status hiện tại = `in_evaluation`
- Có ít nhất 1 assignment với status = `completed`
- Manager hoặc Admin

**Expected:**
- Status chuyển sang `published`
- Activity log: `report_publish`

**Test:**
```bash
POST /api/reports/{reportId}/publish

# Verify: 
# 1. status = 'published'
# 2. Có ít nhất 1 completed assignment
```

---

## ❌ Negative Test Cases

### 1. Không Thể Tạo Assignment Khi Report Không Phải 'Approved'
```bash
# Report status = 'draft'
POST /api/assignments
{
  "reportId": "{draftReportId}",
  "evaluatorId": "{evaluatorId}"
}

# Expected: 400 Bad Request
# Message: "Chỉ có thể phân công đánh giá báo cáo đã được chấp thuận"
```

### 2. Không Thể Publish Khi Chưa Có Đánh Giá Hoàn Thành
```bash
# Report status = 'in_evaluation' nhưng chưa có completed assignment
POST /api/reports/{reportId}/publish

# Expected: 400 Bad Request
# Message: "Báo cáo phải có ít nhất một đánh giá hoàn thành trước khi phát hành"
```

### 3. Không Thể Approve/Reject Khi Không Phải 'Public'
```bash
# Report status = 'draft'
POST /api/reports/{reportId}/approve

# Expected: 400 Bad Request
# Message: "Chỉ có thể phê duyệt báo cáo ở trạng thái công khai"
```

### 4. Không Thể Reject Mà Không Có Lý Do
```bash
POST /api/reports/{reportId}/reject
{
  "feedback": ""
}

# Expected: 400 Bad Request
# Message: "Lý do từ chối là bắt buộc"
```

---

## 🔍 Kiểm Tra Activity Logs

Sau mỗi action, kiểm tra activity logs:

```bash
GET /api/activity-logs?targetType=Report&targetId={reportId}

# Verify các actions:
# - report_create
# - report_make_public
# - report_approve / report_reject
# - report_publish
```

---

## 📊 Kiểm Tra Database

### Report Document:
```javascript
{
  status: 'approved',
  approvedBy: ObjectId,
  approvedAt: Date,
  approvalFeedback: String,
  rejectedBy: ObjectId,
  rejectedAt: Date,
  rejectionFeedback: String,
  rejectionHistory: [...]
}
```

### Assignment Document:
```javascript
{
  reportId: ObjectId,
  evaluatorId: ObjectId,
  status: 'completed',
  deadline: Date
}
```

---

## 🎯 Success Criteria

✅ **Flow hoàn chỉnh:**
1. Tạo report (draft)
2. Công khai (public)
3. Chấp thuận (approved)
4. Tạo assignment → report tự động chuyển (in_evaluation)
5. Hoàn thành đánh giá (completed)
6. Phát hành (published)

✅ **Rejection flow:**
1. Công khai (public)
2. Từ chối (rejected)
3. Sửa và công khai lại (public)
4. Chấp thuận (approved)

✅ **Validations:**
- Không tạo assignment cho non-approved reports
- Không publish khi chưa có đánh giá
- Reject phải có lý do

✅ **Activity Logs:**
- Tất cả actions được log đầy đủ
- Có thể audit trail

---

## 🚀 Quick Test Script

```javascript
// test-report-flow.js
const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const TOKEN = 'your-auth-token';

async function testReportFlow() {
  try {
    // 1. Create report
    const report = await axios.post(`${API_URL}/reports`, {
      title: 'Test Report Flow',
      type: 'standard',
      content: 'Test content'
    }, { headers: { Authorization: `Bearer ${TOKEN}` }});
    
    console.log('✓ Created report:', report.data.data._id);
    
    // 2. Make public
    await axios.post(`${API_URL}/reports/${report.data.data._id}/make-public`, {}, 
      { headers: { Authorization: `Bearer ${TOKEN}` }});
    console.log('✓ Made public');
    
    // 3. Approve
    await axios.post(`${API_URL}/reports/${report.data.data._id}/approve`, {
      feedback: 'Approved for evaluation'
    }, { headers: { Authorization: `Bearer ${TOKEN}` }});
    console.log('✓ Approved');
    
    // 4. Create assignment
    const assignment = await axios.post(`${API_URL}/assignments`, {
      reportId: report.data.data._id,
      evaluatorId: 'evaluator-id',
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }, { headers: { Authorization: `Bearer ${TOKEN}` }});
    console.log('✓ Created assignment');
    
    // 5. Check report status
    const updatedReport = await axios.get(`${API_URL}/reports/${report.data.data._id}`,
      { headers: { Authorization: `Bearer ${TOKEN}` }});
    console.log('✓ Report status:', updatedReport.data.data.status);
    
    if (updatedReport.data.data.status === 'in_evaluation') {
      console.log('✅ Flow test PASSED!');
    } else {
      console.log('❌ Flow test FAILED!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testReportFlow();
```

---

## 📞 Troubleshooting

### Issue: Assignment không tạo được
**Check:**
- Report status có phải `approved` không?
- User có quyền manager/admin không?
- Evaluator có tồn tại và có role `evaluator` không?

### Issue: Report không tự động chuyển sang `in_evaluation`
**Check:**
- Assignment post-save hook có chạy không?
- Console logs có báo lỗi không?
- Report status có phải `approved` trước khi tạo assignment không?

### Issue: Không publish được
**Check:**
- Report status có phải `in_evaluation` không?
- Có ít nhất 1 assignment với status `completed` không?
- User có quyền manager/admin không?
