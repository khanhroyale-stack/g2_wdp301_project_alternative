 📋 USE CASES - Hệ Thống Mua Bán Cho Thuê Đồ Khu Vực Hòa Lạc

## 📊 Tổng Quan

Dựa trên file TASK.md, hệ thống có **18 Use Cases chính** được chia cho 5 người phát triển.

---

## 👥 NGƯỜI 1: LONG - Account, Role, Verification, Reputation

### Use Case 1: Quản Lý Tài Khoản (Account Management)

**Actor:** User, Admin

**Mô tả:** Đăng ký, đăng nhập, quản lý thông tin cá nhân

**Chức năng chính:**
- UC1.1: Đăng ký tài khoản (email, mật khẩu, họ tên, SĐT)
- UC1.2: Đăng nhập hệ thống
- UC1.3: Đăng xuất
- UC1.4: Quên mật khẩu (gửi OTP)
- UC1.5: Đặt lại mật khẩu (nhập OTP + mật khẩu mới)
- UC1.6: Đổi mật khẩu (sau khi đăng nhập)
- UC1.7: Xem thông tin cá nhân
- UC1.8: Cập nhật thông tin cá nhân (tên, SĐT, địa chỉ, avatar)
- UC1.9: Xem hồ sơ công khai người dùng khác
- UC1.10: Kiểm tra trạng thái tài khoản (ACTIVE/BANNED)

**Số lượng chức năng:** 10

---

### Use Case 2: Quản Lý Phân Quyền (Role Management)

**Actor:** Admin

**Mô tả:** Quản lý vai trò và phân quyền trong hệ thống

**Chức năng chính:**
- UC2.1: Tạo vai trò (Admin, User, Shipper)
- UC2.2: Gán vai trò cho tài khoản
- UC2.3: Kiểm tra quyền truy cập
- UC2.4: Phân quyền Admin (quản lý user, bài đăng, báo cáo, thống kê)
- UC2.5: Phân quyền User (đăng bán, thuê, mua, chat, đánh giá, báo cáo)
- UC2.6: Phân quyền Shipper (nhận đơn, kiểm tra, giao hàng, báo cáo)
- UC2.7: Middleware kiểm tra role

**Số lượng chức năng:** 7

---

### Use Case 3: Xác Minh Email (Email Verification)

**Actor:** User

**Mô tả:** Xác thực tài khoản bằng OTP email (KHÔNG có KYC, KHÔNG duyệt tài khoản)

**Chức năng chính:**
- UC3.1: Gửi OTP email khi đăng ký (mã 6 số)
- UC3.2: Xác thực OTP (kích hoạt tài khoản)
- UC3.3: Gửi lại OTP (cooldown 60s)
- UC3.4: OTP hết hạn (có thời hạn, giới hạn số lần nhập sai)

**Số lượng chức năng:** 4

---

### Use Case 4: Quản Lý Điểm Uy Tín (Reputation Management)

**Actor:** User, Admin

**Mô tả:** Quản lý điểm uy tín người dùng, xử lý vi phạm

**Chức năng chính:**
- UC4.1: Khởi tạo điểm uy tín (100 điểm)
- UC4.2: Hiển thị điểm uy tín công khai
- UC4.3: Trừ điểm vi phạm nhẹ (warning: -10 điểm)
- UC4.4: Trừ điểm vi phạm trung bình (minor: -20 điểm)
- UC4.5: Trừ điểm vi phạm nghiêm trọng (major: -50 điểm)
- UC4.6: Lưu lịch sử trừ điểm (lý do, thời gian, admin xử lý)
- UC4.7: Tự động khóa tài khoản (điểm = 0 → BANNED)
- UC4.8: Chặn tài khoản bị khóa (không đăng bài, mua, thuê)
- UC4.9: Admin xem lịch sử uy tín từng user
- UC4.10: Admin trừ điểm thủ công (chọn mức vi phạm + lý do)

**Số lượng chức năng:** 10

