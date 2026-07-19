# Detailed Use Case Specification — LongTNP (Người 1)

**Phạm vi:** Authentication, Profile Management, Reputation, Pro Subscription, Featured Products
**Author:** LongTNP
**Date:** 19/07/2026
**Version:** 1.0

> Mọi thông số (mã lỗi, thông báo, quy tắc nghiệp vụ) trong tài liệu này được trích xuất trực tiếp từ
> `backend/src/controllers/auth.controller.js`, `user.controller.js`, `subscription.controller.js`,
> `utils/otp.js` và `utils/business-rules.js`.

---

## 3.1. Register

**Table III.1: Shows the Register feature description**

| USE CASE-01 | |
|---|---|
| **Use-case No.** | UC-01 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | Register |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | High |
| **Actor** | Guest |
| **Summary** | A guest creates a new account on the system by submitting personal information. |
| **Goal** | Allow a guest to own an account and become a User of the system. |
| **Triggers** | Guest clicks the "Đăng ký" button on the navigation bar. |
| **Preconditions** | Guest is not logged in and the email has not been registered before. |
| **Post Conditions** | A new account is created with status `unverified`, and a 6-digit OTP code is sent to the registered email. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | Guest clicks "Đăng ký" on the navigation bar | Display the registration form |
| 2 | Guest fills in full name, email, password, phone, address, date of birth, gender | Validate the input on the client side |
| 3 | Guest clicks "Đăng ký" | Normalize the email, validate all fields, check email uniqueness |
| 4 | | Create the user record with a hashed password and `verificationStatus = unverified` |
| 5 | | Generate a 6-digit OTP, store it for 10 minutes, and send it to the email |
| 6 | | Return success and redirect the guest to the OTP verification screen |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 3a | Guest already has an account and clicks "Đăng nhập" instead | UC-04 Login |
| 3b | Guest chooses to register with a Google account | UC-05 Login with Google |
| 6a | Guest does not receive the OTP email and requests a new code | UC-03 Resend OTP |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 400 | Vui lòng điền đầy đủ thông tin | Full name, email, or password is empty |
| 400 | Ngày sinh không hợp lệ | Date of birth cannot be parsed |
| 400 | Ngày sinh không được ở tương lai | Date of birth is later than the current date |
| 400 | Bạn phải đủ 13 tuổi trở lên để đăng ký | User is under 13 years old |
| 400 | Giới tính không hợp lệ | Gender is not `male`, `female`, or `other` |
| 400 | Email đã được sử dụng | Email already exists in the database |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-01 | Email is normalized (trimmed and lower-cased) before being stored and compared. |
| BR-02 | Email must be unique across the whole system. |
| BR-03 | Password is hashed with bcrypt before storage; the plain password is never saved. |
| BR-04 | A user must be at least 13 years old to register. |
| BR-05 | A newly created account has `verificationStatus = unverified` and cannot log in until verified. |
| BR-06 | The OTP email is sent asynchronously; a failure to send does not roll back the account creation. |

---

## 3.2. Verify Email OTP

**Table III.2: Shows the Verify Email OTP feature description**

| USE CASE-02 | |
|---|---|
| **Use-case No.** | UC-02 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | Verify Email OTP |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | High |
| **Actor** | Guest |
| **Summary** | A newly registered user activates the account by entering the OTP code received by email. |
| **Goal** | Confirm ownership of the email address and activate the account. |
| **Triggers** | The system redirects the guest to the OTP screen after registration, or the guest logs in with an unverified account. |
| **Preconditions** | The account exists with `verificationStatus = unverified` and a valid OTP has been issued. |
| **Post Conditions** | The account becomes `verified`, a JWT token is issued, and the user is logged in automatically. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | Guest opens the OTP verification screen | Display the 6-digit OTP input form and a countdown timer |
| 2 | Guest enters the OTP code received by email | Validate that email and OTP are present |
| 3 | Guest clicks "Xác thực" | Compare the code, check expiry and the number of failed attempts |
| 4 | | Update `verificationStatus` to `verified` |
| 5 | | Issue a JWT token and return the user profile |
| 6 | | Log the user in and redirect to the home page |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 2a | The OTP has expired or was not received; guest requests a new code | UC-03 Resend OTP |
| 5a | The account is a Pro account that has not set up featured products; the system returns a reminder flag | UC-84 View Featured Setup Reminder |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 400 | Thiếu email hoặc OTP | Email or OTP field is empty |
| 400 | OTP không hợp lệ hoặc đã hết hạn | The OTP does not exist or has passed its 10-minute lifetime |
| 400 | Mã OTP không đúng. Bạn còn {n} lần thử. | Wrong OTP code, with the number of remaining attempts |
| 400 | Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới. | Five wrong attempts reached; the OTP is destroyed |
| 404 | Không tìm thấy tài khoản | No account matches the submitted email |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-07 | The OTP consists of 6 digits and is valid for 10 minutes. |
| BR-08 | A maximum of 5 wrong attempts is allowed; after that the OTP is destroyed and a new one must be requested. |
| BR-09 | The OTP is deleted immediately after a successful verification and cannot be reused. |
| BR-10 | Verifying the OTP logs the user in directly without requiring a separate login step. |

