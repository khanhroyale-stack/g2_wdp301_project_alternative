# Nội dung thay thế mục 3.2 — Phần LongTNP

> **Cách dùng:** Thay thế toàn bộ mục 3.2.1 → 3.2.7 hiện tại trong `WDP_Report_Final.docx` bằng nội dung dưới đây.
> Giữ nguyên định dạng bảng 4 cột như tài liệu đang dùng.
>
> **Lưu ý về đánh số:** phần này gồm 13 mục (3.2.1 → 3.2.13) thay cho 7 mục cũ, nên các mục phía sau
> (hiện bắt đầu từ 3.2.8 "Create booking") sẽ dịch xuống +6. Cần báo Khánh (leader) trước khi sửa
> để nhóm đồng bộ số thứ tự. Số bảng chạy từ Table III.15 → Table III.27.

---

#### 3.2.1. Register

Table III.15: Shows the Register feature description

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| USE CASE-01 |  |  |  |
| Use-case No. | UC01 | Use-case Version | 1.0 |
| Use-case Name | Register |  |  |
| Author | LongTNP |  |  |
| Date | 19/07/2026 | Priority | High |
| Actor | Guest |  |  |
| Summary | A guest creates a new account on the system by submitting personal information |  |  |
| Goal | Allow a guest to own an account and become a User of the system |  |  |
| Triggers | Guest clicks the "Đăng ký" button on the navigation bar |  |  |
| Preconditions | Guest is not logged in and the email has not been registered before |  |  |
| Post Conditions | A new account is created with status unverified, and a 6-digit OTP code is sent to the registered email |  |  |
| Main Success Scenario |  |  |  |
| Step | Actor Event | System response |  |
| 1 | Guest clicks "Đăng ký" on the navigation bar | Display the registration form |  |
| 2 | Guest fills in full name, email, password, phone, address, date of birth, gender | Validate the input on the client side |  |
| 3 | Guest clicks "Đăng ký" | Normalize the email, validate all fields, check email uniqueness |  |
| 4 |  | Create the user record with a hashed password and verificationStatus = unverified |  |
| 5 |  | Generate a 6-digit OTP, store it for 10 minutes, and send it to the email |  |
| 6 |  | Return success and redirect the guest to the OTP verification screen |  |
| Alternative Scenario |  |  |  |
| Step | Action | Use case |  |
| 3a | Guest already has an account and clicks "Đăng nhập" instead | UC04 Login |  |
| 3b | Guest chooses to register with a Google account | UC05 Login with Google |  |
| 6a | Guest does not receive the OTP email and requests a new code | UC03 Resend OTP |  |
| Exceptions | Exception code | Message | Caught |
|  | 400 | Vui lòng điền đầy đủ thông tin | Full name, email, or password is empty |
|  | 400 | Ngày sinh không hợp lệ | Date of birth cannot be parsed |
|  | 400 | Ngày sinh không được ở tương lai | Date of birth is later than the current date |
|  | 400 | Bạn phải đủ 13 tuổi trở lên để đăng ký | User is under 13 years old |
|  | 400 | Giới tính không hợp lệ | Gender is not male, female, or other |
|  | 400 | Email đã được sử dụng | Email already exists in the database |
| Business Rules | Code | Rule |  |
|  | BR-01 | Email is normalized (trimmed and lower-cased) before being stored and compared |  |
|  | BR-02 | Email must be unique across the whole system |  |
|  | BR-03 | Password is hashed with bcrypt before storage; the plain password is never saved |  |
|  | BR-04 | A user must be at least 13 years old to register |  |
|  | BR-05 | A newly created account has verificationStatus = unverified and cannot log in until verified |  |

Table III.15: Register feature

---

#### 3.2.2. Verify Email OTP

