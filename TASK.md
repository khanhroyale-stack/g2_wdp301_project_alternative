Dưới đây là bản liệt kê đầy đủ chức năng theo 5 người, bám đúng nghiệp vụ hệ thống mua – bán – cho thuê đồ khu vực Hòa Lạc.

Người 1: Account, Role, Verification, Reputation
(Long)
Phụ trách toàn bộ phần tài khoản, phân quyền, xác minh người dùng, điểm uy tín.
1. Account — Tài khoản người dùng
STT
Chức năng
Mô tả
1
Đăng ký tài khoản
User nhập email, mật khẩu, họ tên, số điện thoại
2
Đăng nhập
User/Admin/Shipper đăng nhập hệ thống
3
Đăng xuất
Thoát khỏi hệ thống
4
Quên mật khẩu
Gửi OTP/email để đặt lại mật khẩu
5
Đổi mật khẩu
Người dùng đổi mật khẩu sau khi đăng nhập
6
Xem thông tin cá nhân
Hiển thị họ tên, email, số điện thoại, trạng thái tài khoản
7
Cập nhật thông tin cá nhân
Sửa họ tên, số điện thoại, ảnh đại diện
8
Kiểm tra trạng thái tài khoản
PENDING, APPROVED, REJECTED, BANNED


2. Role — Phân quyền
STT
Chức năng
Mô tả
1
Tạo vai trò
Admin, User, Shipper
2
Gán vai trò cho tài khoản
Một tài khoản có role cụ thể
3
Kiểm tra quyền truy cập
Không cho user thường vào trang Admin/Shipper
4
Phân quyền Admin
Quản lý user, bài đăng, báo cáo, thống kê
5
Phân quyền User
Đăng bán, thuê, mua, chat, đánh giá, báo cáo
6
Phân quyền Shipper
Nhận đơn, kiểm tra hàng, giao hàng, báo cáo lỗi
7
Middleware kiểm tra role
Backend kiểm tra quyền trước khi cho gọi API


3. Verification — Xác minh tài khoản
STT
Chức năng
Mô tả
1
Gửi OTP email
Hệ thống gửi mã OTP khi đăng ký
2
Xác thực OTP
User nhập OTP để xác thực email
3
Upload CCCD/thẻ sinh viên
User tải ảnh giấy tờ lên hệ thống
4
Lưu giấy tờ xác minh
Lưu ảnh CCCD hoặc thẻ sinh viên
5
Admin xem danh sách tài khoản chờ duyệt
Hiển thị user trạng thái PENDING
6
Admin xem chi tiết giấy tờ
Kiểm tra thông tin user
7
Admin duyệt tài khoản
Chuyển trạng thái sang APPROVED
8
Admin từ chối tài khoản
Chuyển trạng thái sang REJECTED kèm lý do
9
Chỉ cho tài khoản APPROVED giao dịch
User chưa duyệt không được đăng bài/mua/thuê


4. Reputation — Điểm uy tín
STT
Chức năng
Mô tả
1
Khởi tạo điểm uy tín
Mỗi user bắt đầu với 100 điểm
2
Hiển thị điểm uy tín công khai
Hiện ở trang thông tin người bán/người cho thuê
3
Trừ điểm vi phạm nhẹ
Trừ 10 điểm
4
Trừ điểm vi phạm trung bình
Trừ 20 điểm
5
Trừ điểm vi phạm nghiêm trọng
Trừ 50 điểm
6
Lưu lịch sử trừ điểm
Ghi lại lý do, thời gian, admin xử lý
7
Tự động khóa tài khoản khi điểm = 0
Chuyển trạng thái tài khoản sang BANNED
8
Chặn tài khoản bị khóa
Không cho đăng bài, mua, thuê, nhận giao dịch
9
Admin xem lịch sử uy tín
Xem user đã bị trừ điểm vì lỗi gì


Người 2: Product, Category, Post Approval 
(Sơn)
Phụ trách toàn bộ phần sản phẩm, danh mục, bài đăng bán/cho thuê, duyệt bài.