---

## 3.3. Resend OTP

**Table III.3: Shows the Resend OTP feature description**

| USE CASE-03 | |
|---|---|
| **Use-case No.** | UC-03 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | Resend OTP |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | Medium |
| **Actor** | Guest |
| **Summary** | A guest requests a new OTP code when the previous code has expired or was not received. |
| **Goal** | Provide a valid OTP code so the guest can complete email verification. |
| **Triggers** | Guest clicks "Gửi lại mã" on the OTP verification screen. |
| **Preconditions** | The email exists in the system and the 60-second cooldown has elapsed. |
| **Post Conditions** | A new OTP replaces the old one and is sent to the email; the previous code becomes invalid. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | Guest clicks "Gửi lại mã" | Check that the email exists in the system |
| 2 | | Check the remaining resend cooldown |
| 3 | | Generate a new OTP and overwrite the previous record |
| 4 | | Send the new OTP by email and restart the 60-second countdown |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 4a | Guest enters the new code to complete activation | UC-02 Verify Email OTP |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 404 | Email không tồn tại trong hệ thống | No account matches the submitted email |
| 429 | Vui lòng đợi {n}s trước khi gửi lại OTP | The request is made before the 60-second cooldown ends |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-11 | Two consecutive OTP requests for the same email and purpose must be at least 60 seconds apart. |
| BR-12 | Issuing a new OTP invalidates the previous code and resets the failed-attempt counter. |

---

## 3.4. Login

**Table III.4: Shows the Login feature description**

| USE CASE-04 | |
|---|---|
| **Use-case No.** | UC-04 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | Login |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | High |
| **Actor** | User, Admin, Shipper |
| **Summary** | A registered user logs into the system to use the features permitted for their role. |
| **Goal** | Allow a guest to become an authenticated actor of the system with the correct role. |
| **Triggers** | Guest clicks the "Đăng nhập" button on the navigation bar. |
| **Preconditions** | The user is not logged in, owns a registered account, and the account has been verified and is not banned. |
| **Post Conditions** | A JWT token is issued and stored on the client; the user can access all features permitted for their role. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | User clicks "Đăng nhập" on the navigation bar | Display the login form |
| 2 | User enters email and password | Validate that both fields are filled in |
| 3 | User clicks "Đăng nhập" | Normalize the email and look up the account |
| 4 | | Compare the submitted password with the stored bcrypt hash |
| 5 | | Check the account status and the email verification status |
| 6 | | Issue a JWT token valid for 7 days and return the user profile |
| 7 | | Redirect the user to the home page according to their role |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 2a | User signs in with a Google account instead of a password | UC-05 Login with Google |
| 2b | User has forgotten the password and clicks "Quên mật khẩu" | UC-07 Forgot Password |
| 5a | The account has not been verified; the system sends a new OTP and redirects to the verification screen | UC-02 Verify Email OTP |
| 6a | The account is Pro and has not set up featured products; the system returns a reminder flag | UC-84 View Featured Setup Reminder |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 400 | Vui lòng nhập email và mật khẩu | Email or password field is empty |
| 401 | Email hoặc mật khẩu không đúng | The account does not exist or the password does not match |
| 401 | Tài khoản này chưa có mật khẩu hợp lệ. Hãy dùng Quên mật khẩu để thiết lập lại. | The account was created via Google and has no password set |
| 403 | Tài khoản đã bị khóa do vi phạm | `accountStatus` is `banned` |
| 403 | Tài khoản chưa xác thực email. Mã OTP mới đã được gửi, vui lòng nhập để kích hoạt. | `verificationStatus` is not `verified` |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-13 | The system returns the same message for a wrong email and a wrong password to avoid disclosing which accounts exist. |
| BR-14 | A banned account cannot log in regardless of correct credentials. |
| BR-15 | An unverified account cannot log in; the system automatically issues a new OTP if the cooldown has elapsed. |
| BR-16 | The JWT token is valid for 7 days by default, configurable through `JWT_EXPIRES_IN`. |

---

## 3.5. Login with Google

**Table III.5: Shows the Login with Google feature description**