Table III.16: Shows the Verify Email OTP feature description

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| USE CASE-02 |  |  |  |
| Use-case No. | UC02 | Use-case Version | 1.0 |
| Use-case Name | Verify Email OTP |  |  |
| Author | LongTNP |  |  |
| Date | 19/07/2026 | Priority | High |
| Actor | Guest |  |  |
| Summary | A newly registered user activates the account by entering the OTP code received by email |  |  |
| Goal | Confirm ownership of the email address and activate the account |  |  |
| Triggers | The system redirects the guest to the OTP screen after registration |  |  |
| Preconditions | The account exists with verificationStatus = unverified and a valid OTP has been issued |  |  |
| Post Conditions | The account becomes verified, a JWT token is issued, and the user is logged in automatically |  |  |
| Main Success Scenario |  |  |  |
| Step | Actor Event | System response |  |
| 1 | Guest opens the OTP verification screen | Display the 6-digit OTP input form and a countdown timer |  |
| 2 | Guest enters the OTP code received by email | Validate that email and OTP are present |  |
| 3 | Guest clicks "Xác thực" | Compare the code, check expiry and the number of failed attempts |  |
| 4 |  | Update verificationStatus to verified |  |
| 5 |  | Issue a JWT token and return the user profile |  |
| 6 |  | Log the user in and redirect to the home page |  |
| Alternative Scenario |  |  |  |
| Step | Action | Use case |  |
| 2a | The OTP has expired or was not received; guest requests a new code | UC03 Resend OTP |  |
| Exceptions | Exception code | Message | Caught |
|  | 400 | Thiếu email hoặc OTP | Email or OTP field is empty |
|  | 400 | OTP không hợp lệ hoặc đã hết hạn | The OTP does not exist or has passed its 10-minute lifetime |
|  | 400 | Mã OTP không đúng. Bạn còn {n} lần thử | Wrong OTP code, with the number of remaining attempts |
|  | 400 | Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới | Five wrong attempts reached; the OTP is destroyed |
|  | 404 | Không tìm thấy tài khoản | No account matches the submitted email |
| Business Rules | Code | Rule |  |
|  | BR-06 | The OTP consists of 6 digits and is valid for 10 minutes |  |
|  | BR-07 | A maximum of 5 wrong attempts is allowed; after that the OTP is destroyed |  |
|  | BR-08 | The OTP is deleted after a successful verification and cannot be reused |  |
|  | BR-09 | Verifying the OTP logs the user in directly without a separate login step |  |

Table III.16: Verify Email OTP feature

---

#### 3.2.3. Resend OTP

Table III.17: Shows the Resend OTP feature description

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| USE CASE-03 |  |  |  |
| Use-case No. | UC03 | Use-case Version | 1.0 |
| Use-case Name | Resend OTP |  |  |
| Author | LongTNP |  |  |
| Date | 19/07/2026 | Priority | Medium |
| Actor | Guest |  |  |
| Summary | A guest requests a new OTP code when the previous code has expired or was not received |  |  |
| Goal | Provide a valid OTP code so the guest can complete email verification |  |  |
| Triggers | Guest clicks "Gửi lại mã" on the OTP verification screen |  |  |
| Preconditions | The email exists in the system and the 60-second cooldown has elapsed |  |  |
| Post Conditions | A new OTP replaces the old one and is sent to the email |  |  |
| Main Success Scenario |  |  |  |
| Step | Actor Event | System response |  |
| 1 | Guest clicks "Gửi lại mã" | Check that the email exists in the system |  |
| 2 |  | Check the remaining resend cooldown |  |
| 3 |  | Generate a new OTP and overwrite the previous record |  |
| 4 |  | Send the new OTP by email and restart the 60-second countdown |  |
| Alternative Scenario |  |  |  |
| Step | Action | Use case |  |
| 4a | Guest enters the new code to complete activation | UC02 Verify Email OTP |  |
| Exceptions | Exception code | Message | Caught |
|  | 404 | Email không tồn tại trong hệ thống | No account matches the submitted email |
|  | 429 | Vui lòng đợi {n}s trước khi gửi lại OTP | The request is made before the 60-second cooldown ends |
| Business Rules | Code | Rule |  |
|  | BR-10 | Two consecutive OTP requests for the same email must be at least 60 seconds apart |  |
|  | BR-11 | Issuing a new OTP invalidates the previous code and resets the failed-attempt counter |  |

Table III.17: Resend OTP feature

---

#### 3.2.4. Login