**TỔNG NGƯỜI 1:** 4 Use Cases | 31 chức năng

---

## 📦 NGƯỜI 2: SƠN - Product, Category, Post Approval

### Use Case 5: Quản Lý Danh Mục (Category Management)

**Actor:** Admin

**Mô tả:** Quản lý danh mục sản phẩm

**Chức năng chính:**
- UC5.1: Thêm danh mục (điện tử, xe đạp, sách, đồ gia dụng)
- UC5.2: Sửa danh mục (tên/mô tả)
- UC5.3: Xóa/ẩn danh mục
- UC5.4: Xem danh sách danh mục
- UC5.5: Lọc sản phẩm theo danh mục

**Số lượng chức năng:** 5

---

### Use Case 6: Quản Lý Sản Phẩm (Product Management)

**Actor:** User (Seller/Owner), Admin

**Mô tả:** Đăng bán, đăng thuê sản phẩm

**Chức năng chính:**
- UC6.1: Đăng bán sản phẩm
- UC6.2: Đăng cho thuê sản phẩm
- UC6.3: Nhập tên sản phẩm (bắt buộc)
- UC6.4: Chọn danh mục
- UC6.5: Nhập giá bán
- UC6.6: Nhập giá thuê (ngày/tuần/tháng)
- UC6.7: Nhập tiền cọc (cho thuê)
- UC6.8: Nhập mô tả sản phẩm
- UC6.9: Nhập tình trạng (mới, cũ, trầy xước, lỗi nhỏ)
- UC6.10: Nhập vị trí (khu vực Hòa Lạc)
- UC6.11: Upload ảnh thực tế (bắt buộc)
- UC6.12: Upload video thực tế (option)
- UC6.13: Upload hóa đơn (tăng tin cậy)
- UC6.14: Upload phiếu bảo hành
- UC6.15: Sửa bài đăng (khi chưa bán/thuê)
- UC6.16: Xóa/ẩn bài đăng
- UC6.17: Xem chi tiết sản phẩm
- UC6.18: Xem thông tin người bán
- UC6.19: Hiển thị sản phẩm ACTIVE
- UC6.20: Ẩn sản phẩm SOLD/RENTING

**Số lượng chức năng:** 20

---

### Use Case 7: Tìm Kiếm & Lọc Sản Phẩm (Product Search & Filter)

**Actor:** User (Buyer/Renter)

**Mô tả:** Tìm kiếm và lọc sản phẩm theo nhiều tiêu chí

**Chức năng chính:**
- UC7.1: Tìm kiếm theo tên sản phẩm
- UC7.2: Lọc theo danh mục
- UC7.3: Lọc theo giá (khoảng giá)
- UC7.4: Lọc theo tình trạng (mới/cũ/tốt/lỗi nhẹ)
- UC7.5: Lọc theo loại (bán/thuê)
- UC7.6: Sắp xếp theo giá tăng dần
- UC7.7: Sắp xếp theo giá giảm dần
- UC7.8: Sắp xếp theo mới nhất
- UC7.9: Ẩn sản phẩm đã bán
- UC7.10: Ẩn sản phẩm đang thuê

**Số lượng chức năng:** 10

---

### Use Case 8: Duyệt Bài Đăng (Post Approval)

**Actor:** Admin, User

**Mô tả:** Admin duyệt bài đăng sản phẩm

**Chức năng chính:**
- UC8.1: Bài đăng mặc định PENDING
- UC8.2: Admin xem danh sách bài chờ duyệt
- UC8.3: Admin xem chi tiết bài đăng
- UC8.4: Admin duyệt bài (PENDING → ACTIVE)
- UC8.5: Admin từ chối bài (PENDING → REJECTED)
- UC8.6: Nhập lý do từ chối
- UC8.7: User xem trạng thái bài đăng
- UC8.8: Admin ẩn bài vi phạm (HIDDEN/BLOCKED)
- UC8.9: Lưu lịch sử duyệt bài