| USE CASE-05 | |
|---|---|
| **Use-case No.** | UC-05 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | Login with Google |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | Medium |
| **Actor** | Guest |
| **Summary** | A guest signs in through Google OAuth instead of using an email and password. |
| **Goal** | Shorten the registration and login process by reusing a verified Google account. |
| **Triggers** | Guest clicks the "Đăng nhập với Google" button on the login or registration screen. |
| **Preconditions** | The guest owns a Google account whose email has been verified by Google. |
| **Post Conditions** | The account is created or linked automatically, marked as verified, and a JWT token is issued. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | Guest clicks "Đăng nhập với Google" | Open the Google authentication window |
| 2 | Guest selects a Google account and grants permission | Receive the Google credential and verify the ID token |
| 3 | | Look up an existing account by `googleId`, then by email |
| 4 | | Link the `googleId` to the existing account, or create a new account if none exists |
| 5 | | Set `verificationStatus` to `verified` and copy the Google avatar if the user has none |
| 6 | | Issue a JWT token and log the user in |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 4a | The email already has a password account; the system links both login methods to the same account | UC-04 Login |
| 6a | The Google-created account later needs a password for normal login | UC-07 Forgot Password |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 400 | Thiếu Google credential | The request does not include a credential |
| 401 | Google token không hợp lệ | The ID token cannot be verified against Google |
| 401 | Email Google chưa được xác thực | Google reports `email_verified = false` |
| 403 | Tài khoản đã bị khóa do vi phạm | `accountStatus` is `banned` |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-17 | An account signing in through Google is treated as verified and skips the OTP step. |
| BR-18 | If the Google email matches an existing account, the two login methods are linked instead of creating a duplicate account. |
| BR-19 | An account created through Google has no password and must use Forgot Password to set one. |

---

## 3.6. Logout

**Table III.6: Shows the Logout feature description**

| USE CASE-06 | |
|---|---|
| **Use-case No.** | UC-06 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | Logout |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | Medium |
| **Actor** | User, Admin, Shipper |
| **Summary** | The actor ends the current session and leaves the system. |
| **Goal** | Protect the account when the user finishes working, especially on a shared device. |
| **Triggers** | Actor clicks "Đăng xuất" in the account dropdown menu. |
| **Preconditions** | The actor is logged in and holds a valid JWT token. |
| **Post Conditions** | The token and user state are cleared from the client; protected pages become inaccessible. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | Actor opens the account menu on the navigation bar | Display the menu with the "Đăng xuất" option |
| 2 | Actor clicks "Đăng xuất" | Remove the JWT token from local storage |
| 3 | | Clear the authentication context and disconnect the socket |
| 4 | | Redirect the actor to the home page in guest mode |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 4a | Actor logs in again with another account | UC-04 Login |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 401 | Phiên đăng nhập đã hết hạn | The token has expired before the actor logs out; the client clears the state and redirects to the login page |

**Business Rules**

| Code | Rule |
|---|---|
| BR-20 | Authentication is stateless with JWT, so logging out only clears the token on the client side. |
| BR-21 | An issued token remains technically valid until it expires; the system does not maintain a blacklist. |

---

## 3.7. Forgot Password

**Table III.7: Shows the Forgot Password feature description**

| USE CASE-07 | |
|---|---|
| **Use-case No.** | UC-07 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | Forgot Password |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | High |
| **Actor** | Guest |
| **Summary** | A guest who has forgotten the password requests an OTP code to reset it. |
| **Goal** | Help the user regain access to the account without support intervention. |
| **Triggers** | Guest clicks "Quên mật khẩu" on the login screen. |
| **Preconditions** | The email exists in the system and the 60-second cooldown has elapsed. |
| **Post Conditions** | An OTP code with purpose `reset` is sent to the email and is valid for 10 minutes. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | Guest clicks "Quên mật khẩu" on the login screen | Display the email input form |
| 2 | Guest enters the registered email and submits | Normalize the email and verify that the account exists |
| 3 | | Check the remaining resend cooldown |
| 4 | | Generate an OTP with purpose `reset` and send it by email |
| 5 | | Redirect the guest to the password reset screen |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 5a | Guest enters the OTP and the new password | UC-08 Reset Password |
| 2a | Guest remembers the password and returns to the login screen | UC-04 Login |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 404 | Email không tồn tại trong hệ thống | No account matches the submitted email |
| 429 | Vui lòng đợi {n}s trước khi gửi lại OTP | The request is made before the 60-second cooldown ends |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-22 | The reset OTP is stored separately from the registration OTP, so the two flows do not interfere with each other. |
| BR-23 | Requesting a reset OTP does not change the current password until the reset is completed. |

---

## 3.8. Reset Password

**Table III.8: Shows the Reset Password feature description**