Table III.18: Shows the Login feature description

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| USE CASE-04 |  |  |  |
| Use-case No. | UC04 | Use-case Version | 1.0 |
| Use-case Name | Login |  |  |
| Author | LongTNP |  |  |
| Date | 19/07/2026 | Priority | High |
| Actor | User, Admin, Shipper |  |  |
| Summary | A registered user logs into the system to use the features permitted for their role |  |  |
| Goal | Allow a guest to become an authenticated actor of the system with the correct role |  |  |
| Triggers | Guest clicks the "Đăng nhập" button on the navigation bar |  |  |
| Preconditions | The user owns a registered account that has been verified and is not banned |  |  |
| Post Conditions | A JWT token is issued and stored on the client; the user can access all features permitted for their role |  |  |
| Main Success Scenario |  |  |  |
| Step | Actor Event | System response |  |
| 1 | User clicks "Đăng nhập" on the navigation bar | Display the login form |  |
| 2 | User enters email and password | Validate that both fields are filled in |  |
| 3 | User clicks "Đăng nhập" | Normalize the email and look up the account |  |
| 4 |  | Compare the submitted password with the stored bcrypt hash |  |
| 5 |  | Check the account status and the email verification status |  |
| 6 |  | Issue a JWT token valid for 7 days and return the user profile |  |
| 7 |  | Redirect the user to the home page according to their role |  |
| Alternative Scenario |  |  |  |
| Step | Action | Use case |  |
| 2a | User signs in with a Google account instead of a password | UC05 Login with Google |  |
| 2b | User has forgotten the password and clicks "Quên mật khẩu" | UC07 Forgot Password |  |
| 5a | The account has not been verified; the system sends a new OTP | UC02 Verify Email OTP |  |
| Exceptions | Exception code | Message | Caught |
|  | 400 | Vui lòng nhập email và mật khẩu | Email or password field is empty |
|  | 401 | Email hoặc mật khẩu không đúng | The account does not exist or the password does not match |
|  | 401 | Tài khoản này chưa có mật khẩu hợp lệ. Hãy dùng Quên mật khẩu để thiết lập lại | The account was created via Google and has no password |
|  | 403 | Tài khoản đã bị khóa do vi phạm | accountStatus is banned |
|  | 403 | Tài khoản chưa xác thực email. Mã OTP mới đã được gửi | verificationStatus is not verified |
| Business Rules | Code | Rule |  |
|  | BR-12 | The system returns the same message for a wrong email and a wrong password to avoid disclosing which accounts exist |  |
|  | BR-13 | A banned account cannot log in regardless of correct credentials |  |
|  | BR-14 | An unverified account cannot log in; the system automatically issues a new OTP if the cooldown has elapsed |  |
|  | BR-15 | The JWT token is valid for 7 days by default, configurable through JWT_EXPIRES_IN |  |

Table III.18: Login feature

---

#### 3.2.5. Login with Google

Table III.19: Shows the Login with Google feature description

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| USE CASE-05 |  |  |  |
| Use-case No. | UC05 | Use-case Version | 1.0 |
| Use-case Name | Login with Google |  |  |
| Author | LongTNP |  |  |
| Date | 19/07/2026 | Priority | Medium |
| Actor | Guest |  |  |
| Summary | A guest signs in through Google OAuth instead of using an email and password |  |  |
| Goal | Shorten the registration and login process by reusing a verified Google account |  |  |
| Triggers | Guest clicks the "Đăng nhập với Google" button on the login screen |  |  |
| Preconditions | The guest owns a Google account whose email has been verified by Google |  |  |
| Post Conditions | The account is created or linked automatically, marked as verified, and a JWT token is issued |  |  |
| Main Success Scenario |  |  |  |
| Step | Actor Event | System response |  |
| 1 | Guest clicks "Đăng nhập với Google" | Open the Google authentication window |  |
| 2 | Guest selects a Google account and grants permission | Receive the Google credential and verify the ID token |  |
| 3 |  | Look up an existing account by googleId, then by email |  |
| 4 |  | Link the googleId to the existing account, or create a new account if none exists |  |
| 5 |  | Set verificationStatus to verified and copy the Google avatar if the user has none |  |
| 6 |  | Issue a JWT token and log the user in |  |
| Alternative Scenario |  |  |  |
| Step | Action | Use case |  |
| 4a | The email already has a password account; the system links both login methods | UC04 Login |  |
| 6a | The Google-created account later needs a password for normal login | UC07 Forgot Password |  |
| Exceptions | Exception code | Message | Caught |
|  | 400 | Thiếu Google credential | The request does not include a credential |
|  | 401 | Google token không hợp lệ | The ID token cannot be verified against Google |
|  | 401 | Email Google chưa được xác thực | Google reports email_verified = false |
|  | 403 | Tài khoản đã bị khóa do vi phạm | accountStatus is banned |
| Business Rules | Code | Rule |  |
|  | BR-16 | An account signing in through Google is treated as verified and skips the OTP step |  |
|  | BR-17 | If the Google email matches an existing account, the two login methods are linked instead of creating a duplicate |  |
|  | BR-18 | An account created through Google has no password and must use Forgot Password to set one |  |