**Số lượng chức năng:** 9

**TỔNG NGƯỜI 2:** 4 Use Cases | 44 chức năng

---

## 🚚 NGƯỜI 3: DUY ANH - Order, Delivery, Shipper

### Use Case 9: Quản Lý Đơn Hàng (Order Management)

**Actor:** User (Buyer, Seller)

**Mô tả:** Tạo và quản lý đơn mua hàng

**Chức năng chính:**
- UC9.1: Người mua tạo đơn hàng
- UC9.2: Kiểm tra sản phẩm còn bán (AVAILABLE)
- UC9.3: Lưu thông tin buyer, seller, product
- UC9.4: Tính tổng tiền đơn hàng (giá + phí ship)
- UC9.5: Đơn hàng trạng thái PENDING
- UC9.6: Người bán xác nhận đơn (SELLER_CONFIRMED)
- UC9.7: Người bán từ chối đơn (CANCELLED)
- UC9.8: Hủy đơn hàng (khi chưa giao)
- UC9.9: Xem danh sách đơn mua
- UC9.10: Xem danh sách đơn bán
- UC9.11: Xem chi tiết đơn hàng
- UC9.12: Hoàn tất đơn hàng (buyer xác nhận)
- UC9.13: Lưu lịch sử trạng thái đơn hàng

**Số lượng chức năng:** 13

---

### Use Case 10: Quản Lý Giao Hàng (Delivery Management)

**Actor:** Shipper, User

**Mô tả:** Quản lý luồng giao hàng

**Chức năng chính:**
- UC10.1: Tạo đơn giao hàng (sau seller xác nhận)
- UC10.2: Đơn giao chờ shipper (WAITING_SHIPPER)
- UC10.3: Shipper xem danh sách đơn cần giao
- UC10.4: Shipper nhận đơn (SHIPPER_ACCEPTED)
- UC10.5: Shipper đến lấy hàng (PICKING_UP)
- UC10.6: Shipper xác nhận đã nhận hàng (PICKED_UP)
- UC10.7: Shipper giao hàng (DELIVERING)
- UC10.8: Người mua xác nhận nhận hàng (DELIVERED)
- UC10.9: Hoàn tất giao hàng (COMPLETED)
- UC10.10: Cập nhật trạng thái giao hàng
- UC10.11: Lưu lịch sử trạng thái
- UC10.12: Xử lý giao hàng thất bại

**Số lượng chức năng:** 12

---

### Use Case 11: Kiểm Tra Sản Phẩm Shipper (Shipper Inspection)

**Actor:** Shipper, Admin

**Mô tả:** Shipper kiểm tra sản phẩm khi lấy hàng

**Chức năng chính:**
- UC11.1: Kiểm tra đúng sản phẩm (so với bài đăng)
- UC11.2: Kiểm tra đúng hình ảnh
- UC11.3: Kiểm tra đúng model/mã sản phẩm
- UC11.4: Kiểm tra đúng tình trạng
- UC11.5: Kiểm tra phụ kiện đi kèm
- UC11.6: Chụp ảnh mặt trước (bằng chứng)
- UC11.7: Chụp ảnh mặt sau
- UC11.8: Chụp ảnh phụ kiện
- UC11.9: Ghi chú kiểm tra
- UC11.10: Tạo biên bản kiểm tra
- UC11.11: Báo lỗi sản phẩm sai mô tả (lỗi seller)
- UC11.12: Báo lỗi shipper làm hỏng (lỗi shipper)
- UC11.13: Admin xem biên bản shipper

**Số lượng chức năng:** 13

---

### Use Case 12: Quản Lý Shipper (Shipper Management)

**Actor:** Shipper, Admin

**Mô tả:** Quản lý hoạt động của shipper