| USE CASE-08 | |
|---|---|
| **Use-case No.** | UC-08 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | Reset Password |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | High |
| **Actor** | Guest |
| **Summary** | A guest sets a new password after verifying the OTP code sent to the email. |
| **Goal** | Restore access to the account with a new password. |
| **Triggers** | Guest submits the OTP code and the new password on the password reset screen. |
| **Preconditions** | A valid `reset` OTP has been issued and has not expired. |
| **Post Conditions** | The password is replaced by the new hashed value and the OTP is destroyed. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | Guest opens the password reset screen | Display the OTP and new password form |
| 2 | Guest enters the OTP code and the new password | Validate that all fields are filled in |
| 3 | Guest clicks "Đặt lại mật khẩu" | Verify the OTP, its expiry, and the failed-attempt count |
| 4 | | Hash the new password and update the account |
| 5 | | Destroy the OTP and redirect the guest to the login screen |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 3a | The OTP has expired; guest requests a new code | UC-07 Forgot Password |
| 5a | Guest logs in with the new password | UC-04 Login |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 400 | Vui lòng điền đầy đủ thông tin | Email, OTP, or new password is empty |
| 400 | OTP không hợp lệ hoặc đã hết hạn | The OTP does not exist or has passed its 10-minute lifetime |
| 400 | Mã OTP không đúng. Bạn còn {n} lần thử. | Wrong OTP code, with the number of remaining attempts |
| 400 | Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới. | Five wrong attempts reached; the OTP is destroyed |
| 404 | Không tìm thấy tài khoản | No account matches the submitted email |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-24 | The new password is hashed by the model middleware before being stored. |
| BR-25 | Resetting the password does not log the user in automatically; a fresh login is required. |
| BR-26 | This flow also allows a Google-created account to set its first password. |

---

## 3.9. Change Password

**Table III.9: Shows the Change Password feature description**

| USE CASE-09 | |
|---|---|
| **Use-case No.** | UC-09 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | Change Password |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | Medium |
| **Actor** | User, Admin, Shipper |
| **Summary** | A logged-in actor changes the account password by confirming the current one. |
| **Goal** | Let the actor keep the account secure without going through the email reset flow. |
| **Triggers** | Actor opens the "Đổi mật khẩu" tab in the account settings page. |
| **Preconditions** | The actor is logged in and knows the current password. |
| **Post Conditions** | The password is replaced by the new hashed value; the current token remains valid. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | Actor opens the "Đổi mật khẩu" tab | Display the current and new password form |
| 2 | Actor enters the current password and the new password | Validate that both fields are filled in |
| 3 | Actor clicks "Xác nhận" | Load the account and compare the current password with the stored hash |
| 4 | | Hash the new password and update the account |
| 5 | | Display a success message |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 3a | Actor does not remember the current password and uses the email flow instead | UC-07 Forgot Password |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 400 | Vui lòng điền đầy đủ thông tin | Current or new password field is empty |
| 400 | Mật khẩu hiện tại không đúng | The current password does not match the stored hash |
| 401 | Không có quyền truy cập | The request has no valid token |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-27 | The current password must be confirmed before the new one is accepted. |
| BR-28 | Changing the password does not invalidate the current JWT token. |

---

## 3.10. View My Profile

**Table III.10: Shows the View My Profile feature description**

| USE CASE-10 | |
|---|---|
| **Use-case No.** | UC-10 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | View My Profile |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | High |
| **Actor** | User, Admin, Shipper |
| **Summary** | The actor views their own account information and current status on the system. |
| **Goal** | Let the actor check personal data, role, reputation score, and Pro status. |
| **Triggers** | Actor clicks their avatar on the navigation bar and selects "Trang cá nhân". |
| **Preconditions** | The actor is logged in with a valid token. |
| **Post Conditions** | Personal information is displayed; no data is modified. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | Actor selects "Trang cá nhân" from the account menu | Verify the token and identify the current user |
| 2 | | Load the account record from the database |
| 3 | | Build the address list, defaulting from name, phone, and address when empty |
| 4 | | Compute the Pro status from `proExpiresAt` |
| 5 | | Display full name, email, phone, avatar, date of birth, gender, address list, role, reputation score, and Pro status |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 5a | Actor edits the displayed information | UC-11 Update Profile |
| 5b | Actor checks the remaining number of free posts | UC-82 Check Pro Status |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 401 | Không có quyền truy cập | The request has no valid token or the token has expired |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-29 | The password hash is never returned in any profile response. |
| BR-30 | Pro status is derived at read time by comparing `proExpiresAt` with the current time, not stored as a flag. |
| BR-31 | When the address list is empty, the system generates a default address from the name, phone, and address fields. |

---