Table III.19: Login with Google feature

---

#### 3.2.6. Logout

Table III.20: Shows the Logout feature description

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| USE CASE-06 |  |  |  |
| Use-case No. | UC06 | Use-case Version | 1.0 |
| Use-case Name | Logout |  |  |
| Author | LongTNP |  |  |
| Date | 19/07/2026 | Priority | Medium |
| Actor | User, Admin, Shipper |  |  |
| Summary | The actor ends the current session and leaves the system |  |  |
| Goal | Protect the account when the user finishes working, especially on a shared device |  |  |
| Triggers | Actor clicks "Đăng xuất" in the account dropdown menu |  |  |
| Preconditions | The actor is logged in and holds a valid JWT token |  |  |
| Post Conditions | The token and user state are cleared from the client; protected pages become inaccessible |  |  |
| Main Success Scenario |  |  |  |
| Step | Actor Event | System response |  |
| 1 | Actor opens the account menu on the navigation bar | Display the menu with the "Đăng xuất" option |  |
| 2 | Actor clicks "Đăng xuất" | Remove the JWT token from local storage |  |
| 3 |  | Clear the authentication context and disconnect the socket |  |
| 4 |  | Redirect the actor to the home page in guest mode |  |
| Alternative Scenario |  |  |  |
| Step | Action | Use case |  |
| 4a | Actor logs in again with another account | UC04 Login |  |
| Exceptions | Exception code | Message | Caught |
|  | 401 | Phiên đăng nhập đã hết hạn | The token expires before the actor logs out; the client clears the state and redirects to the login page |
| Business Rules | Code | Rule |  |
|  | BR-19 | Authentication is stateless with JWT, so logging out only clears the token on the client side |  |
|  | BR-20 | An issued token remains technically valid until it expires; the system does not maintain a blacklist |  |

Table III.20: Logout feature

---

#### 3.2.7. Forgot Password

Table III.21: Shows the Forgot Password feature description

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| USE CASE-07 |  |  |  |
| Use-case No. | UC07 | Use-case Version | 1.0 |
| Use-case Name | Forgot Password |  |  |
| Author | LongTNP |  |  |
| Date | 19/07/2026 | Priority | High |
| Actor | Guest |  |  |
| Summary | A guest who has forgotten the password requests an OTP code to reset it |  |  |
| Goal | Help the user regain access to the account without support intervention |  |  |
| Triggers | Guest clicks "Quên mật khẩu" on the login screen |  |  |
| Preconditions | The email exists in the system and the 60-second cooldown has elapsed |  |  |
| Post Conditions | An OTP code with purpose reset is sent to the email and is valid for 10 minutes |  |  |
| Main Success Scenario |  |  |  |
| Step | Actor Event | System response |  |
| 1 | Guest clicks "Quên mật khẩu" on the login screen | Display the email input form |  |
| 2 | Guest enters the registered email and submits | Normalize the email and verify that the account exists |  |
| 3 |  | Check the remaining resend cooldown |  |
| 4 |  | Generate an OTP with purpose reset and send it by email |  |
| 5 |  | Redirect the guest to the password reset screen |  |
| Alternative Scenario |  |  |  |
| Step | Action | Use case |  |
| 2a | Guest remembers the password and returns to the login screen | UC04 Login |  |
| 5a | Guest enters the OTP and the new password | UC08 Reset Password |  |
| Exceptions | Exception code | Message | Caught |
|  | 404 | Email không tồn tại trong hệ thống | No account matches the submitted email |
|  | 429 | Vui lòng đợi {n}s trước khi gửi lại OTP | The request is made before the 60-second cooldown ends |
| Business Rules | Code | Rule |  |
|  | BR-21 | The reset OTP is stored separately from the registration OTP, so the two flows do not interfere |  |
|  | BR-22 | Requesting a reset OTP does not change the current password until the reset is completed |  |

