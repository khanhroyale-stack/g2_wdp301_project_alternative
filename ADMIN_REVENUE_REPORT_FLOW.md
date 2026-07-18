# 📊 FLOW THÊM TRANG BÁO CÁO DOANH THU ADMIN

## 🎯 Mục Tiêu

Thêm trang **Báo cáo Doanh Thu** trong Admin Dashboard để:
- 📈 Xem tổng doanh thu từ các gói Pro
- 🧾 Xem danh sách hóa đơn đăng ký Pro
- 📅 Thống kê theo thời gian và gói
- 💰 Theo dõi giao dịch thành công/thất bại

---

## ✅ PHƯƠNG ÁN DỄ NHẤT

### Lý do:
- ✅ **Không sửa database** - Dùng model `ProSubscription` có sẵn
- ✅ **Chỉ thêm 2 API** - Stats và Transactions
- ✅ **Tái sử dụng UI** - Components đã có
- ✅ **Dễ mở rộng** - Thêm filter/chart sau

---

## 🗂️ DỮ LIỆU CÓ SẴN

### Model ProSubscription:
```
- userId: người đăng ký
- plan: "1m" | "3m" | "12m"
- amount: số tiền (49K, 129K, 449K)
- status: "pending" | "paid" | "failed" | "cancelled"
- startsAt: ngày bắt đầu
- expiresAt: ngày hết hạn
- vnpTxnRef: mã GD VNPay
- createdAt: ngày tạo
```

---

## 🔄 FLOW HOÀN CHỈNH

```
[User] Mua gói Pro → VNPay
    ↓
[VNPay] Thanh toán → Callback
    ↓
[Backend] Cập nhật status = "paid"
    ↓
[ProSubscription] Lưu vào DB
    ↓
[Admin] Vào trang Báo cáo
    ↓
[API] Query ProSubscription (status="paid")
    ↓
[Frontend] Hiển thị:
    - 💰 Tổng doanh thu
    - 🧾 Số giao dịch
    - 📊 Doanh thu theo gói
    - 📅 Doanh thu theo tháng
    - 📋 Danh sách hóa đơn
```


---

## 📋 NHỮNG GÌ CẦN LÀM

### 🔧 BACKEND (1 file mới)

**File:** `backend/src/controllers/admin_subscription.controller.js`

**2 Functions:**

1. **`getRevenueStats()`** - Thống kê tổng quan
   - Input: query params (startDate, endDate - optional)
   - Output:
     ```json
     {
       "totalRevenue": 49500000,
       "totalTransactions": 156,
       "revenueByPlan": [
         {"_id": "12m", "count": 89, "revenue": 39961000}
       ],
       "monthlyRevenue": [
         {"_id": {"year": 2026, "month": 7}, "count": 28, "revenue": 9200000}
       ]
     }
     ```
   - Logic:
     - SUM(amount) WHERE status='paid'
     - COUNT(*) WHERE status='paid'
     - GROUP BY plan
     - GROUP BY MONTH(startsAt)

2. **`getTransactions()`** - Danh sách hóa đơn
   - Input: page, limit, status, plan (optional)
   - Output:
     ```json
     {
       "transactions": [...],
       "pagination": {
         "page": 1,
         "limit": 20,
         "total": 156,
         "pages": 8
       }
     }
     ```
   - Logic:
     - Find ProSubscription
     - Populate userId (fullName, email)
     - Filter theo status, plan
     - Sort createdAt DESC
     - Phân trang

**Thêm routes vào:** `backend/src/routes/admin.routes.js`
```
GET /admin/revenue/stats
GET /admin/revenue/transactions
```


---

### 🎨 FRONTEND (1 page mới)

**File:** `frontend/src/pages/admin/RevenueReport.jsx`

**Giao diện 4 phần:**

