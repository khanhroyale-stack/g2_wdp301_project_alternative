# Luồng nghiệp vụ Shipper (Website mua bán đồ cũ)

## Cập nhật bước kiểm tra đơn hàng

Vì đây là hệ thống mua bán/trao đổi đồ cũ, shipper cần xác minh tình
trạng thực tế của sản phẩm trước khi giao cho người mua. Tất cả tiêu chí
dưới đây **bắt buộc PASS** mới được tiếp tục giao hàng.

## Biên bản kiểm tra sản phẩm

  Tiêu chí                                                       PASS   FAIL
  ------------------------------------------------------------- ------ ------
  Đúng sản phẩm theo đơn đăng bán                                 □      □
  Đúng danh mục/thương hiệu/model                                 □      □
  Đúng tình trạng như người bán mô tả (mới 90%, trầy nhẹ,...)     □      □
  Đúng số lượng                                                   □      □
  Đúng màu sắc/kích thước/phiên bản                               □      □
  Đúng phụ kiện đã cam kết (sạc, hộp, cáp,...)                    □      □
  Không phát sinh hư hỏng mới so với mô tả                        □      □
  Không có dấu hiệu hàng giả/hàng nhái (kiểm tra trực quan)       □      □
  IMEI/Serial (nếu có) khớp với thông tin đăng bán                □      □
  Hình thức bên ngoài phù hợp với ảnh đăng bán                    □      □
  Sản phẩm vẫn hoạt động cơ bản (nếu có thể kiểm tra nhanh)       □      □

------------------------------------------------------------------------

## Quy tắc nghiệp vụ

### PASS tất cả

-   Biên bản = PASS.
-   Cập nhật trạng thái:
    -   READY_FOR_DELIVERY
    -   RECEIVED
    -   IN_DELIVERY

------------------------------------------------------------------------

### Chỉ cần 01 tiêu chí FAIL

Ngay lập tức:

-   Dừng quy trình giao hàng.
-   Không được chuyển sang trạng thái đang giao.
-   Tạo biên bản kiểm tra.
-   Ghi rõ các tiêu chí FAIL.
-   Chụp ảnh/video minh chứng.
-   Đính kèm ghi chú.
-   Gửi biên bản cho Admin để xử lý.

Trạng thái:

    INSPECTION_FAILED
    ↓
    FAILED

------------------------------------------------------------------------

## Mẫu biên bản

### Thông tin

-   Mã đơn
-   Mã sản phẩm
-   Người bán
-   Người mua
-   Mã shipper
-   Thời gian
-   Địa điểm kiểm tra

### Kết quả

  Hạng mục                   PASS   FAIL  Ghi chú
  ------------------------- ------ ------ ---------
  Đúng sản phẩm               □      □    
  Đúng model/thương hiệu      □      □    
  Đúng tình trạng mô tả       □      □    
  Đúng số lượng               □      □    
  Đúng màu/kích thước         □      □    
  Đủ phụ kiện                 □      □    
  Không hư hỏng phát sinh     □      □    
  Không nghi ngờ hàng giả     □      □    
  IMEI/Serial khớp            □      □    
  Khớp ảnh đăng bán           □      □    
  Hoạt động cơ bản            □      □    

Đính kèm: - Ảnh tổng thể - Ảnh các góc sản phẩm - Ảnh lỗi (nếu có) -
Video (nếu cần)

**Quy tắc:** Chỉ cần một mục FAIL thì toàn bộ biên bản được đánh giá
FAIL và đơn hàng dừng để Admin xử lý.