1. Category — Danh mục sản phẩm
STT
Chức năng
Mô tả
1
Thêm danh mục
Ví dụ: đồ điện tử, xe đạp, sách, đồ gia dụng
2
Sửa danh mục
Cập nhật tên/mô tả danh mục
3
Xóa/ẩn danh mục
Không cho chọn danh mục không còn dùng
4
Xem danh sách danh mục
Hiển thị cho user khi đăng bài
5
Lọc sản phẩm theo danh mục
Người mua/người thuê lọc sản phẩm


2. Product — Sản phẩm
STT
Chức năng
Mô tả
1
Đăng bán sản phẩm
User tạo bài bán đồ cũ
2
Đăng cho thuê sản phẩm
User tạo bài cho thuê đồ
3
Nhập tên sản phẩm
Tên sản phẩm bắt buộc
4
Chọn danh mục
Gắn sản phẩm với category
5
Nhập giá bán
Dùng cho sản phẩm bán
6
Nhập giá thuê theo ngày
Dùng cho sản phẩm cho thuê
7
Nhập giá thuê theo tuần/tháng
Nếu có
8
Nhập tiền cọc
Dùng cho sản phẩm thuê
9
Nhập mô tả sản phẩm
Mô tả chi tiết sản phẩm
10
Nhập tình trạng sản phẩm
Mới, đã dùng, trầy xước nhẹ, lỗi nhỏ…
11
Nhập vị trí sản phẩm
Khu vực Hòa Lạc
12
Upload ảnh thực tế
Ảnh bắt buộc
13
Upload video thực tế
Không bắt buộc
14
Upload hóa đơn
Tăng độ tin cậy
15
Upload phiếu bảo hành
Tăng độ tin cậy
16
Sửa bài đăng
Chỉ sửa khi bài chưa bán/chưa thuê
17
Xóa/ẩn bài đăng
User hoặc Admin có thể ẩn
18
Xem chi tiết sản phẩm
Hiển thị tên, giá, ảnh, mô tả, tình trạng
19
Xem thông tin người bán
Hiển thị điểm uy tín, số giao dịch, đánh giá
20
Hiển thị sản phẩm đã ACTIVE
Chỉ bài được duyệt mới hiển thị công khai


3. Product Search & Filter — Tìm kiếm và lọc
STT
Chức năng
Mô tả
1
Tìm kiếm theo tên sản phẩm
Nhập từ khóa để tìm
2
Lọc theo danh mục
Ví dụ: laptop, xe đạp, máy ảnh
3
Lọc theo giá
Khoảng giá thấp đến cao
4
Lọc theo tình trạng
Mới, cũ, còn tốt, lỗi nhẹ
5
Lọc theo loại bài
Bán hoặc cho thuê
6
Sắp xếp theo giá tăng dần
Rẻ đến đắt
7
Sắp xếp theo giá giảm dần
Đắt đến rẻ
8
Sắp xếp theo mới nhất
Bài mới đăng
9
Ẩn sản phẩm đã bán
Không cho đặt mua sản phẩm đã SOLD
10
Ẩn sản phẩm đang được thuê
Không cho thuê trùng thời gian


4. Post Approval — Duyệt bài đăng
STT
Chức năng
Mô tả
1
Bài đăng mặc định PENDING
Sau khi user đăng, chờ Admin duyệt
2
Admin xem danh sách bài chờ duyệt
Hiển thị các bài PENDING
3
Admin xem chi tiết bài đăng
Kiểm tra nội dung, ảnh, mô tả
4
Admin duyệt bài
Chuyển trạng thái sang ACTIVE
5
Admin từ chối bài
Chuyển trạng thái sang REJECTED
6
Nhập lý do từ chối
Ví dụ: ảnh không rõ, mô tả thiếu, sản phẩm cấm
7
User xem trạng thái bài đăng
PENDING, ACTIVE, REJECTED, SOLD, RENTING
8
Admin ẩn bài vi phạm
Chuyển bài sang HIDDEN/BLOCKED
9
Lưu lịch sử duyệt bài
Ai duyệt, duyệt lúc nào, lý do


Người 3: Order, Delivery, Shipper (Duy Anh)
Phụ trách phần mua hàng, đơn hàng, shipper, giao nhận, kiểm tra sản phẩm.