#### 📊 Phần 1: Stats Cards (3 cards ngang)
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 💰 Tổng DT  │ │ 🧾 Số GD    │ │ 📈 Gói Hot   │
│ 49.5tr đ    │ │ 156 GD      │ │ 12 tháng    │
│ Từ gói Pro  │ │ Thành công  │ │ 89 lượt     │
└─────────────┘ └─────────────┘ └─────────────┘
```

#### 📈 Phần 2: Doanh Thu Theo Gói
```
┌──────────────────────────────────────┐
│ 📊 Doanh Thu Theo Gói                │
├──────────────────────────────────────┤
│ 12 tháng   │ 89 GD  │ 39.9tr đ     │
│ 3 tháng    │ 45 GD  │ 5.8tr đ      │
│ 1 tháng    │ 22 GD  │ 1.1tr đ      │
└──────────────────────────────────────┘
```

#### 📅 Phần 3: Doanh Thu Theo Tháng (Optional)
```
┌──────────────────────────────────────┐
│ 📅 Xu Hướng 6 Tháng                  │
├──────────────────────────────────────┤
│  [Biểu đồ cột hoặc line chart]      │
│  Tháng 1: 8.5tr, Tháng 2: 9.2tr...  │
└──────────────────────────────────────┘
```

#### 🧾 Phần 4: Danh Sách Hóa Đơn
```
┌─────────────────────────────────────────────┐
│ 🧾 Danh Sách Giao Dịch                     │
│ [Filter Status ▼] [Filter Gói ▼]         │
├─────────────────────────────────────────────┤
│ Mã GD  │ User   │ Gói │ Tiền │ Status│ Ngày│
│────────┼────────┼─────┼──────┼───────┼─────│
│ ...890 │ NguyễnA│ 12m │449K  │✓Paid  │7/18 │
│ ...123 │ TrầnB  │ 3m  │129K  │⏳Pend │7/17 │
├─────────────────────────────────────────────┤
│ [◀ Trước] Trang 1/8 [Sau ▶]               │
└─────────────────────────────────────────────┘
```

**Features:**
- Filter theo status (paid/pending/failed)
- Filter theo plan (1m/3m/12m)
- Phân trang (20 item/trang)
- Badge màu cho status
- Responsive design

**Thêm service:** `frontend/src/services/admin.service.js`
```javascript
getRevenueStats(params)
getTransactions(params)
```

**Thêm route:** `frontend/src/App.jsx`
```
Path: /admin/revenue
```

**Thêm menu:** Sidebar Admin
```
Icon: DollarSign
Label: "Báo cáo Doanh Thu"
```


---

## 🔍 CHI TIẾT DATA FLOW

### Flow 1: Load Stats (Trang vừa mở)
```
Frontend: useEffect() → fetchData()
    ↓
API Call: GET /admin/revenue/stats
    ↓
Backend: Query ProSubscription
    - Aggregate: SUM amount WHERE status='paid'
    - Aggregate: COUNT WHERE status='paid'
    - Aggregate: GROUP BY plan
    - Aggregate: GROUP BY month (6 tháng)
    ↓
Response: { totalRevenue, totalTransactions, revenueByPlan, monthlyRevenue }
    ↓
Frontend: Hiển thị Stats Cards + Revenue by Plan
```

### Flow 2: Load Transactions (Trang vừa mở)
```
Frontend: useEffect() → fetchData()
    ↓
API Call: GET /admin/revenue/transactions?page=1&limit=20
    ↓
Backend: Query ProSubscription
    - Find + Populate userId
    - Sort createdAt DESC
    - Skip/Limit (pagination)
    ↓
Response: { transactions: [...], pagination: {...} }
    ↓
Frontend: Hiển thị Table + Pagination
```

### Flow 3: Filter Status (User chọn dropdown)
```
User: Chọn "Thành công" trong dropdown
    ↓
Frontend: setFilters({ status: 'paid', page: 1 })
    ↓
useEffect trigger → fetchData()
    ↓
API Call: GET /admin/revenue/transactions?status=paid&page=1
    ↓
Backend: Query WHERE status='paid'
    ↓
Response: Transactions filtered
    ↓
Frontend: Update table
```

### Flow 4: Pagination (User bấm "Sau")
```
User: Click button "Sau"
    ↓
Frontend: setFilters({ page: page + 1 })
    ↓
useEffect trigger → fetchData()
    ↓
API Call: GET /admin/revenue/transactions?page=2
    ↓
Backend: Skip = (2-1) * 20 = 20
    ↓
Response: Transactions trang 2
    ↓
Frontend: Update table + pagination info
```