**Chức năng chính:**
- UC12.1: Shipper xem đơn được phép nhận
- UC12.2: Shipper nhận đơn giao hàng
- UC12.3: Shipper xem đơn đang giao
- UC12.4: Shipper cập nhật tiến trình
- UC12.5: Shipper báo cáo vấn đề
- UC12.6: Admin xem danh sách shipper
- UC12.7: Admin khóa/mở tài khoản shipper

**Số lượng chức năng:** 7

**TỔNG NGƯỜI 3:** 4 Use Cases | 45 chức năng

---

## 🏠 NGƯỜI 4: (Chưa gán) - Rental, Contract, Return, Deposit

### Use Case 13: Yêu Cầu Thuê (Rental Request)

**Actor:** User (Renter, Owner)

**Mô tả:** Gửi và xử lý yêu cầu thuê sản phẩm

**Chức năng chính:**
- UC13.1: Người thuê gửi yêu cầu thuê
- UC13.2: Chọn ngày bắt đầu thuê (start_date)
- UC13.3: Chọn ngày kết thúc thuê (end_date)
- UC13.4: Kiểm tra ngày thuê hợp lệ
- UC13.5: Kiểm tra sản phẩm có sẵn (không trùng lịch)
- UC13.6: Tính số ngày thuê
- UC13.7: Tính tiền thuê (theo ngày/tuần/tháng)
- UC13.8: Tính tiền cọc
- UC13.9: Hiển thị tổng tiền (thuê + cọc)
- UC13.10: Người cho thuê xem yêu cầu
- UC13.11: Người cho thuê chấp nhận (ACCEPTED)
- UC13.12: Người cho thuê từ chối (REJECTED)
- UC13.13: Người thuê hủy yêu cầu

**Số lượng chức năng:** 13

---

### Use Case 14: Hợp Đồng Thuê (Rental Contract)

**Actor:** User (Renter, Owner), Admin

**Mô tả:** Quản lý hợp đồng thuê

**Chức năng chính:**
- UC14.1: Tạo hợp đồng thuê (sau khi chấp nhận)
- UC14.2: Lưu renter_id, owner_id, product_id
- UC14.3: Lưu thời gian thuê (start_date, end_date)
- UC14.4: Lưu tiền thuê (rental_fee)
- UC14.5: Lưu tiền cọc (deposit_amount)
- UC14.6: Lưu điều khoản thuê
- UC14.7: Cập nhật trạng thái (ACTIVE, COMPLETED, CANCELLED, DISPUTED)
- UC14.8: Xem chi tiết hợp đồng
- UC14.9: Gia hạn thuê (gửi yêu cầu)
- UC14.10: Chủ đồ chấp nhận gia hạn
- UC14.11: Chủ đồ từ chối gia hạn
- UC14.12: Nhắc sắp hết hạn thuê (notification)

**Số lượng chức năng:** 12

---

### Use Case 15: Kiểm Tra Trước Thuê (Pre-rental Inspection)

**Actor:** Shipper

**Mô tả:** Kiểm tra sản phẩm trước khi giao cho người thuê

**Chức năng chính:**
- UC15.1: Tạo biên bản trước thuê
- UC15.2: Kiểm tra tình trạng sản phẩm
- UC15.3: Kiểm tra phụ kiện
- UC15.4: Chụp ảnh mặt trước
- UC15.5: Chụp ảnh mặt sau
- UC15.6: Chụp ảnh phụ kiện
- UC15.7: Ghi chú tình trạng ban đầu (vết xước, lỗi nhỏ)
- UC15.8: Lưu biên bản trước thuê

**Số lượng chức năng:** 8

---

### Use Case 16: Trả Sản Phẩm Thuê (Return)

**Actor:** User (Renter), Shipper

**Mô tả:** Xử lý trả sản phẩm sau khi thuê

**Chức năng chính:**
- UC16.1: Người thuê gửi yêu cầu trả đồ
- UC16.2: Tạo đơn nhận lại đồ thuê
- UC16.3: Shipper nhận đơn trả đồ
- UC16.4: Shipper kiểm tra sau thuê
- UC16.5: Chụp ảnh sau thuê (trước, sau, phụ kiện)
- UC16.6: Lập biên bản sau thuê
- UC16.7: So sánh trước thuê và sau thuê
- UC16.8: Cập nhật trạng thái trả đồ (RETURN_REQUESTED, CHECKED, RETURNED)
- UC16.9: Hoàn tất hợp đồng thuê