1. Order — Đơn mua hàng
STT
Chức năng
Mô tả
1
Người mua tạo đơn hàng
Chọn sản phẩm và đặt mua
2
Kiểm tra sản phẩm còn bán không
Chỉ đặt được sản phẩm AVAILABLE
3
Lưu thông tin người mua
buyer_id
4
Lưu thông tin người bán
seller_id
5
Lưu thông tin sản phẩm
product_id
6
Tính tổng tiền đơn hàng
Giá sản phẩm + phí ship nếu có
7
Đơn hàng trạng thái PENDING
Chờ người bán xác nhận
8
Người bán xác nhận đơn
Chuyển sang SELLER_CONFIRMED
9
Người bán từ chối đơn
Chuyển sang CANCELLED
10
Hủy đơn hàng
Người mua/người bán hủy khi chưa giao
11
Xem danh sách đơn mua
Người mua xem đơn của mình
12
Xem danh sách đơn bán
Người bán xem đơn bán của mình
13
Xem chi tiết đơn hàng
Thông tin sản phẩm, buyer, seller, trạng thái
14
Hoàn tất đơn hàng
Khi người mua xác nhận nhận hàng


2. Delivery — Giao hàng
STT
Chức năng
Mô tả
1
Tạo đơn giao hàng
Sau khi seller xác nhận
2
Đơn giao hàng chờ shipper nhận
Trạng thái WAITING_SHIPPER
3
Shipper xem danh sách đơn cần giao
List đơn giao hàng
4
Shipper nhận đơn
Chuyển sang SHIPPER_ACCEPTED
5
Shipper đến lấy hàng
Chuyển sang PICKING_UP
6
Shipper xác nhận đã nhận hàng
Chuyển sang PICKED_UP
7
Shipper giao hàng cho người mua
Chuyển sang DELIVERING
8
Người mua xác nhận nhận hàng
Chuyển sang DELIVERED
9
Hoàn tất giao hàng
Delivery COMPLETED
10
Cập nhật trạng thái giao hàng
Theo từng bước
11
Lưu lịch sử trạng thái giao hàng
Ghi thời gian thay đổi trạng thái
12
Xử lý giao hàng thất bại
Người mua không nhận, sai địa chỉ, không liên hệ được


3. Shipper Inspection — Kiểm tra sản phẩm
STT
Chức năng
Mô tả
1
Shipper kiểm tra đúng sản phẩm
So với bài đăng
2
Kiểm tra đúng hình ảnh
So sánh sản phẩm thật với ảnh
3
Kiểm tra đúng model
Ví dụ đúng đời máy, mã sản phẩm
4
Kiểm tra đúng tình trạng
Cũ/mới/lỗi như mô tả
5
Kiểm tra phụ kiện đi kèm
Sạc, dây, hộp, phụ kiện
6
Chụp ảnh mặt trước
Lưu bằng chứng
7
Chụp ảnh mặt sau
Lưu bằng chứng
8
Chụp ảnh phụ kiện
Lưu bằng chứng
9
Ghi chú kiểm tra
Ghi nhận tình trạng thực tế
10
Tạo biên bản kiểm tra
Lưu lại kết quả inspection
11
Báo lỗi nếu sản phẩm sai mô tả
Ghi nhận lỗi thuộc seller
12
Báo lỗi nếu shipper làm hỏng
Ghi nhận lỗi thuộc shipper
13
Admin xem biên bản shipper
Dùng khi có tranh chấp


4. Shipper Management — Quản lý shipper
STT
Chức năng
Mô tả
1
Shipper xem đơn được phép nhận
Chỉ thấy đơn đang chờ
2
Shipper nhận đơn giao hàng
Nhận task giao
3
Shipper xem đơn đang giao
Danh sách đơn của mình
4
Shipper cập nhật tiến trình
Đã lấy hàng, đang giao, đã giao
5
Shipper báo cáo vấn đề
Hàng lỗi, người mua không nhận, người bán không giao
6
Admin xem danh sách shipper
Quản lý đội giao hàng
7
Admin khóa/mở tài khoản shipper
Nếu shipper vi phạm


Người 4: Rental, Contract, Return, Deposit 
Phụ trách phần thuê đồ, hợp đồng thuê, trả đồ, tiền cọc và bồi thường.