Table III.21: Forgot Password feature

---

#### 3.2.8. Reset Password

Table III.22: Shows the Reset Password feature description

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| USE CASE-08 |  |  |  |
| Use-case No. | UC08 | Use-case Version | 1.0 |
| Use-case Name | Reset Password |  |  |
| Author | LongTNP |  |  |
| Date | 19/07/2026 | Priority | High |
| Actor | Guest |  |  |
| Summary | A guest sets a new password after verifying the OTP code sent to the email |  |  |
| Goal | Restore access to the account with a new password |  |  |
| Triggers | Guest submits the OTP code and the new password on the password reset screen |  |  |
| Preconditions | A valid reset OTP has been issued and has not expired |  |  |
| Post Conditions | The password is replaced by the new hashed value and the OTP is destroyed |  |  |
| Main Success Scenario |  |  |  |
| Step | Actor Event | System response |  |
| 1 | Guest opens the password reset screen | Display the OTP and new password form |  |
| 2 | Guest enters the OTP code and the new password | Validate that all fields are filled in |  |
| 3 | Guest clicks "Đặt lại mật khẩu" | Verify the OTP, its expiry, and the failed-attempt count |  |
| 4 |  | Hash the new password and update the account |  |
| 5 |  | Destroy the OTP and redirect the guest to the login screen |  |
| Alternative Scenario |  |  |  |
| Step | Action | Use case |  |
| 3a | The OTP has expired; guest requests a new code | UC07 Forgot Password |  |
| 5a | Guest logs in with the new password | UC04 Login |  |
| Exceptions | Exception code | Message | Caught |
|  | 400 | Vui lòng điền đầy đủ thông tin | Email, OTP, or new password is empty |
|  | 400 | OTP không hợp lệ hoặc đã hết hạn | The OTP does not exist or has passed its 10-minute lifetime |
|  | 400 | Mã OTP không đúng. Bạn còn {n} lần thử | Wrong OTP code, with the number of remaining attempts |
|  | 404 | Không tìm thấy tài khoản | No account matches the submitted email |
| Business Rules | Code | Rule |  |
|  | BR-23 | The new password is hashed by the model middleware before being stored |  |
|  | BR-24 | Resetting the password does not log the user in automatically; a fresh login is required |  |
|  | BR-25 | This flow also allows a Google-created account to set its first password |  |

Table III.22: Reset Password feature

---

#### 3.2.9. Change Password

Table III.23: Shows the Change Password feature description

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| USE CASE-09 |  |  |  |
| Use-case No. | UC09 | Use-case Version | 1.0 |
| Use-case Name | Change Password |  |  |
| Author | LongTNP |  |  |
| Date | 19/07/2026 | Priority | Medium |
| Actor | User, Admin, Shipper |  |  |
| Summary | A logged-in actor changes the account password by confirming the current one |  |  |
| Goal | Let the actor keep the account secure without going through the email reset flow |  |  |
| Triggers | Actor opens the "Đổi mật khẩu" tab in the account settings page |  |  |
| Preconditions | The actor is logged in and knows the current password |  |  |
| Post Conditions | The password is replaced by the new hashed value; the current token remains valid |  |  |
| Main Success Scenario |  |  |  |
| Step | Actor Event | System response |  |
| 1 | Actor opens the "Đổi mật khẩu" tab | Display the current and new password form |  |
| 2 | Actor enters the current password and the new password | Validate that both fields are filled in |  |
| 3 | Actor clicks "Xác nhận" | Load the account and compare the current password with the stored hash |  |
| 4 |  | Hash the new password and update the account |  |
| 5 |  | Display a success message |  |
| Alternative Scenario |  |  |  |
| Step | Action | Use case |  |
| 3a | Actor does not remember the current password and uses the email flow instead | UC07 Forgot Password |  |
| Exceptions | Exception code | Message | Caught |
|  | 400 | Vui lòng điền đầy đủ thông tin | Current or new password field is empty |
|  | 400 | Mật khẩu hiện tại không đúng | The current password does not match the stored hash |
|  | 401 | Không có quyền truy cập | The request has no valid token |
| Business Rules | Code | Rule |  |
|  | BR-26 | The current password must be confirmed before the new one is accepted |  |
|  | BR-27 | Changing the password does not invalidate the current JWT token |  |