**Số lượng chức năng:** 9

---

### Use Case 17: Tiền Cọc & Bồi Thường (Deposit & Compensation)

**Actor:** User (Renter, Owner), Admin

**Mô tả:** Xử lý tiền cọc và bồi thường

**Chức năng chính:**
- UC17.1: Ghi nhận tiền cọc (deposit_amount)
- UC17.2: Hoàn cọc 100% (sản phẩm bình thường)
- UC17.3: Tính mức bồi thường (sản phẩm hư hỏng)
- UC17.4: Trừ tiền bồi thường từ cọc (compensation_amount)
- UC17.5: Hoàn phần cọc còn lại (deposit - compensation)
- UC17.6: Ghi lý do trừ cọc
- UC17.7: Upload bằng chứng hư hỏng (ảnh/video)
- UC17.8: Chuyển hợp đồng sang DISPUTED (tranh chấp)
- UC17.9: Admin xử lý tranh chấp cọc

**Số lượng chức năng:** 9

**TỔNG NGƯỜI 4:** 5 Use Cases | 51 chức năng

---

## 🎨 NGƯỜI 5: KHÁNH - UI, Chat, Review, Report, Notification, Dashboard

### Use Case 18: Giao Diện Chung (Common UI)

**Actor:** Tất cả users

**Mô tả:** Thiết kế giao diện chung của hệ thống

**Chức năng chính:**
- UC18.1: Thiết kế layout chính (header, sidebar, footer)
- UC18.2: Navbar theo role (Admin/User/Shipper)
- UC18.3: Trang chủ (sản phẩm nổi bật/mới nhất)
- UC18.4: Trang danh sách sản phẩm (grid/list)
- UC18.5: Trang chi tiết sản phẩm
- UC18.6: Trang profile cá nhân
- UC18.7: Trang quản lý Admin
- UC18.8: Trang dành cho Shipper
- UC18.9: Responsive (laptop/mobile)
- UC18.10: Xử lý loading/error UI

**Số lượng chức năng:** 10

---

### Use Case 19: Chat

**Actor:** User (Buyer, Seller, Renter, Owner)

**Mô tả:** Hệ thống chat giữa người mua/thuê và người bán/cho thuê

**Chức năng chính:**
- UC19.1: Tạo phòng chat (buyer ↔ seller, renter ↔ owner)
- UC19.2: Gửi tin nhắn
- UC19.3: Nhận tin nhắn
- UC19.4: Lưu lịch sử tin nhắn
- UC19.5: Xem danh sách cuộc trò chuyện
- UC19.6: Xem chi tiết cuộc trò chuyện
- UC19.7: Gửi ảnh trong chat (option)
- UC19.8: Đánh dấu tin nhắn đã đọc (option)
- UC19.9: Admin xem chat (khi xử lý báo cáo)

**Số lượng chức năng:** 9

---

### Use Case 20: Đánh Giá (Review)

**Actor:** User (Buyer, Seller, Renter, Owner)

**Mô tả:** Đánh giá sau giao dịch

**Chức năng chính:**
- UC20.1: Đánh giá sau giao dịch mua (order COMPLETED)
- UC20.2: Đánh giá sau thuê (rental COMPLETED)
- UC20.3: Đánh giá sản phẩm (1-5 sao + comment)
- UC20.4: Đánh giá người bán/người cho thuê (1-5 sao)
- UC20.5: Lưu nội dung đánh giá (rating, comment, created_at)
- UC20.6: Hiển thị đánh giá ở chi tiết sản phẩm
- UC20.7: Hiển thị đánh giá trong store detail
- UC20.8: Tính điểm trung bình shop
- UC20.9: Chặn review trùng (1 giao dịch/1 review)
- UC20.10: Ẩn review vi phạm (Admin)