1. Rental Request — Yêu cầu thuê
STT
Chức năng
Mô tả
1
Người thuê gửi yêu cầu thuê
Chọn sản phẩm cho thuê
2
Chọn ngày bắt đầu thuê
start_date
3
Chọn ngày kết thúc thuê
end_date
4
Kiểm tra ngày thuê hợp lệ
Ngày kết thúc phải sau ngày bắt đầu
5
Kiểm tra sản phẩm có sẵn không
Không cho thuê trùng lịch
6
Tính số ngày thuê
Dựa trên start_date và end_date
7
Tính tiền thuê
Theo ngày/tuần/tháng
8
Tính tiền cọc
Theo cấu hình sản phẩm
9
Hiển thị tổng tiền cần trả
Tiền thuê + tiền cọc
10
Người cho thuê xem yêu cầu thuê
Danh sách request
11
Người cho thuê chấp nhận
Chuyển trạng thái ACCEPTED
12
Người cho thuê từ chối
Chuyển trạng thái REJECTED
13
Người thuê hủy yêu cầu
Khi chủ đồ chưa chấp nhận


2. Rental Contract — Hợp đồng thuê
STT
Chức năng
Mô tả
1
Tạo hợp đồng thuê
Sau khi chủ đồ chấp nhận
2
Lưu người thuê
renter_id
3
Lưu người cho thuê
owner_id
4
Lưu sản phẩm thuê
product_id
5
Lưu thời gian thuê
start_date, end_date
6
Lưu tiền thuê
rental_fee
7
Lưu tiền cọc
deposit_amount
8
Lưu điều khoản thuê
Chính sách hư hỏng, hoàn cọc
9
Cập nhật trạng thái hợp đồng
ACTIVE, COMPLETED, CANCELLED, DISPUTED
10
Xem chi tiết hợp đồng thuê
Người thuê/chủ đồ/Admin xem
11
Gia hạn thuê
Người thuê gửi yêu cầu gia hạn
12
Chủ đồ chấp nhận gia hạn
Cập nhật ngày kết thúc
13
Chủ đồ từ chối gia hạn
Giữ hợp đồng cũ
14
Nhắc sắp hết hạn thuê
Gửi notification


3. Pre-rental Inspection — Kiểm tra trước thuê
STT
Chức năng
Mô tả
1
Tạo biên bản trước thuê
Shipper kiểm tra trước khi giao
2
Kiểm tra tình trạng sản phẩm
Ghi nhận trước khi người thuê nhận
3
Kiểm tra phụ kiện
Danh sách phụ kiện đi kèm
4
Chụp ảnh mặt trước
Lưu bằng chứng
5
Chụp ảnh mặt sau
Lưu bằng chứng
6
Chụp ảnh phụ kiện
Lưu bằng chứng
7
Ghi chú tình trạng ban đầu
Vết xước, lỗi nhỏ, thiếu phụ kiện
8
Lưu biên bản trước thuê
Dùng để so sánh khi trả


4. Return — Trả sản phẩm thuê
STT
Chức năng
Mô tả
1
Người thuê gửi yêu cầu trả đồ
Khi muốn trả sản phẩm
2
Tạo đơn nhận lại đồ thuê
Giao cho shipper
3
Shipper nhận đơn trả đồ
Shipper đến lấy đồ từ người thuê
4
Shipper kiểm tra sau thuê
Kiểm tra tình trạng sản phẩm
5
Chụp ảnh sau thuê
Ảnh mặt trước, mặt sau, phụ kiện
6
Lập biên bản sau thuê
Ghi nhận tình trạng sau khi dùng
7
So sánh trước thuê và sau thuê
Xác định có hư hỏng không
8
Cập nhật trạng thái trả đồ
RETURN_REQUESTED, CHECKED, RETURNED
9
Hoàn tất hợp đồng thuê
Khi sản phẩm đã trả và xử lý cọc xong


5. Deposit & Compensation — Tiền cọc và bồi thường
STT
Chức năng
Mô tả
1
Ghi nhận tiền cọc
Lưu deposit_amount trong hợp đồng
2
Hoàn cọc 100%
Nếu sản phẩm bình thường
3
Tính mức bồi thường
Nếu sản phẩm hư hỏng
4
Trừ tiền bồi thường từ cọc
compensation_amount
5
Hoàn phần cọc còn lại
deposit_amount - compensation_amount
6
Ghi lý do trừ cọc
Hỏng, thiếu phụ kiện, trầy xước
7
Upload bằng chứng hư hỏng
Ảnh/video sau thuê
8
Chuyển hợp đồng sang DISPUTED
Nếu hai bên không đồng ý
9
Admin xử lý tranh chấp cọc
Admin quyết định cuối cùng


