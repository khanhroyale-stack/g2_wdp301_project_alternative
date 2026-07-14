Người 3: Order, Delivery, Shipper (Duy Anh)

Phụ trách phần mua hàng, đơn hàng, shipper, giao nhận, kiểm tra sản phẩm, phân loại Seller thường và Seller Pro.

1. Order — Đơn mua hàng
STT	Chức năng	Mô tả
1	Người mua tạo đơn hàng	Chọn sản phẩm và đặt mua
2	Kiểm tra sản phẩm còn bán không	Chỉ đặt được sản phẩm trạng thái AVAILABLE
3	Lưu thông tin người mua	buyer_id
4	Lưu thông tin người bán	seller_id
5	Lưu thông tin sản phẩm	product_id
6	Tính tổng tiền đơn hàng	Giá sản phẩm + phí ship nếu có
7	Đơn hàng trạng thái PENDING	Chờ người bán xác nhận
8	Người bán xác nhận đơn	Chuyển sang SELLER_CONFIRMED
9	Người bán từ chối đơn	Chuyển sang CANCELLED
10	Hủy đơn hàng	Người mua/người bán hủy khi chưa giao
11	Xem danh sách đơn mua	Người mua xem đơn của mình
12	Xem danh sách đơn bán	Người bán xem đơn bán của mình
13	Xem chi tiết đơn hàng	Thông tin sản phẩm, buyer, seller, trạng thái
14	Hoàn tất đơn hàng	Khi người mua xác nhận nhận hàng
2. Seller Management — Quản lý Seller thường và Seller Pro
STT	Chức năng	Mô tả
1	Phân loại Seller	Chia thành NORMAL_SELLER và PRO_SELLER
2	Lưu loại Seller	Lưu seller_type của người bán
3	Seller thường đăng sản phẩm	Người bán cá nhân đăng bài bán đồ cũ
4	Giới hạn số lượng bài đăng Seller thường	Seller thường chỉ được đăng số lượng bài quy định trong 1 tháng
5	Kiểm tra giới hạn bài đăng	Kiểm tra số lượng bài đã đăng trước khi tạo bài mới
6	Từ chối đăng bài khi vượt giới hạn	Yêu cầu nâng cấp lên Seller Pro
7	Seller Pro đăng sản phẩm	Cho phép đăng sản phẩm bán
8	Không giới hạn bài đăng Seller Pro	Seller Pro được đăng sản phẩm không giới hạn
9	Quản lý sản phẩm Seller Pro	Quản lý nhiều sản phẩm đang bán
10	Chọn sản phẩm nổi bật	Seller Pro được chọn tối đa 3 sản phẩm nổi bật
11	Hiển thị sản phẩm nổi bật	Ưu tiên hiển thị sản phẩm được chọn
12	Cập nhật sản phẩm nổi bật	Seller Pro thay đổi danh sách 3 sản phẩm nổi bật
3. Delivery — Giao hàng
STT	Chức năng	Mô tả
1	Tạo đơn giao hàng	Sau khi seller xác nhận
2	Đơn giao hàng chờ shipper nhận	Trạng thái WAITING_SHIPPER
3	Shipper xem danh sách đơn cần giao	List đơn giao hàng
4	Shipper nhận đơn	Chuyển sang SHIPPER_ACCEPTED
5	Shipper đến lấy hàng	Chuyển sang PICKING_UP
6	Shipper xác nhận đã nhận hàng	Chuyển sang PICKED_UP
7	Shipper giao hàng cho người mua	Chuyển sang DELIVERING
8	Người mua xác nhận nhận hàng	Chuyển sang DELIVERED
9	Hoàn tất giao hàng	Delivery COMPLETED
10	Cập nhật trạng thái giao hàng	Theo từng bước
11	Lưu lịch sử trạng thái giao hàng	Ghi thời gian thay đổi trạng thái
12	Xử lý giao hàng thất bại	Người mua không nhận, sai địa chỉ, không liên hệ được
4. Shipper Inspection — Kiểm tra sản phẩm
STT	Chức năng	Mô tả
1	Shipper kiểm tra đúng sản phẩm	So với bài đăng
2	Kiểm tra đúng hình ảnh	So sánh sản phẩm thật với ảnh
3	Kiểm tra đúng model	Ví dụ đúng đời máy, mã sản phẩm
4	Kiểm tra đúng tình trạng	Cũ/mới/lỗi như mô tả
5	Kiểm tra phụ kiện đi kèm	Sạc, dây, hộp, phụ kiện
6	Chụp ảnh mặt trước	Lưu bằng chứng
7	Chụp ảnh mặt sau	Lưu bằng chứng
8	Chụp ảnh phụ kiện	Lưu bằng chứng
9	Ghi chú kiểm tra	Ghi nhận tình trạng thực tế
10	Tạo biên bản kiểm tra	Lưu lại kết quả inspection
11	Báo lỗi nếu sản phẩm sai mô tả	Ghi nhận lỗi thuộc seller
12	Báo lỗi nếu shipper làm hỏng	Ghi nhận lỗi thuộc shipper
13	Admin xem biên bản shipper	Dùng khi có tranh chấp
5. Shipper Management — Quản lý shipper
STT	Chức năng	Mô tả
1	Shipper xem đơn được phép nhận	Chỉ thấy đơn đang chờ
2	Shipper nhận đơn giao hàng	Nhận task giao
3	Shipper xem đơn đang giao	Danh sách đơn của mình
4	Shipper cập nhật tiến trình	Đã lấy hàng, đang giao, đã giao
5	Shipper báo cáo vấn đề	Hàng lỗi, người mua không nhận, người bán không giao
6	Admin xem danh sách shipper	Quản lý đội giao hàng
7	Admin khóa/mở tài khoản shipper	Nếu shipper vi phạm