**Số lượng chức năng:** 10

---

### Use Case 21: Báo Cáo Vi Phạm (Report)

**Actor:** User, Admin

**Mô tả:** Báo cáo vi phạm và xử lý

**Chức năng chính:**
- UC21.1: User gửi báo cáo vi phạm
- UC21.2: Chọn loại vi phạm (sai mô tả, thiếu phụ kiện, lừa đảo, hư hỏng)
- UC21.3: Nhập nội dung báo cáo
- UC21.4: Upload ảnh bằng chứng
- UC21.5: Upload video bằng chứng (option)
- UC21.6: Gắn báo cáo với đơn hàng
- UC21.7: Gắn báo cáo với hợp đồng thuê
- UC21.8: Gắn báo cáo với bài đăng
- UC21.9: Admin xem danh sách báo cáo (PENDING, PROCESSING, RESOLVED, REJECTED)
- UC21.10: Admin xem chi tiết báo cáo
- UC21.11: Admin xử lý báo cáo (chấp nhận/từ chối)
- UC21.12: Admin nhập kết quả xử lý
- UC21.13: Tạo vi phạm cho user (nếu báo cáo đúng)
- UC21.14: Kết nối với điểm uy tín (trừ điểm)
- UC21.15: Lưu lịch sử xử lý báo cáo

**Số lượng chức năng:** 15

---

### Use Case 22: Thông Báo (Notification)

**Actor:** User, Admin, Shipper

**Mô tả:** Hệ thống thông báo

**Chức năng chính:**
- UC22.1: Thông báo bài đăng được duyệt
- UC22.2: Thông báo bài đăng bị từ chối (kèm lý do)
- UC22.3: Thông báo có người đặt mua (→ seller)
- UC22.4: Thông báo seller xác nhận đơn (→ buyer)
- UC22.5: Thông báo có yêu cầu thuê (→ owner)
- UC22.6: Thông báo yêu cầu thuê được chấp nhận (→ renter)
- UC22.7: Thông báo yêu cầu thuê bị từ chối (→ renter)
- UC22.8: Thông báo có đơn giao hàng (→ shipper)
- UC22.9: Thông báo giao hàng thành công (→ buyer/seller)
- UC22.10: Thông báo sắp hết hạn thuê (→ renter)
- UC22.11: Thông báo có đánh giá mới (→ seller/owner)
- UC22.12: Thông báo có báo cáo vi phạm (→ Admin)
- UC22.13: Thông báo kết quả xử lý báo cáo (→ người liên quan)
- UC22.14: Xem danh sách thông báo
- UC22.15: Đánh dấu đã đọc (read/unread)

**Số lượng chức năng:** 15

---

### Use Case 23: Dashboard Admin (Thống Kê Quản Trị)

**Actor:** Admin

**Mô tả:** Trang thống kê tổng quan hệ thống

**Chức năng chính:**
- UC23.1: Thống kê tổng số user
- UC23.2: Thống kê user chờ duyệt (PENDING)
- UC23.3: Thống kê bài đăng (tổng, chờ duyệt, active)
- UC23.4: Thống kê sản phẩm bán
- UC23.5: Thống kê sản phẩm cho thuê
- UC23.6: Thống kê đơn mua hàng (tổng, hoàn tất, hủy)
- UC23.7: Thống kê hợp đồng thuê (đang thuê, hoàn tất, tranh chấp)
- UC23.8: Thống kê báo cáo vi phạm (pending, resolved, rejected)
- UC23.9: Thống kê user bị khóa
- UC23.10: Thống kê shipper (số đơn đã giao, đơn đang giao)
- UC23.11: Biểu đồ giao dịch theo thời gian (option)
- UC23.12: Biểu đồ vi phạm (option)
- UC23.13: Xuất báo cáo thống kê (option)