## 3.11. Update Profile

**Table III.11: Shows the Update Profile feature description**

| USE CASE-11 | |
|---|---|
| **Use-case No.** | UC-11 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | Update Profile |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | High |
| **Actor** | User |
| **Summary** | The user updates personal information and the delivery address list. |
| **Goal** | Keep contact and delivery information accurate for transactions. |
| **Triggers** | User clicks "Chỉnh sửa" on the personal profile page. |
| **Preconditions** | The user is logged in with a valid token. |
| **Post Conditions** | The account record is updated and exactly one address is marked as the default. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | User clicks "Chỉnh sửa" on the profile page | Display the editable form pre-filled with current data |
| 2 | User updates the name, phone, address, avatar, date of birth, or gender | Validate the input on the client side |
| 3 | User adds, edits, or removes entries in the address list | Allow marking one address as the default |
| 4 | User clicks "Lưu" | Normalize the address list and remove empty entries |
| 5 | | Ensure exactly one address carries the default flag |
| 6 | | Update the record and return the new profile |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 2a | User uploads a new avatar image | UC-24 Upload Product Media |
| 6a | User wants to change the password instead of the profile | UC-09 Change Password |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 401 | Không có quyền truy cập | The request has no valid token |
| 500 | Lỗi máy chủ | Schema validation fails or a database error occurs |

**Business Rules**

| Code | Rule |
|---|---|
| BR-32 | Only fields present in the request are updated; omitted fields keep their current values. |
| BR-33 | Address entries that are entirely empty are removed from the list. |
| BR-34 | Exactly one address must be the default; if none is marked, the first entry becomes the default. |
| BR-35 | The default address is synchronized back into the main `address` field of the account. |
| BR-36 | Email and role cannot be changed by the user through this use case. |

---

## 3.12. View Public Profile

**Table III.12: Shows the View Public Profile feature description**

| USE CASE-12 | |
|---|---|
| **Use-case No.** | UC-12 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | View Public Profile |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | Medium |
| **Actor** | Guest, User |
| **Summary** | An actor views the public profile of another user before transacting with them. |
| **Goal** | Provide enough public information for the actor to judge the trustworthiness of a partner. |
| **Triggers** | Actor clicks the seller's name or avatar on a product detail page. |
| **Preconditions** | The target account exists in the system. |
| **Post Conditions** | Public information is displayed; private data remains hidden. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | Actor clicks the seller's name on a product detail page | Read the user identifier from the URL |
| 2 | | Load the account and select only the public fields |
| 3 | | Display full name, avatar, reputation score, role, and account status |
| 4 | | Display the seller's listings and the reviews they have received |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 4a | Actor reads the detailed reviews of this seller | UC-63 View Reviews |
| 4b | Actor starts a conversation with the seller | UC-70 Chat with Seller |
| 4c | Actor reports the seller for a violation | UC-65 Report Violation |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 404 | Không tìm thấy người dùng | No account matches the requested identifier |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-37 | Only full name, email, avatar, reputation score, account status, and role are exposed publicly. |
| BR-38 | Phone number, address, and date of birth are never exposed on a public profile. |
| BR-39 | This use case does not require authentication and is accessible to guests. |

---

## 3.13. View My Reputation Score

**Table III.13: Shows the View My Reputation Score feature description**

| USE CASE-13 | |
|---|---|
| **Use-case No.** | UC-13 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | View My Reputation Score |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | Medium |
| **Actor** | User |
| **Summary** | The user views their current reputation score and the history of every change. |
| **Goal** | Help the user understand why the score changed and avoid being banned. |
| **Triggers** | User opens the "Điểm uy tín" section on the personal profile page. |
| **Preconditions** | The user is logged in with a valid token. |
| **Post Conditions** | The score and its change history are displayed. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | User opens the "Điểm uy tín" section | Verify the token and identify the current user |
| 2 | | Load the current reputation score of the account |
| 3 | | Load the reputation change log sorted from newest to oldest |
| 4 | | Display the score together with the reason, the amount, and the time of each change |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 4a | User disagrees with a deduction and contacts support | UC-73 Contact Admin Support |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 401 | Không có quyền truy cập | The request has no valid token |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-40 | Every account starts with 100 reputation points. |
| BR-41 | Each change is written to the reputation log with a reason, an amount, and the acting administrator. |
| BR-42 | When the score reaches 0 the account is banned automatically and can no longer log in. |

---

## 3.14. View User Reputation Score

**Table III.14: Shows the View User Reputation Score feature description**

