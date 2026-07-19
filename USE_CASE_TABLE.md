# Use Case List — EcoTrade (WDP301)

> Bảng được đối chiếu trực tiếp với 19 file trong `backend/src/routes/`.
> Mọi use case dưới đây đều có endpoint tương ứng trong code.

| ID | Use Case | Feature | Actors | Use Case Description |
|---|---|---|---|---|
| UC-01 | Register | Authentication | Guest | A visitor registers a new account by providing personal information such as full name, email, password, and phone number. |
| UC-02 | Verify Email OTP | Authentication | Guest | A newly registered user activates the account by entering the 6-digit OTP code sent to the registered email. |
| UC-03 | Resend OTP | Authentication | Guest | Request a new OTP code when the previous one has expired, subject to a cooldown period. |
| UC-04 | Login | Authentication | Guest | A registered user logs into the system to access authorized features. |
| UC-05 | Login with Google | Authentication | Guest | A visitor signs in using a Google account instead of email and password. |
| UC-06 | Logout | Authentication | User, Admin, Shipper | The actor logs out of the system. |
| UC-07 | Forgot Password | Authentication | Guest | Request a password reset by receiving an OTP code via email. |
| UC-08 | Reset Password | Authentication | Guest | Set a new password after verifying the OTP code. |
| UC-09 | Change Password | Authentication | User, Admin, Shipper | Change the account password while logged in. |
| UC-10 | View My Profile | Profile Management | User, Admin, Shipper | View personal account information and activity history. |
| UC-11 | Update Profile | Profile Management | User | Update personal information such as name, phone, address, and avatar. |
| UC-12 | View Public Profile | Profile Management | Guest, User | View the public profile of another user, including reputation score and reviews. |
| UC-13 | View My Reputation Score | Reputation | User | View personal reputation score and its change history. |
| UC-14 | View User Reputation Score | Reputation | Guest, User | View the public reputation score of another user before transacting. |
| UC-15 | View Category List | Category Management | Guest, User | View the list of active product categories available on the platform. |
| UC-16 | Create Category | Category Management | Admin | Create a new product category for organizing listings. |
| UC-17 | Update Category | Category Management | Admin | Edit the name or details of an existing category. |
| UC-18 | Deactivate Category | Category Management | Admin | Hide a category from the platform without deleting its data. |
| UC-19 | View Posts | Product Discovery | Guest, User, Admin | View product listings and detailed product information. |
| UC-20 | Search Products | Product Discovery | Guest, User | Search products using keywords. |
| UC-21 | Filter Products | Product Discovery | Guest, User | Filter and sort products by category, price range, product type, or condition. |
| UC-22 | Create Sale Post | Post Management | User | Create a product listing for selling second-hand items. |
| UC-23 | Create Rental Post | Post Management | User | Create a product listing for renting out products, including rental price and deposit. |
| UC-24 | Upload Product Media | Post Management | User | Upload product images to Cloudinary and attach them to a listing. |
| UC-25 | Edit Post | Post Management | User | Modify information of an existing product post. |
| UC-26 | Delete Post | Post Management | User | Remove a product post from the platform. |
| UC-27 | View My Posts | Post Management | User | View and manage personal product listings, including approval status and listing history. |
| UC-28 | Update Product Status | Post Management | User | Update product status such as Available, Reserved, Rented, Sold, or Hidden. |
| UC-29 | View Pending Posts | Post Approval | Admin | View the list of product posts awaiting administrator review. |
| UC-30 | Approve Post | Post Approval | Admin | Review and approve a submitted product post so it becomes publicly visible. |
| UC-31 | Reject Post | Post Approval | Admin | Reject a submitted product post and provide a rejection reason. |
| UC-32 | Add to Cart | Shopping Cart | User | Add a product for sale to the shopping cart, or update its quantity. |
| UC-33 | View Cart | Shopping Cart | User | View items in the cart with subtotal, shipping fee, and total amount. |
| UC-34 | Remove from Cart | Shopping Cart | User | Remove a product from the shopping cart. |
| UC-35 | Checkout Cart | Shopping Cart | User | Convert all valid items in the cart into separate purchase orders in one action. |
| UC-36 | Place Purchase Order | Order Management | User | Create a purchase order for a selected product after reviewing price, shipping fee, and total amount. |
| UC-37 | View My Orders | Order Management | User | View the list of personal purchase orders and sales orders with their current status. |
| UC-38 | Confirm Purchase Order | Order Management | User | Accept or reject a purchase order as the seller. |
| UC-39 | Cancel Purchase Order | Order Management | User | Cancel a purchase order before it is delivered. |
| UC-40 | Confirm Product Receipt | Order Management | User | Confirm successful receipt of the purchased product and complete the order. |
| UC-41 | Create Delivery Request | Delivery Management | System | Generate a delivery request automatically after the seller confirms the order. |
| UC-42 | View Delivery Orders | Delivery Management | Shipper | View available delivery requests waiting to be accepted, and personally assigned deliveries. |
| UC-43 | Accept Delivery Order | Delivery Management | Shipper | Accept a delivery request for processing. |
| UC-44 | Update Delivery Status | Delivery Management | Shipper | Update the delivery progress through picking up, picked up, delivering, and delivered. |
| UC-45 | Inspect Product Before Delivery | Delivery Inspection | Shipper | Verify product condition, description, model, images, and accessories before delivery. |
| UC-46 | Upload Inspection Evidence | Delivery Inspection | Shipper | Upload photos and inspection records as transaction evidence. |
| UC-47 | View Inspection Records | Delivery Inspection | Shipper, Admin | View inspection records of a delivery for verification or dispute resolution. |
| UC-48 | Check Rental Availability | Rental Management | Guest, User | Check whether a product is available for rent during a specific period. |
| UC-49 | Create Rental Request | Rental Management | User | Submit a request to rent a product for a specific period with calculated rental fee and deposit. |
| UC-50 | Approve Rental Request | Rental Management | User | Accept or reject a rental request as the product owner. |
| UC-51 | Generate Rental Contract | Rental Management | System | Generate rental contract information automatically after rental approval. |
| UC-52 | Deliver Rental Item | Rental Management | Shipper | Deliver the rental item to the renter. |
| UC-53 | Request Rental Extension | Rental Management | User | Request an extension of the rental period. |
| UC-54 | Approve Rental Extension | Rental Management | User | Accept or reject a rental extension request as the owner. |
| UC-55 | Inspect Product Before Rental | Rental Inspection | Shipper | Record product condition and accessories before rental delivery. |
| UC-56 | Inspect Returned Item | Rental Inspection | Shipper | Compare the returned item with the pre-rental inspection record. |
| UC-57 | Request Product Return | Rental Return | User | Submit a request to return a rented product. |
| UC-58 | Receive Returned Item | Rental Return | Shipper | Receive the returned rental item from the renter. |
| UC-59 | Resolve Deposit and Compensation | Deposit & Compensation | User, Admin | Determine compensation for damaged or missing items and settle the remaining deposit. |
| UC-60 | Complete Rental Transaction | Deposit & Compensation | System | Complete the rental contract and finalize the deposit settlement. |
| UC-61 | Submit Product Review | Review & Rating | User | Rate and review a product after a completed transaction. |
| UC-62 | Submit Seller Review | Review & Rating | User | Rate and review a seller after a completed transaction. |
| UC-63 | View Reviews | Review & Rating | Guest, User | View reviews and average rating of a product or a seller. |
| UC-64 | Hide Violating Review | Review & Rating | Admin | Hide a review that violates platform rules. |
| UC-65 | Report Violation | Report & Reputation | User, Shipper | Submit a violation report against a user, post, order, or rental contract. |
| UC-66 | Upload Report Evidence | Report & Reputation | User, Shipper | Attach images or files as supporting evidence for a submitted report. |
| UC-67 | Review Violation Report | Report & Reputation | Admin | Review reported violations, related evidence, and record the resolution result. |
| UC-68 | Apply Penalty | Report & Reputation | Admin | Deduct reputation points and apply penalties to violating users. |
| UC-69 | View Reputation History | Report & Reputation | Admin | View the reputation change history of a specific user. |
| UC-70 | Chat with Seller | Chat | User | Exchange messages with another user regarding a product or transaction. |
| UC-71 | View Conversations | Chat | User | View the list of personal chat conversations and their message history. |
| UC-72 | View Chat Room | Chat | Admin | View the messages of a chat room when handling a violation report. |
| UC-73 | Contact Admin Support | Support Chat | User | Send a message directly to admin/support staff, not tied to any product listing. |
| UC-74 | View Support Conversation | Support Chat | User, Admin | View the message history of a support conversation. |
| UC-75 | View Active Support Customers | Support Chat | Admin | View the list of users with an open support conversation. |
| UC-76 | View Notifications | Notification | User, Admin, Shipper | View notifications related to transactions and system activities, including the unread count. |
| UC-77 | Mark Notification as Read | Notification | User, Admin, Shipper | Mark a single notification or all notifications as read. |
| UC-78 | View Pro Plans | Pro Subscription | User | View available Pro subscription plans (1/3/12 months) and prices. |
| UC-79 | Upgrade to Pro | Pro Subscription | User | Pay for a Pro subscription via VNPay to remove the free-post limit. |
| UC-80 | View Payment Result | Pro Subscription | User | Return from VNPay after payment and see whether the upgrade succeeded. |
| UC-81 | View My Subscriptions | Pro Subscription | User | View history of past Pro subscription purchases. |
| UC-82 | Check Pro Status | Pro Subscription | User | Check current Pro status, expiry date, and remaining free posts. |
| UC-83 | Set Featured Products | Featured Products | User | Select products to be highlighted on the platform, available to Pro users within a maximum limit. |
| UC-84 | View Featured Setup Reminder | Featured Products | User | Receive and dismiss a reminder to set up featured products after upgrading to Pro. |
| UC-85 | Manage Users | User Management | Admin | View the list of user accounts, filter by status, and manage account information. |
| UC-86 | Manage Shippers | User Management | Admin | Manage shipper accounts, assign the shipper role, and review delivery performance. |
| UC-87 | Ban User Account | User Management | Admin | Suspend a user account due to serious violations or zero reputation score. |
| UC-88 | Restore User Account | User Management | Admin | Reactivate a previously suspended user account. |
| UC-89 | View System Statistics | Admin Dashboard | Admin | View overall system statistics on users, posts, orders, rentals, deliveries, and violations. |
| UC-90 | View Revenue Report | Admin Dashboard | Admin | View revenue statistics generated from Pro subscription payments. |
| UC-91 | View Transaction History | Admin Dashboard | Admin | View the list of subscription payment transactions on the platform. |
| UC-92 | Create Shipper Report | Shipper Report | Shipper | Report a delivery-related problem such as buyer unreachable, wrong address, or damage in transit. |
| UC-93 | View My Shipper Reports | Shipper Report | Shipper | View own submitted delivery reports and their resolution status. |
| UC-94 | Resolve Shipper Report | Shipper Report | Admin | Review and resolve a shipper-submitted delivery report. |