**Số lượng chức năng:** 13

**TỔNG NGƯỜI 5:** 6 Use Cases | 72 chức năng

---

## 📊 TỔNG KẾT THỐNG KÊ

### Bảng Tổng Hợp Theo Người

| Người | Module | Số Use Cases | Tổng Chức Năng | Ghi Chú |
|-------|---------|--------------|----------------|---------|
| **Người 1: Long** | Account, Role, Verification, Reputation | 4 | 31 | KHÔNG có KYC, KHÔNG duyệt tài khoản, chỉ xác thực OTP email |
| **Người 2: Sơn** | Product, Category, Post Approval | 4 | 44 | Admin duyệt BÀI ĐĂNG (không duyệt tài khoản) |
| **Người 3: Duy Anh** | Order, Delivery, Shipper | 4 | 45 | Shipper kiểm tra hàng trước khi giao |
| **Người 4: (Chưa gán)** | Rental, Contract, Return, Deposit | 5 | 51 | Xử lý cọc, bồi thường, tranh chấp |
| **Người 5: Khánh** | UI, Chat, Review, Report, Notification, Dashboard | 6 | 72 | UI chung + 5 module nghiệp vụ |
| **TỔNG CỘNG** | | **23 Use Cases** | **243 Chức năng** | |

---

### Phân Tích Chi Tiết

#### 🏆 Chức năng nhiều nhất
1. **Người 5 (Khánh):** 72 chức năng - phụ trách UI và 5 module quan trọng
2. **Người 4:** 51 chức năng - xử lý toàn bộ nghiệp vụ cho thuê
3. **Người 3 (Duy Anh):** 45 chức năng - mua bán và giao nhận
4. **Người 2 (Sơn):** 44 chức năng - sản phẩm và duyệt bài
5. **Người 1 (Long):** 31 chức năng - tài khoản và uy tín

#### 📋 Danh Sách 23 Use Cases

**Người 1 (Long):**
1. UC1: Quản Lý Tài Khoản (10 chức năng)
2. UC2: Quản Lý Phân Quyền (7 chức năng)
3. UC3: Xác Minh Email (4 chức năng)
4. UC4: Quản Lý Điểm Uy Tín (10 chức năng)

**Người 2 (Sơn):**
5. UC5: Quản Lý Danh Mục (5 chức năng)
6. UC6: Quản Lý Sản Phẩm (20 chức năng)
7. UC7: Tìm Kiếm & Lọc Sản Phẩm (10 chức năng)
8. UC8: Duyệt Bài Đăng (9 chức năng)

**Người 3 (Duy Anh):**
9. UC9: Quản Lý Đơn Hàng (13 chức năng)
10. UC10: Quản Lý Giao Hàng (12 chức năng)
11. UC11: Kiểm Tra Sản Phẩm Shipper (13 chức năng)
12. UC12: Quản Lý Shipper (7 chức năng)

**Người 4:**
13. UC13: Yêu Cầu Thuê (13 chức năng)
14. UC14: Hợp Đồng Thuê (12 chức năng)
15. UC15: Kiểm Tra Trước Thuê (8 chức năng)
16. UC16: Trả Sản Phẩm Thuê (9 chức năng)
17. UC17: Tiền Cọc & Bồi Thường (9 chức năng)

**Người 5 (Khánh):**
18. UC18: Giao Diện Chung (10 chức năng)
19. UC19: Chat (9 chức năng)
20. UC20: Đánh Giá (10 chức năng)
21. UC21: Báo Cáo Vi Phạm (15 chức năng)
22. UC22: Thông Báo (15 chức năng)
23. UC23: Dashboard Admin (13 chức năng)

---

## 🎯 PHÂN LOẠI ƯU TIÊN MVP

### Chức năng bắt buộc phải có (MUST HAVE)