Table III.23: Change Password feature

---

#### 3.2.10. View Profile

Table III.24: Shows the View Profile feature description

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| USE CASE-10 |  |  |  |
| Use-case No. | UC10 | Use-case Version | 1.0 |
| Use-case Name | View Profile |  |  |
| Author | LongTNP |  |  |
| Date | 19/07/2026 | Priority | High |
| Actor | User, Admin, Shipper |  |  |
| Summary | The actor views their own account information and current status on the system |  |  |
| Goal | Let the actor check personal data, role, reputation score, and Pro status |  |  |
| Triggers | Actor clicks their avatar on the navigation bar and selects "Hồ sơ của tôi" |  |  |
| Preconditions | The actor is logged in with a valid token |  |  |
| Post Conditions | Personal information is displayed; no data is modified |  |  |
| Main Success Scenario |  |  |  |
| Step | Actor Event | System response |  |
| 1 | Actor selects "Hồ sơ của tôi" from the account menu | Verify the token and identify the current user |  |
| 2 |  | Load the account record from the database |  |
| 3 |  | Build the address list, defaulting from name, phone, and address when empty |  |
| 4 |  | Compute the Pro status from proExpiresAt |  |
| 5 |  | Display full name, email, phone, avatar, date of birth, gender, address list, role, reputation score, and Pro status |  |
| Alternative Scenario |  |  |  |
| Step | Action | Use case |  |
| 5a | Actor edits the displayed information | UC11 Edit Profile |  |
| 5b | Actor checks the remaining number of free posts | UC13 Check Pro Status |  |
| Exceptions | Exception code | Message | Caught |
|  | 401 | Không có quyền truy cập | The request has no valid token or the token has expired |
| Business Rules | Code | Rule |  |
|  | BR-28 | The password hash is never returned in any profile response |  |
|  | BR-29 | Pro status is derived at read time by comparing proExpiresAt with the current time, not stored as a flag |  |
|  | BR-30 | When the address list is empty, the system generates a default address from the name, phone, and address fields |  |

Table III.24: View Profile feature

---

#### 3.2.11. Edit Profile

Table III.25: Shows the Edit Profile feature description

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| USE CASE-11 |  |  |  |
| Use-case No. | UC11 | Use-case Version | 1.0 |
| Use-case Name | Edit Profile |  |  |
| Author | LongTNP |  |  |
| Date | 19/07/2026 | Priority | High |
| Actor | User |  |  |
| Summary | The user updates personal information and the delivery address list |  |  |
| Goal | Keep contact and delivery information accurate for transactions |  |  |
| Triggers | User clicks "Chỉnh sửa" on the personal profile page |  |  |
| Preconditions | The user is logged in with a valid token |  |  |
| Post Conditions | The account record is updated and exactly one address is marked as the default |  |  |
| Main Success Scenario |  |  |  |
| Step | Actor Event | System response |  |
| 1 | User clicks "Chỉnh sửa" on the profile page | Display the editable form pre-filled with current data |  |
| 2 | User updates the name, phone, address, avatar, date of birth, or gender | Validate the input on the client side |  |
| 3 | User adds, edits, or removes entries in the address list | Allow marking one address as the default |  |
| 4 | User clicks "Lưu" | Normalize the address list and remove empty entries |  |
| 5 |  | Ensure exactly one address carries the default flag |  |
| 6 |  | Update the record and return the new profile |  |
| Alternative Scenario |  |  |  |
| Step | Action | Use case |  |
| 4a | User clicks "Hủy" | Clear the entered data and keep the current profile |  |
| 6a | User wants to change the password instead of the profile | UC09 Change Password |  |
| Exceptions | Exception code | Message | Caught |
|  | 401 | Không có quyền truy cập | The request has no valid token |
|  | 500 | Lỗi máy chủ | Schema validation fails or a database error occurs |
| Business Rules | Code | Rule |  |
|  | BR-31 | Only fields present in the request are updated; omitted fields keep their current values |  |
|  | BR-32 | Address entries that are entirely empty are removed from the list |  |
|  | BR-33 | Exactly one address must be the default; if none is marked, the first entry becomes the default |  |
|  | BR-34 | Email and role cannot be changed by the user through this use case |  |