| USE CASE-14 | |
|---|---|
| **Use-case No.** | UC-14 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | View User Reputation Score |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | Low |
| **Actor** | Guest, User |
| **Summary** | An actor views the public reputation score of another user before transacting. |
| **Goal** | Reduce transaction risk by exposing the trust level of the partner. |
| **Triggers** | Actor views a product detail page or a public profile page. |
| **Preconditions** | The target account exists in the system. |
| **Post Conditions** | The reputation score is displayed next to the user's name. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | Actor opens a product detail page | Read the identifier of the post owner |
| 2 | | Load the reputation score of that account |
| 3 | | Display the score next to the seller's name and avatar |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 3a | Actor opens the full public profile of the seller | UC-12 View Public Profile |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 404 | Không tìm thấy người dùng | No account matches the requested identifier |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-43 | Only the numeric score is public; the detailed deduction history is visible to the owner and administrators. |

---

## 3.15. View Pro Plans

**Table III.15: Shows the View Pro Plans feature description**

| USE CASE-15 | |
|---|---|
| **Use-case No.** | UC-78 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | View Pro Plans |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | Medium |
| **Actor** | User |
| **Summary** | The user views the available Pro subscription plans with their duration and price. |
| **Goal** | Give the user enough information to choose a suitable plan. |
| **Triggers** | User clicks "Nâng cấp Pro" on the navigation bar, or hits the free-post limit. |
| **Preconditions** | None; the plan list is public. |
| **Post Conditions** | The three plans and their prices are displayed. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | User clicks "Nâng cấp Pro" | Load the plan list from the business rules configuration |
| 2 | | Display three plans: 1 month for 50,000 VND, 3 months for 120,000 VND, and 12 months for 400,000 VND |
| 3 | | Display the Pro benefits: unlimited posts and up to 3 featured products |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 3a | User selects a plan and proceeds to payment | UC-79 Upgrade to Pro |
| 3b | User checks the current status before buying | UC-82 Check Pro Status |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 500 | Lỗi máy chủ | Unexpected server error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-44 | Three plans are offered: 30 days for 50,000 VND, 90 days for 120,000 VND, and 365 days for 400,000 VND. |
| BR-45 | Plan prices and durations are defined centrally in the business rules module, not hard-coded in the interface. |

---

## 3.16. Upgrade to Pro

**Table III.16: Shows the Upgrade to Pro feature description**

| USE CASE-16 | |
|---|---|
| **Use-case No.** | UC-79 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | Upgrade to Pro |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | High |
| **Actor** | User |
| **Summary** | The user pays for a Pro subscription through the VNPay gateway to remove the free-post limit. |
| **Goal** | Let the user become a Pro member and post listings without limit. |
| **Triggers** | User selects a plan and clicks "Thanh toán" on the Pro plans page. |
| **Preconditions** | The user is logged in and has selected a valid plan. |
| **Post Conditions** | A subscription record is created with status `pending` and the user is redirected to the VNPay payment page. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | User selects a plan on the Pro plans page | Highlight the selected plan and its price |
| 2 | User clicks "Thanh toán" | Validate that the plan exists in the configuration |
| 3 | | Generate a unique transaction reference and create a subscription record with status `pending` |
| 4 | | Read the client IP address and build a signed VNPay payment URL |
| 5 | | Redirect the user to the VNPay payment page |
| 6 | User completes the payment on VNPay | VNPay redirects back to the system return URL |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 6a | The system processes the payment result returned by VNPay | UC-80 View Payment Result |
| 6b | User cancels on the VNPay page; the subscription record stays `pending` | UC-78 View Pro Plans |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 400 | Gói Pro không hợp lệ | The submitted plan does not exist in the configuration |
| 401 | Không có quyền truy cập | The request has no valid token |
| 500 | Lỗi máy chủ | Unexpected server error or failure to build the payment URL |

**Business Rules**

| Code | Rule |
|---|---|
| BR-46 | Each payment attempt creates a separate subscription record with a unique transaction reference. |
| BR-47 | The subscription record is created before redirecting to VNPay so the result can be reconciled later. |
| BR-48 | The payment amount is taken from the server-side configuration, never from the client request. |
| BR-49 | A local IPv6 address is converted to `127.0.0.1` because VNPay only accepts IPv4. |

---

## 3.17. View Payment Result

**Table III.17: Shows the View Payment Result feature description**