---

## Feature Summary

| # | Feature | Use Cases | Count |
|---|---|---|---|
| 1 | Authentication | UC-01 → UC-09 | 9 |
| 2 | Profile Management | UC-10 → UC-12 | 3 |
| 3 | Reputation | UC-13, UC-14 | 2 |
| 4 | Category Management | UC-15 → UC-18 | 4 |
| 5 | Product Discovery | UC-19 → UC-21 | 3 |
| 6 | Post Management | UC-22 → UC-28 | 7 |
| 7 | Post Approval | UC-29 → UC-31 | 3 |
| 8 | Shopping Cart | UC-32 → UC-35 | 4 |
| 9 | Order Management | UC-36 → UC-40 | 5 |
| 10 | Delivery Management | UC-41 → UC-44 | 4 |
| 11 | Delivery Inspection | UC-45 → UC-47 | 3 |
| 12 | Rental Management | UC-48 → UC-54 | 7 |
| 13 | Rental Inspection | UC-55, UC-56 | 2 |
| 14 | Rental Return | UC-57, UC-58 | 2 |
| 15 | Deposit & Compensation | UC-59, UC-60 | 2 |
| 16 | Review & Rating | UC-61 → UC-64 | 4 |
| 17 | Report & Reputation | UC-65 → UC-69 | 5 |
| 18 | Chat | UC-70 → UC-72 | 3 |
| 19 | Support Chat | UC-73 → UC-75 | 3 |
| 20 | Notification | UC-76, UC-77 | 2 |
| 21 | Pro Subscription | UC-78 → UC-82 | 5 |
| 22 | Featured Products | UC-83, UC-84 | 2 |
| 23 | User Management | UC-85 → UC-88 | 4 |
| 24 | Admin Dashboard | UC-89 → UC-91 | 3 |
| 25 | Shipper Report | UC-92 → UC-94 | 3 |
| | **TOTAL** | | **94** |