Người 5: UI chung, Chat, Review, Report, Notification, Dashboard ( Khánh )
Phụ trách phần giao diện chung, chat, đánh giá, báo cáo vi phạm, thông báo và dashboard Admin.

1. UI chung
STT
Chức năng
Mô tả
1
Thiết kế layout chính
Header, sidebar, footer
2
Navbar theo role
Admin/User/Shipper thấy menu khác nhau
3
Trang chủ
Hiển thị sản phẩm nổi bật/mới nhất
4
Trang danh sách sản phẩm
Grid/list sản phẩm
5
Trang chi tiết sản phẩm
Ảnh, giá, mô tả, seller info
6
Trang profile cá nhân
Thông tin user
7
Trang quản lý của Admin
Menu quản trị
8
Trang dành cho Shipper
Danh sách đơn cần giao
9
Responsive cơ bản
Dùng được trên laptop/mobile
10
Xử lý loading/error UI
Khi tải dữ liệu hoặc lỗi API


2. Chat
STT
Chức năng
Mô tả
1
Tạo phòng chat
Buyer/renter chat với seller/owner
2
Gửi tin nhắn
User gửi nội dung chat
3
Nhận tin nhắn
Hiển thị tin nhắn hai bên
4
Lưu lịch sử tin nhắn
Lưu vào database
5
Xem danh sách cuộc trò chuyện
Các phòng chat của user
6
Xem chi tiết cuộc trò chuyện
Nội dung từng đoạn chat
7
Gửi ảnh trong chat
Option
8
Đánh dấu tin nhắn đã đọc
Option
9
Admin xem chat khi xử lý báo cáo
Dùng làm bằng chứng


3. Review — Đánh giá
STT
Chức năng
Mô tả
1
Đánh giá sau giao dịch mua
Chỉ review khi order COMPLETED
2
Đánh giá sau thuê
Chỉ review khi rental COMPLETED
3
Đánh giá sản phẩm
1–5 sao và bình luận
4
Đánh giá người bán/người cho thuê
1–5 sao
5
Lưu nội dung đánh giá
Rating, comment, created_at
6
Hiển thị đánh giá ở chi tiết sản phẩm
Người khác xem được
7
Hiển thị đánh giá trong store detail
Xem lịch sử đánh giá cũ
8
Tính điểm trung bình shop
Trung bình số sao
9
Chặn review trùng
Một giao dịch chỉ review một lần
10
Ẩn review vi phạm
Admin có thể ẩn bình luận xấu/không phù hợp


4. Report — Báo cáo vi phạm
STT
Chức năng
Mô tả
1
User gửi báo cáo vi phạm
Báo cáo seller, buyer, shipper hoặc sản phẩm
2
Chọn loại vi phạm
Sai mô tả, thiếu phụ kiện, lừa đảo, hư hỏng
3
Nhập nội dung báo cáo
Mô tả vấn đề
4
Upload ảnh bằng chứng
Ảnh sản phẩm, ảnh lỗi
5
Upload video bằng chứng
Option
6
Gắn báo cáo với đơn hàng
Nếu liên quan đến order
7
Gắn báo cáo với hợp đồng thuê
Nếu liên quan đến rental
8
Gắn báo cáo với bài đăng
Nếu sản phẩm sai mô tả
9
Admin xem danh sách báo cáo
PENDING, PROCESSING, RESOLVED, REJECTED
10
Admin xem chi tiết báo cáo
Nội dung, bằng chứng, người bị báo cáo
11
Admin xử lý báo cáo
Chấp nhận hoặc từ chối
12
Admin nhập kết quả xử lý
Lý do xử lý
13
Tạo vi phạm cho user
Nếu báo cáo đúng
14
Kết nối với điểm uy tín
Gọi chức năng trừ điểm của Người 1
15
Lưu lịch sử xử lý báo cáo
Ai xử lý, xử lý lúc nào