| USE CASE-17 | |
|---|---|
| **Use-case No.** | UC-80 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | View Payment Result |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | High |
| **Actor** | User, System |
| **Summary** | The system verifies the result returned by VNPay and activates the Pro subscription when the payment succeeds. |
| **Goal** | Guarantee that the Pro period is granted only for genuinely successful payments. |
| **Triggers** | VNPay redirects the user back to the system return URL after the payment. |
| **Preconditions** | A subscription record with the matching transaction reference exists with status `pending`. |
| **Post Conditions** | On success the subscription becomes `paid`, `proExpiresAt` is extended, and the user is redirected to the featured product setup page. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | VNPay redirects the user back with the payment parameters | Verify the secure hash of the returned data |
| 2 | | Look up the subscription record by transaction reference |
| 3 | | Check the response code, the transaction status, and that the amount matches the plan |
| 4 | | Compute the new expiry date, stacking on top of any remaining Pro period |
| 5 | | Mark the subscription as `paid` and update `proExpiresAt` on the account |
| 6 | | Reset the featured product setup flag and redirect the user to the featured product selection page |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 2a | The subscription is already `paid` because the page was refreshed; the system redirects without granting the period twice | UC-83 Set Featured Products |
| 6a | User selects the products to be featured | UC-83 Set Featured Products |
| 3a | The payment failed and the user returns to the plans page to retry | UC-79 Upgrade to Pro |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| Redirect `?status=failed` | Thanh toán thất bại | The signature is invalid, meaning the data may have been tampered with |
| Redirect `?status=failed` | Thanh toán thất bại | No subscription matches the transaction reference |
| Redirect `?status=failed` | Thanh toán thất bại | The response code or transaction status is not `00`, or the amount does not match |
| Redirect `?status=failed` | Thanh toán thất bại | The account attached to the subscription no longer exists |

**Business Rules**

| Code | Rule |
|---|---|
| BR-50 | The returned data must pass secure hash verification before any account change is applied. |
| BR-51 | A payment is accepted only when the response code and the transaction status are both `00` and the amount matches the plan exactly. |
| BR-52 | The flow is idempotent: an already-paid subscription is not granted a second time when the page is refreshed. |
| BR-53 | A new Pro period stacks on top of the remaining period instead of overwriting it. |
| BR-54 | After a successful upgrade the featured product setup flag is reset so the user is prompted to choose again. |

---

## 3.18. View My Subscriptions

**Table III.18: Shows the View My Subscriptions feature description**

| USE CASE-18 | |
|---|---|
| **Use-case No.** | UC-81 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | View My Subscriptions |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | Low |
| **Actor** | User |
| **Summary** | The user views the history of every Pro subscription purchase they have made. |
| **Goal** | Let the user track spending and verify past transactions. |
| **Triggers** | User opens the "Lịch sử gói Pro" tab in the account settings page. |
| **Preconditions** | The user is logged in with a valid token. |
| **Post Conditions** | The purchase history is displayed, sorted from newest to oldest. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | User opens the "Lịch sử gói Pro" tab | Verify the token and identify the current user |
| 2 | | Load every subscription record belonging to the account |
| 3 | | Sort the records from newest to oldest |
| 4 | | Display the plan, amount, status, start date, and expiry date of each record |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 4a | User buys an additional plan to extend the period | UC-79 Upgrade to Pro |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 401 | Không có quyền truy cập | The request has no valid token |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-55 | The user can only see their own subscription records. |
| BR-56 | Failed and pending records are kept in the history for reconciliation purposes. |

---

## 3.19. Check Pro Status

**Table III.19: Shows the Check Pro Status feature description**

| USE CASE-19 | |
|---|---|
| **Use-case No.** | UC-82 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | Check Pro Status |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | Medium |
| **Actor** | User |
| **Summary** | The user checks the current Pro status, the expiry date, and the number of free posts remaining. |
| **Goal** | Let the user know when to renew and how many listings they can still create. |
| **Triggers** | User opens the Pro page, the personal profile page, or attempts to create a new listing. |
| **Preconditions** | The user is logged in with a valid token. |
| **Post Conditions** | The status information is displayed; no data is modified. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | User opens the Pro page | Verify the token and identify the current user |
| 2 | | Compare `proExpiresAt` with the current time to determine the Pro status |
| 3 | | Count the listings currently in pending, approved, or available state |
| 4 | | Compute the remaining free posts for a non-Pro account |
| 5 | | Display the Pro status, the expiry date, the free-post limit, and the remaining quota |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 5a | The free quota is exhausted and the user upgrades | UC-79 Upgrade to Pro |
| 5b | The account is Pro, so the user proceeds to create a listing without limit | UC-22 Create Sale Post |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 401 | Không có quyền truy cập | The request has no valid token |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-57 | A non-Pro account may keep at most 5 active listings at the same time. |
| BR-58 | Only listings in pending, approved, or available state count towards the quota; sold and hidden listings do not. |
| BR-59 | A Pro account has no post limit, so the remaining quota is returned as null. |
| BR-60 | Pro status is computed at read time and expires automatically without a scheduled job. |

---

## 3.20. Set Featured Products

**Table III.20: Shows the Set Featured Products feature description**