---

## Actor Summary

| Actor | Description | Use Cases |
|---|---|---|
| Guest | Visitor who has not logged in | 12 |
| User | Registered account acting as buyer, seller, renter, or owner | 51 |
| Shipper | Delivery staff handling pickup, inspection, and delivery | 14 |
| Admin | System administrator | 27 |
| System | Automated actions triggered by the system | 3 |

*Một use case có thể thuộc nhiều actor nên tổng các dòng lớn hơn 94.*

---

## Ghi chú đối chiếu với hệ thống

### Chức năng chưa được triển khai

Ba use case sau nằm trong bản nháp trước nhưng **không có model, route hay controller nào** trong backend. Cần code bổ sung nếu muốn giữ trong phạm vi đồ án:

| Use Case | Feature | Actors | Use Case Description |
|---|---|---|---|
| Add to Wishlist | Wishlist | User | Save a product to the wishlist for future reference. |
| View Wishlist | Wishlist | User | View all products saved in the wishlist. |
| Remove from Wishlist | Wishlist | User | Remove a product from the wishlist. |

### Các thay đổi so với bản nháp

1. **Register** — bỏ phần "upload identity verification documents". Hệ thống không có KYC, chỉ xác thực OTP email (xem UC-02).
2. **Approve / Reject User Registration** — đã loại bỏ. Không có luồng duyệt tài khoản; user đăng ký và xác thực OTP là dùng được ngay.
3. **Submit Post for Approval** — đã loại bỏ. Bài đăng tự động chuyển sang trạng thái chờ duyệt khi được tạo, không phải hành động riêng của user.
4. **Manage My Listings / View Listing History** — gộp vào UC-27 (View My Posts) vì cùng dùng một endpoint `GET /api/products/my`.
5. **Bổ sung 20 use case** đã có trong code nhưng thiếu trong bản nháp: xác thực OTP, quên/đặt lại/đổi mật khẩu, đăng nhập Google, featured products, báo cáo doanh thu, đánh dấu thông báo đã đọc, ẩn đánh giá vi phạm, admin xem chat, và các use case xem danh sách liên quan.

### Ràng buộc nghiệp vụ (business rules, không phải use case)

- User thường bị giới hạn `FREE_POST_LIMIT` bài đăng đang hoạt động; nâng cấp Pro để đăng không giới hạn.
- Số sản phẩm nổi bật tối đa của user Pro giới hạn bởi `MAX_FEATURED_PRODUCTS`.
- Điểm uy tín khởi tạo 100; về 0 thì tài khoản bị khóa tự động.
- Tiền cọc hoàn 100% nếu sản phẩm nguyên vẹn, trừ dần theo mức bồi thường nếu hư hỏng.
- Trạng thái giao hàng phải đi tuần tự, không được nhảy bước.