5. Notification — Thông báo
STT
Chức năng
Mô tả
1
Thông báo tài khoản được duyệt
Gửi cho user
2
Thông báo tài khoản bị từ chối
Kèm lý do
3
Thông báo bài đăng được duyệt
Gửi cho chủ bài
4
Thông báo bài đăng bị từ chối
Kèm lý do
5
Thông báo có người đặt mua
Gửi cho seller
6
Thông báo seller xác nhận đơn
Gửi cho buyer
7
Thông báo có yêu cầu thuê
Gửi cho owner
8
Thông báo yêu cầu thuê được chấp nhận
Gửi cho renter
9
Thông báo yêu cầu thuê bị từ chối
Gửi cho renter
10
Thông báo có đơn giao hàng
Gửi cho shipper
11
Thông báo giao hàng thành công
Gửi cho buyer/seller
12
Thông báo sắp hết hạn thuê
Gửi cho renter
13
Thông báo có đánh giá mới
Gửi cho seller/owner
14
Thông báo có báo cáo vi phạm
Gửi cho Admin
15
Thông báo kết quả xử lý báo cáo
Gửi cho người liên quan
16
Xem danh sách thông báo
User xem notification
17
Đánh dấu đã đọc
Cập nhật trạng thái read/unread


6. Dashboard Admin
STT
Chức năng
Mô tả
1
Thống kê tổng số user
Số lượng tài khoản
2
Thống kê user chờ duyệt
Tài khoản PENDING
3
Thống kê bài đăng
Tổng bài, bài chờ duyệt, bài active
4
Thống kê sản phẩm bán
Số sản phẩm bán
5
Thống kê sản phẩm cho thuê
Số sản phẩm thuê
6
Thống kê đơn mua hàng
Tổng đơn, đơn hoàn tất, đơn hủy
7
Thống kê hợp đồng thuê
Đang thuê, hoàn tất, tranh chấp
8
Thống kê báo cáo vi phạm
Pending, resolved, rejected
9
Thống kê user bị khóa
Danh sách tài khoản bị ban
10
Thống kê shipper
Số đơn đã giao, đơn đang giao
11
Biểu đồ giao dịch theo thời gian
Option
12
Biểu đồ vi phạm
Option
13
Xuất báo cáo thống kê
Option


Tổng hợp ngắn gọn theo từng người
Người
Module
Chức năng chính
Người 1
Account, Role, Verification, Reputation
Đăng ký, đăng nhập, phân quyền, OTP, duyệt tài khoản, điểm uy tín, khóa tài khoản
Người 2
Product, Category, Post Approval
Danh mục, đăng bán, đăng thuê, ảnh sản phẩm, tìm kiếm, lọc, duyệt bài
Người 3
Order, Delivery, Shipper
Đặt mua, seller xác nhận, tạo đơn giao, shipper nhận đơn, kiểm tra hàng, giao hàng
Người 4
Rental, Contract, Return, Deposit
Yêu cầu thuê, tính tiền thuê/cọc, hợp đồng thuê, kiểm tra trước/sau thuê, trả đồ, hoàn cọc
Người 5
UI, Chat, Review, Report, Notification, Dashboard
Giao diện chung, chat, đánh giá, báo cáo vi phạm, thông báo, thống kê Admin


Gợi ý chức năng MVP bắt buộc cho từng người
Nếu sợ quá nhiều chức năng, đồ án nên ưu tiên các chức năng này trước.
Người
Chức năng MVP bắt buộc
Người 1
Đăng ký, đăng nhập, phân quyền, OTP, upload giấy tờ, Admin duyệt tài khoản, điểm uy tín
Người 2
CRUD danh mục, đăng bán, đăng cho thuê, upload ảnh, duyệt bài, tìm kiếm/lọc sản phẩm
Người 3
Đặt mua, seller xác nhận, shipper nhận đơn, kiểm tra hàng, giao hàng, hoàn tất đơn
Người 4
Gửi yêu cầu thuê, tính tiền thuê/cọc, tạo hợp đồng, kiểm tra trước thuê, trả đồ, hoàn cọc
Người 5
UI chính, chat, đánh giá, báo cáo vi phạm, thông báo, dashboard cơ bản

Đây là cách chia đầy đủ và hợp lý để tuần nào 5 người cũng có chức năng làm và có nội dung báo cáo tiến độ.
 