| USE CASE-20 | |
|---|---|
| **Use-case No.** | UC-83 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | Set Featured Products |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | Medium |
| **Actor** | User |
| **Summary** | A Pro user selects the listings to be highlighted on the platform. |
| **Goal** | Give Pro members better visibility for their most important listings. |
| **Triggers** | The system redirects the user here after a successful upgrade, or the user opens the featured products page. |
| **Preconditions** | The user is logged in and holds an active Pro subscription. |
| **Post Conditions** | The selected listings are marked as featured and the setup flag is set. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | User opens the featured products page | Verify the token and the Pro status |
| 2 | | Load the user's listings and the current featured selection |
| 3 | User selects the listings to highlight | Enforce the maximum of 3 featured products |
| 4 | User clicks "Lưu" | Update the featured flag on the selected listings |
| 5 | | Mark the featured setup as completed and display a success message |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 1a | The Pro period has expired, so the user is asked to renew | UC-79 Upgrade to Pro |
| 3a | The user has no listing yet and creates one first | UC-22 Create Sale Post |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 401 | Không có quyền truy cập | The request has no valid token |
| 403 | Tính năng dành riêng cho tài khoản Pro | The account is not Pro or the Pro period has expired |
| 400 | Vượt quá số sản phẩm nổi bật cho phép | More than 3 listings are selected |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-61 | Only an account with an active Pro period may set featured products. |
| BR-62 | A maximum of 3 listings can be featured at the same time. |
| BR-63 | Only listings owned by the requesting user can be selected. |

---

## 3.21. View Featured Setup Reminder

**Table III.21: Shows the View Featured Setup Reminder feature description**

| USE CASE-21 | |
|---|---|
| **Use-case No.** | UC-84 |
| **Use-case Version** | 1.0 |
| **Use-case Name** | View Featured Setup Reminder |
| **Author** | LongTNP |
| **Date** | 19/07/2026 |
| **Priority** | Low |
| **Actor** | User |
| **Summary** | A Pro user receives a reminder to select featured products, and may dismiss it once the setup is done. |
| **Goal** | Make sure newly upgraded Pro members actually use the benefit they paid for. |
| **Triggers** | The user logs in, or the interface polls the reminder endpoint. |
| **Preconditions** | The user is logged in and holds an active Pro subscription. |
| **Post Conditions** | The reminder is displayed, or permanently dismissed once the setup flag is set. |

**Main Success Scenario**

| Step | Actor Event | System response |
|---|---|---|
| 1 | User logs into the system | Compute the Pro status and read the featured setup flag |
| 2 | | Determine that the reminder should be shown when the account is Pro and the setup is not done |
| 3 | | Display a banner inviting the user to select featured products |
| 4 | User clicks "Bỏ qua" or completes the setup | Set the featured setup flag to true |
| 5 | | Stop showing the reminder in later sessions |

**Alternative Scenario**

| Step | Action | Use case |
|---|---|---|
| 3a | User clicks the banner and goes to the selection page | UC-83 Set Featured Products |

**Exceptions**

| Exception code | Message | Caught |
|---|---|---|
| 401 | Không có quyền truy cập | The request has no valid token |
| 500 | Lỗi máy chủ | Unexpected server or database error |

**Business Rules**

| Code | Rule |
|---|---|
| BR-64 | The reminder is shown only when the account is Pro and has not completed the featured setup. |
| BR-65 | The setup flag is reset to false after every successful upgrade, so a renewing member is prompted again. |

---

## Tổng hợp

| Nhóm | Use case | Số bảng |
|---|---|---|
| Authentication | UC-01 → UC-09 | 9 |
| Profile Management | UC-10 → UC-12 | 3 |
| Reputation | UC-13, UC-14 | 2 |
| Pro Subscription | UC-78 → UC-82 | 5 |
| Featured Products | UC-83, UC-84 | 2 |
| **Tổng** | | **21** |

### Màn hình cần làm

| Màn hình | Use case liên quan |
|---|---|
| Đăng ký | UC-01 |
| Xác thực OTP | UC-02, UC-03 |
| Đăng nhập | UC-04, UC-05 |
| Quên mật khẩu | UC-07 |
| Đặt lại mật khẩu | UC-08 |
| Trang cá nhân | UC-10, UC-13 |
| Chỉnh sửa thông tin | UC-11 |
| Đổi mật khẩu | UC-09 |
| Hồ sơ công khai người bán | UC-12, UC-14 |
| Bảng giá gói Pro | UC-78, UC-79 |
| Kết quả thanh toán | UC-80 |
| Lịch sử gói Pro | UC-81, UC-82 |
| Chọn sản phẩm nổi bật | UC-83, UC-84 |