Table III.25: Edit Profile feature

---

#### 3.2.12. Upgrade to Pro

Table III.26: Shows the Upgrade to Pro feature description

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| USE CASE-12 |  |  |  |
| Use-case No. | UC12 | Use-case Version | 1.0 |
| Use-case Name | Upgrade to Pro |  |  |
| Author | LongTNP |  |  |
| Date | 19/07/2026 | Priority | High |
| Actor | User |  |  |
| Summary | The user pays for a Pro subscription through the VNPay gateway to remove the free-post limit |  |  |
| Goal | Let the user become a Pro member and post listings without limit |  |  |
| Triggers | User clicks "Nâng cấp Pro" on the navigation bar, or reaches the free-post limit |  |  |
| Preconditions | The user is logged in and has selected a valid plan |  |  |
| Post Conditions | On a successful payment the Pro period is extended and the user is redirected to the featured product setup page |  |  |
| Main Success Scenario |  |  |  |
| Step | Actor Event | System response |  |
| 1 | User clicks "Nâng cấp Pro" | Display three plans: 1 month 50,000 VND, 3 months 120,000 VND, 12 months 400,000 VND |  |
| 2 | User selects a plan and clicks "Thanh toán" | Validate that the plan exists in the configuration |  |
| 3 |  | Create a subscription record with a unique transaction reference and status pending |  |
| 4 |  | Build a signed VNPay payment URL and redirect the user to the gateway |  |
| 5 | User completes the payment on VNPay | Verify the secure hash of the returned data |  |
| 6 |  | Check the response code, the transaction status, and that the amount matches the plan |  |
| 7 |  | Mark the subscription as paid and extend proExpiresAt on the account |  |
| 8 |  | Redirect the user to the featured product selection page |  |
| Alternative Scenario |  |  |  |
| Step | Action | Use case |  |
| 5a | User cancels on the VNPay page; the subscription record stays pending |  |  |
| 6a | The payment fails and the user is redirected to the result page to retry |  |  |
| 8a | User selects the products to be featured | UC14 Set Featured Products |  |
| Exceptions | Exception code | Message | Caught |
|  | 400 | Gói Pro không hợp lệ | The submitted plan does not exist in the configuration |
|  | 401 | Không có quyền truy cập | The request has no valid token |
|  | Redirect status=failed | Thanh toán thất bại | The signature is invalid, meaning the data may have been tampered with |
|  | Redirect status=failed | Thanh toán thất bại | The response code or transaction status is not 00, or the amount does not match |
| Business Rules | Code | Rule |  |
|  | BR-35 | Three plans are offered: 30 days for 50,000 VND, 90 days for 120,000 VND, and 365 days for 400,000 VND |  |
|  | BR-36 | The payment amount is taken from the server-side configuration, never from the client request |  |
|  | BR-37 | The returned data must pass secure hash verification before any account change is applied |  |
|  | BR-38 | A payment is accepted only when the response code and transaction status are both 00 and the amount matches exactly |  |
|  | BR-39 | The flow is idempotent: an already-paid subscription is not granted twice when the page is refreshed |  |
|  | BR-40 | A new Pro period stacks on top of the remaining period instead of overwriting it |  |

Table III.26: Upgrade to Pro feature

---

#### 3.2.13. Check Pro Status

Table III.27: Shows the Check Pro Status feature description