| Người | Chức năng MVP Bắt Buộc |
|-------|------------------------|
| **Người 1** | Đăng ký, Đăng nhập, Phân quyền, OTP email, Điểm uy tín cơ bản |
| **Người 2** | CRUD danh mục, Đăng bán/thuê, Upload ảnh, Duyệt bài, Tìm kiếm/lọc sản phẩm |
| **Người 3** | Đặt mua, Seller xác nhận, Shipper nhận đơn, Kiểm tra hàng, Giao hàng, Hoàn tất đơn |
| **Người 4** | Gửi yêu cầu thuê, Tính tiền thuê/cọc, Tạo hợp đồng, Kiểm tra trước thuê, Trả đồ, Hoàn cọc |
| **Người 5** | UI chính, Chat cơ bản, Đánh giá, Báo cáo vi phạm, Thông báo cơ bản, Dashboard thống kê |

### Chức năng nâng cao (NICE TO HAVE)
- Upload video sản phẩm
- Biểu đồ thống kê chi tiết
- Gửi ảnh trong chat
- Đánh dấu tin nhắn đã đọc
- Gia hạn hợp đồng thuê tự động
- Xuất báo cáo Excel/PDF

---

## 🔗 MỐI QUAN HỆ GIỮA CÁC USE CASE

### Luồng Mua Bán
```
UC1 (Account) → UC8 (Duyệt Bài) → UC7 (Tìm Kiếm) → UC9 (Order) 
→ UC10 (Delivery) → UC11 (Inspection) → UC20 (Review)
```

### Luồng Cho Thuê
```
UC1 (Account) → UC8 (Duyệt Bài) → UC13 (Rental Request) → UC14 (Contract) 
→ UC15 (Pre-inspection) → UC16 (Return) → UC17 (Deposit) → UC20 (Review)
```

### Luồng Xử Lý Vi Phạm
```
UC21 (Report) → UC4 (Reputation) → UC1 (Ban Account nếu điểm = 0)
```

### Luồng Thông Báo
```
Mọi Use Case → UC22 (Notification) → User/Admin/Shipper nhận thông báo
```

---

## 📝 GHI CHÚ QUAN TRỌNG

1. **KHÔNG có duyệt tài khoản:** User đăng ký → xác thực OTP email → dùng ngay
2. **KHÔNG có KYC:** Không upload CCCD/thẻ sinh viên
3. **CÓ duyệt bài đăng:** Admin phải duyệt mọi bài đăng sản phẩm (PENDING → ACTIVE)
4. **Shipper kiểm tra hàng:** Bắt buộc có biên bản kiểm tra trước khi giao
5. **Điểm uy tín:** Khởi tạo 100 điểm, trừ dần khi vi phạm, = 0 thì bị khóa tài khoản
6. **Tiền cọc:** Hoàn 100% nếu bình thường, trừ nếu hư hỏng
7. **Khu vực:** Hệ thống hoạt động trong khu vực Hòa Lạc

---

## 📅 ĐỀ XUẤT LỊCH PHÁT TRIỂN

### Sprint 1 (Tuần 1-2): Foundation
- Người 1: Account, Role, OTP
- Người 2: Category, Product (không duyệt bài)
- Người 5: UI layout chính

### Sprint 2 (Tuần 3-4): Core Features
- Người 2: Post Approval, Search/Filter
- Người 3: Order, Delivery cơ bản
- Người 4: Rental Request, Contract
- Người 5: Chat, Notification

### Sprint 3 (Tuần 5-6): Advanced Features
- Người 1: Reputation Management
- Người 3: Shipper Inspection
- Người 4: Pre/Post Inspection, Deposit
- Người 5: Review, Report

### Sprint 4 (Tuần 7-8): Admin & Polish
- Người 1: Admin quản lý uy tín
- Người 5: Dashboard Admin, hoàn thiện UI
- Tất cả: Testing, bug fixing

---

**Tài liệu được tạo từ:** `TASK.md`  
**Ngày tạo:** July 14, 2026  
**Phiên bản:** 1.0  
**Trạng thái:** ✅ Hoàn thành