|  |  |  |  |
| :-: | :-: | :-: | :-: |
| USE CASE-13 |  |  |  |
| Use-case No. | UC13 | Use-case Version | 1.0 |
| Use-case Name | Check Pro Status |  |  |
| Author | LongTNP |  |  |
| Date | 19/07/2026 | Priority | Medium |
| Actor | User |  |  |
| Summary | The user checks the current Pro status, the expiry date, the purchase history, and the number of free posts remaining |  |  |
| Goal | Let the user know when to renew and how many listings they can still create |  |  |
| Triggers | User opens the Pro page or the personal profile page |  |  |
| Preconditions | The user is logged in with a valid token |  |  |
| Post Conditions | The status information is displayed; no data is modified |  |  |
| Main Success Scenario |  |  |  |
| Step | Actor Event | System response |  |
| 1 | User opens the Pro page | Verify the token and identify the current user |  |
| 2 |  | Compare proExpiresAt with the current time to determine the Pro status |  |
| 3 |  | Count the listings currently in pending, approved, or available state |  |
| 4 |  | Compute the remaining free posts for a non-Pro account |  |
| 5 |  | Display the Pro status, the expiry date, the free-post limit, and the remaining quota |  |
| 6 | User opens the "Lịch sử gói Pro" tab | Display every past subscription with plan, amount, status, and expiry date, sorted from newest to oldest |  |
| Alternative Scenario |  |  |  |
| Step | Action | Use case |  |
| 5a | The free quota is exhausted and the user upgrades | UC12 Upgrade to Pro |  |
| 5b | The account is Pro, so the user proceeds to create a listing without limit |  |  |
| Exceptions | Exception code | Message | Caught |
|  | 401 | Không có quyền truy cập | The request has no valid token |
| Business Rules | Code | Rule |  |
|  | BR-41 | A non-Pro account may keep at most 5 active listings at the same time |  |
|  | BR-42 | Only listings in pending, approved, or available state count towards the quota; sold and hidden listings do not |  |
|  | BR-43 | A Pro account has no post limit, so the remaining quota is returned as null |  |
|  | BR-44 | Pro status is computed at read time and expires automatically without a scheduled job |  |
|  | BR-45 | The user can only see their own subscription records |  |

Table III.27: Check Pro Status feature

---

## Checklist khi sửa tài liệu

- [ ] Xóa toàn bộ mục 3.2.1 → 3.2.7 hiện tại (Register, Logout, View Profile, Edit Profile, Register account, Forget password, Reset password)
- [ ] Dán 13 mục ở trên vào thay thế
- [ ] Đánh số lại các mục phía sau: mục "Create booking" hiện là 3.2.8 → đổi thành 3.2.14, các mục sau dịch tiếp
- [ ] Đánh số lại Table III.xx của các mục phía sau cho khớp
- [ ] Báo Khánh (leader, chủ sở hữu file) trước khi sửa vì việc đánh số lại ảnh hưởng phần của cả nhóm
- [ ] Cập nhật mục lục (Table of Contents) sau khi đổi số

## Các lỗi đã sửa so với bản hiện tại

| Vấn đề trong tài liệu | Đã xử lý |
|---|---|
| 3.2.1 Register: Summary vẫn ghi "User login to use actor features on the system" | Viết lại đúng cho Register |
| 3.2.1 Register: Summary và Goal bị đảo chỗ cho nhau | Đã đổi lại đúng vị trí |
| 3.2.1 Register: Exceptions chỉ có "403 Forbidden" của template | Thay bằng 6 mã lỗi thật của API |
| 3.2.1 Register: BR-01 vẫn là câu mẫu "In first time login..." | Thay bằng 5 quy tắc thật |
| 3.2.1: caption ghi "Table III.15: Login feature" | Sửa thành "Register feature" |
| 3.2.5 "Register account" trùng với 3.2.1, nội dung là "User view list of facilities" | Xóa, thay bằng Login with Google |
| 3.2.6 "Forget password" nội dung là "User view detail of a facility" | Viết lại đúng nghiệp vụ |
| 3.2.7 "Reset password" nội dung là "User can rating and comment for a facility" | Viết lại đúng nghiệp vụ |
| Không có mục Login nào trong tài liệu | Bổ sung tại 3.2.4 |
| Thiếu Verify OTP, Resend OTP, Change Password, Pro Subscription | Bổ sung đầy đủ |
| Ngày tháng còn là 07/09/2024, 09/09/2024, 15/09/2024 | Cập nhật thành 19/07/2026 |
