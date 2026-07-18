# Giải Pháp: Featured Products cho Pro Users

## 📊 Phân Tích Hiện Trạng

### ✅ Những gì ĐÃ CÓ (không cần thay đổi)

#### 1. **User Model** (`backend/src/models/user.model.js`)
```javascript
{
  proExpiresAt: Date,  // ✅ Đã có - track Pro status
  // Các field khác...
}
```

#### 2. **Business Rules** (`backend/src/utils/business-rules.js`)
```javascript
const FREE_POST_LIMIT = 5;  // ✅ Đã có - giới hạn 5 bài cho user thường
const isUserPro = (user) => {  // ✅ Đã có - check Pro status
  return !!(user?.proExpiresAt && new Date(user.proExpiresAt) > Date.now());
};
```

#### 3. **Subscription System**
- ✅ VNPay payment integration hoàn chỉnh
- ✅ Controller: `subscription.controller.js`
- ✅ Routes: `/api/subscriptions/*`
- ✅ Model: `pro_subscription.model.js`

#### 4. **Product Controller** - Đã có logic kiểm tra limit
```javascript
// Trong createProduct()
if (!isUserPro(req.user)) {
  const activePosts = await ProductPost.countDocuments({
    ownerId: req.user._id,
    postStatus: { $in: ["pending", "approved", "available"] },
  });
  if (activePosts >= FREE_POST_LIMIT) {
    return res.status(403).json({
      message: `Đã đạt giới hạn ${FREE_POST_LIMIT} bài đăng...`
    });
  }
}
```

---

## 🎯 Yêu Cầu Mới (Updated)

### 1. **Phân biệt User thường vs Pro**
- ✅ **ĐÃ CÓ**: Dùng `proExpiresAt` field và `isUserPro()` function
- ❌ **KHÔNG CẦN** thêm field `status` mới

### 2. **Giới hạn bài đăng**
- ✅ **ĐÃ CÓ**: User thường = 5 bài/tháng
- ✅ **ĐÃ CÓ**: Pro user = unlimited
- ⚠️ **CẦN KIỂM TRA**: Logic "1 tháng" hay "active posts"?

### 3. **Featured Products System - FLOW MỚI**
- ✅ Sau khi mua Pro → Navigate ngay đến trang chọn featured
- ✅ Có thể chọn sản phẩm cũ (đã được duyệt)
- ✅ Có thể tạo sản phẩm mới ngay trên trang featured
- ✅ Sản phẩm mới vẫn phải qua admin duyệt
- ✅ Nếu user thoát trước khi chọn featured → hiện reminder khi đăng nhập lại
- ✅ Click vào reminder → navigate đến trang chọn featured
- ✅ Sản phẩm featured hiện trên đầu trang chủ/marketplace

---

## 🔧 Giải Pháp Đề Xuất

### Phase 1: Database Schema Updates

#### A. Product Post Model
**File**: `backend/src/models/product_post.model.js`

**Thêm fields mới:**
```javascript
{
  // ... existing fields ...
  
  isFeatured: {
    type: Boolean,
    default: false,
  },
  featuredAt: {
    type: Date,
    default: null,
  }
}
```

**Lý do:**
- `isFeatured`: Đánh dấu sản phẩm nổi bật
- `featuredAt`: Track thời gian set featured (để sort)

#### B. User Model - Thêm tracking cho Featured Setup
**File**: `backend/src/models/user.model.js`

**Thêm field mới:**
```javascript
{
  // ... existing fields ...
  
  hasSetupFeaturedProducts: {
    type: Boolean,
    default: false,
  }
}
```

**Lý do:**
- Track xem user Pro đã setup featured products chưa
- Dùng để hiển thị reminder notification khi login
- Set `true` sau khi user submit/skip lần đầu

#### C. Business Rules Constants
**File**: `backend/src/utils/business-rules.js`

**Thêm constant:**
```javascript
const MAX_FEATURED_PRODUCTS = 3;
```

**Export:**
```javascript
module.exports = {
  // ... existing exports ...
  MAX_FEATURED_PRODUCTS,
};
```

---

### Phase 2: Backend API Updates

#### A. Product Controller - Featured Management
**File**: `backend/src/controllers/product.controller.js`

**1. Thêm function `setFeaturedProducts`:**
```javascript
const setFeaturedProducts = async (req, res) => {
  try {
    const { productIds } = req.body; // Array of product IDs
    
    // 1. Kiểm tra Pro status
    if (!isUserPro(req.user)) {
      return res.status(403).json({
        success: false,
        message: "Chỉ tài khoản Pro mới có thể đặt sản phẩm nổi bật"
      });
    }
    
    // 2. Validate số lượng
    if (!Array.isArray(productIds) || productIds.length > MAX_FEATURED_PRODUCTS) {
      return res.status(400).json({
        success: false,
        message: `Chỉ được chọn tối đa ${MAX_FEATURED_PRODUCTS} sản phẩm nổi bật`
      });
    }
    
    // 3. Kiểm tra ownership - cho phép cả pending products
    const products = await ProductPost.find({
      _id: { $in: productIds },
      ownerId: req.user._id,
      postStatus: { $in: ["pending", "approved", "available"] } // ⭐ Cho phép pending
    });
    
    if (products.length !== productIds.length) {
      return res.status(400).json({
        success: false,
        message: "Một số sản phẩm không tồn tại, không thuộc về bạn, hoặc đã bị từ chối"
      });
    }
    
    // 4. Reset tất cả featured của user
    await ProductPost.updateMany(
      { ownerId: req.user._id },
      { isFeatured: false, featuredAt: null }
    );
    
    // 5. Set featured cho products được chọn
    await ProductPost.updateMany(
      { _id: { $in: productIds } },
      { isFeatured: true, featuredAt: new Date() }
    );
    
    // 6. ⭐ Mark user đã setup featured
    await User.findByIdAndUpdate(req.user._id, {
      hasSetupFeaturedProducts: true
    });
    
    res.json({
      success: true,
      message: "Đã cập nhật sản phẩm nổi bật thành công"
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**2. Thêm function `getFeaturedProducts`:**
```javascript
const getFeaturedProducts = async (req, res) => {
  try {
    const featuredProducts = await ProductPost.find({
      ownerId: req.user._id,
      isFeatured: true
    })
    .populate("categoryId", "name icon")
    .sort({ featuredAt: -1 })
    .lean();
    
    await attachImagesToProducts(featuredProducts);
    
    res.json({
      success: true,
      data: {
        featured: featuredProducts,
        maxAllowed: MAX_FEATURED_PRODUCTS,
        canSetMore: isUserPro(req.user) && featuredProducts.length < MAX_FEATURED_PRODUCTS
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**3. Update `getProducts` - Sorting Logic:**
```javascript
// Trong getProducts(), sau khi populate
const nowMs = Date.now();
for (const p of products) {
  p.ownerIsPro = !!(p.ownerId?.proExpiresAt && new Date(p.ownerId.proExpiresAt).getTime() > nowMs);
}

// ⭐ Sort priority: Featured first, then Pro owners' posts
products.sort((a, b) => {
  // 1st priority: Featured products
  if (a.isFeatured !== b.isFeatured) {
    return b.isFeatured - a.isFeatured;
  }
  // 2nd priority: Pro owner products
  return Number(b.ownerIsPro) - Number(a.ownerIsPro);
});
```

**4. Export functions:**
```javascript
module.exports = {
  // ... existing exports ...
  setFeaturedProducts,
  getFeaturedProducts,
};
```

#### B. Product Routes
**File**: `backend/src/routes/product.routes.js`

**Thêm routes:**
```javascript
// Trong phần authenticated routes
router.get("/my-products/featured", auth, getFeaturedProducts);
router.post("/my-products/featured", auth, setFeaturedProducts);
```

---

### Phase 3: Subscription Flow Update

#### A. Subscription Controller
**File**: `backend/src/controllers/subscription.controller.js`

**Update `vnpayReturn` function:**
```javascript
const vnpayReturn = async (req, res) => {
  // ... existing validation code ...
  
  if (paidOk) {
    // ... existing save code ...
    
    const now = new Date();
    const newExpiry = computeProExpiry(user.proExpiresAt, sub.durationDays, now);
    
    user.proExpiresAt = newExpiry;
    // ⭐ Reset setup flag để hiển thị reminder nếu chưa setup
    user.hasSetupFeaturedProducts = false;
    await user.save();
    
    // ⭐ Redirect to featured selection page
    return res.redirect(`${CLIENT_URL}/goi-pro/chon-san-pham-noi-bat`);
  }
  
  // ... error cases redirect to failed ...
};
```

#### B. Auth Controller - Thêm Featured Reminder Check
**File**: `backend/src/controllers/auth.controller.js`

**Thêm function `checkFeaturedReminder`:**
```javascript
const checkFeaturedReminder = async (req, res) => {
  try {
    const user = req.user;
    const isPro = isUserPro(user);
    const shouldShowReminder = isPro && !user.hasSetupFeaturedProducts;
    
    res.json({
      success: true,
      data: {
        shouldShowReminder,
        isPro,
        hasSetupFeatured: user.hasSetupFeaturedProducts
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**Update login response để include reminder info:**
```javascript
const login = async (req, res) => {
  // ... existing login logic ...
  
  const user = await User.findOne({ email }).select("+passwordHash");
  // ... password check ...
  
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
  
  const isPro = isUserPro(user);
  const shouldShowFeaturedReminder = isPro && !user.hasSetupFeaturedProducts;
  
  res.json({
    success: true,
    token,
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      proExpiresAt: user.proExpiresAt,
      hasSetupFeaturedProducts: user.hasSetupFeaturedProducts
    },
    // ⭐ Thêm info về featured reminder
    featuredReminder: {
      shouldShow: shouldShowFeaturedReminder,
      message: shouldShowFeaturedReminder 
        ? "Bạn chưa chọn sản phẩm nổi bật. Chọn ngay để tăng hiệu quả bán hàng!"
        : null
    }
  });
};
```

#### C. Auth Routes
**File**: `backend/src/routes/auth.routes.js`

**Thêm route:**
```javascript
router.get("/featured-reminder", auth, checkFeaturedReminder);
```

---

### Phase 4: Frontend Implementation

#### A. Create Featured Products Selection Page (UPDATED)
**File**: `frontend/src/pages/user/SelectFeaturedProducts.jsx`

**Component structure với khả năng tạo sản phẩm mới:**
```jsx
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Plus } from "lucide-react";
import productService from "../../services/product.service";
import authService from "../../services/auth.service";

export default function SelectFeaturedProducts() {
  const navigate = useNavigate();
  const [myProducts, setMyProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const MAX_FEATURED = 3;
  
  useEffect(() => {
    loadMyProducts();
  }, []);
  
  const loadMyProducts = async () => {
    try {
      const res = await productService.getMyProducts();
      if (res.success) {
        // ⭐ Bao gồm cả pending products
        const eligibleProducts = res.data.filter(p => 
          ['pending', 'approved', 'available'].includes(p.postStatus)
        );
        setMyProducts(eligibleProducts);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleProduct = (productId) => {
    if (selectedIds.includes(productId)) {
      setSelectedIds(selectedIds.filter(id => id !== productId));
    } else {
      if (selectedIds.length < MAX_FEATURED) {
        setSelectedIds([...selectedIds, productId]);
      }
    }
  };
  
  const handleSubmit = async () => {
    try {
      // ⭐ Cho phép submit ngay cả khi chưa chọn gì (sẽ mark là đã setup)
      if (selectedIds.length > 0) {
        await productService.setFeaturedProducts(selectedIds);
      } else {
        // Mark đã setup nhưng không chọn featured nào
        await authService.markFeaturedSetupDone();
      }
      navigate("/goi-pro/ket-qua?status=success");
    } catch (error) {
      alert("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };
  
  const handleSkip = async () => {
    try {
      // ⭐ Mark đã skip để không hiện reminder nữa
      await authService.markFeaturedSetupDone();
      navigate("/");
    } catch (error) {
      navigate("/");
    }
  };
  
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 p-8">
        <h1 className="text-4xl font-bold mb-4">
          🎉 Chúc mừng bạn đã nâng cấp Pro!
        </h1>
        <div className="space-y-2 text-lg">
          <p>✓ Đăng bài không giới hạn</p>
          <p>✓ Chọn tối đa {MAX_FEATURED} sản phẩm nổi bật</p>
          <p>✓ Sản phẩm hiển thị ưu tiên trên trang chủ</p>
        </div>
      </div>

      {/* Info Box */}
      <div className="mb-6 rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
        <h2 className="font-bold text-lg mb-2">
          📌 Chọn tối đa {MAX_FEATURED} sản phẩm để làm nổi bật
        </h2>
        <p className="text-sm text-gray-700">
          Bạn có thể chọn sản phẩm hiện có hoặc tạo sản phẩm mới. 
          Sản phẩm mới sẽ phải chờ admin duyệt trước khi được featured.
        </p>
      </div>
      
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-lg">
            Đã chọn: {selectedIds.length}/{MAX_FEATURED}
          </span>
          {/* ⭐ Button tạo sản phẩm mới */}
          <Link
            to="/dang-tin?returnTo=/goi-pro/chon-san-pham-noi-bat"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <Plus className="h-5 w-5" />
            Tạo sản phẩm mới
          </Link>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${(selectedIds.length / MAX_FEATURED) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Products Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="h-12 w-12 mx-auto mb-4 animate-spin rounded-full border-4 border-green-500 border-t-transparent" />
            <p>Đang tải sản phẩm...</p>
          </div>
        </div>
      ) : myProducts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-bold mb-2">
            Bạn chưa có sản phẩm nào
          </h3>
          <p className="text-gray-600 mb-6">
            Tạo sản phẩm mới để bắt đầu bán hàng và chọn làm nổi bật
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/dang-tin"
              className="rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700"
            >
              Đăng sản phẩm ngay
            </Link>
            <button
              onClick={handleSkip}
              className="rounded-lg border-2 border-gray-300 px-6 py-3 hover:bg-gray-100"
            >
              Bỏ qua, chọn sau
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProducts.map((product) => {
              const isSelected = selectedIds.includes(product._id);
              const isPending = product.postStatus === 'pending';
              
              return (
                <div
                  key={product._id}
                  onClick={() => toggleProduct(product._id)}
                  className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    isSelected
                      ? "border-green-500 bg-green-50 shadow-lg"
                      : "border-gray-200 hover:border-green-300 hover:shadow-md"
                  }`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-white">
                      ⭐ #{selectedIds.indexOf(product._id) + 1}
                    </div>
                  )}
                  
                  {/* Pending Badge */}
                  {isPending && (
                    <div className="absolute top-2 left-2 z-10 rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-white">
                      ⏳ Chờ duyệt
                    </div>
                  )}
                  
                  {/* Image */}
                  <div className="relative mb-3 h-48 overflow-hidden rounded-lg bg-gray-100">
                    {product.thumbnailUrl ? (
                      <img
                        src={product.thumbnailUrl}
                        alt={product.title}
                        className={`h-full w-full object-cover ${
                          isSelected ? "opacity-90" : ""
                        }`}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        <span className="text-4xl">📦</span>
                      </div>
                    )}
                    
                    {/* Checkmark Overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/90">
                          <span className="text-3xl text-white">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2">
                    {product.title}
                  </h3>
                  <p className="text-red-600 font-bold text-xl mb-2">
                    {product.salePrice?.toLocaleString()} VNĐ
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📍 {product.location || "Chưa cập nhật"}</span>
                  </div>
                  
                  {/* Status Message */}
                  {isPending && (
                    <p className="mt-2 text-xs text-amber-600">
                      Sản phẩm sẽ được featured sau khi admin duyệt
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Action Buttons */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
            <div className="container mx-auto max-w-7xl px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                <button
                  onClick={handleSubmit}
                  className="w-full sm:w-auto rounded-lg bg-green-600 px-8 py-3 text-white font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✓ Xác nhận {selectedIds.length > 0 && `(${selectedIds.length} sản phẩm)`}
                </button>
                <button
                  onClick={handleSkip}
                  className="w-full sm:w-auto rounded-lg border-2 border-gray-300 px-8 py-3 hover:bg-gray-100"
                >
                  → Bỏ qua, chọn sau
                </button>
              </div>
            </div>
          </div>
          
          {/* Bottom padding to avoid fixed button overlap */}
          <div className="h-24" />
        </>
      )}
    </div>
  );
}
```

#### B. Featured Reminder Banner Component
**File**: `frontend/src/components/FeaturedReminderBanner.jsx`

**New component:**
```jsx
import { X, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function FeaturedReminderBanner({ onDismiss }) {
  const [isVisible, setIsVisible] = useState(true);
  
  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="relative bg-gradient-to-r from-yellow-50 to-amber-50 border-b-2 border-yellow-300">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400">
              <Star className="h-6 w-6 text-white fill-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                🎉 Bạn chưa chọn sản phẩm nổi bật!
              </h3>
              <p className="text-sm text-gray-700">
                Chọn ngay để sản phẩm của bạn hiển thị ưu tiên trên trang chủ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/goi-pro/chon-san-pham-noi-bat"
              className="whitespace-nowrap rounded-lg bg-yellow-400 px-6 py-2 font-semibold text-white hover:bg-yellow-500"
            >
              Chọn ngay
            </Link>
            <button
              onClick={handleDismiss}
              className="rounded-lg p-2 hover:bg-yellow-100"
              aria-label="Đóng"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

#### C. Update Main Layout để hiện Reminder
**File**: `frontend/src/components/ecotrade/EcoTradeLayout.jsx` hoặc `App.jsx`

**Thêm logic hiển thị banner:**
```jsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/auth.service";
import FeaturedReminderBanner from "../FeaturedReminderBanner";

export default function EcoTradeLayout({ children }) {
  const { user } = useAuth();
  const [showFeaturedReminder, setShowFeaturedReminder] = useState(false);
  
  useEffect(() => {
    checkFeaturedReminder();
  }, [user]);
  
  const checkFeaturedReminder = async () => {
    try {
      const res = await authService.checkFeaturedReminder();
      if (res.success && res.data.shouldShowReminder) {
        setShowFeaturedReminder(true);
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  return (
    <div>
      {showFeaturedReminder && (
        <FeaturedReminderBanner 
          onDismiss={() => setShowFeaturedReminder(false)} 
        />
      )}
      <div>{children}</div>
    </div>
  );
}
```

#### D. Auth Service Updates
**File**: `frontend/src/services/auth.service.js`

**Thêm methods:**
```javascript
const checkFeaturedReminder = async () => {
  const response = await api.get("/auth/featured-reminder");
  return response.data;
};

const markFeaturedSetupDone = async () => {
  const response = await api.post("/auth/mark-featured-done");
  return response.data;
};

export default {
  // ... existing methods ...
  checkFeaturedReminder,
  markFeaturedSetupDone,
};
```

#### E. Product Service Updates
**File**: `frontend/src/services/product.service.js`

**Thêm/Update methods:**
```javascript
const setFeaturedProducts = async (productIds) => {
  const response = await api.post("/products/my-products/featured", {
    productIds
  });
  return response.data;
};

const getFeaturedProducts = async () => {
  const response = await api.get("/products/my-products/featured");
  return response.data;
};

export default {
  // ... existing methods ...
  setFeaturedProducts,
  getFeaturedProducts,
};
```

#### F. App Routes
**File**: `frontend/src/App.jsx`

**Thêm route:**
```javascript
<Route
  path="/goi-pro/chon-san-pham-noi-bat"
  element={
    <PrivateRoute>
      <SelectFeaturedProducts />
    </PrivateRoute>
  }
/>

<Route
  path="/dang-tin"
  element={
    <PrivateRoute>
      <CreatePost />
    </PrivateRoute>
  }
/>
```

#### G. Update HomePage & Marketplace
**Hiển thị Featured badge:**
```jsx
{product.isFeatured && (
  <span className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">
    ⭐ NỔI BẬT
  </span>
)}

{product.ownerId?.proExpiresAt && (
  <span className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded text-xs font-bold">
    👑 PRO
  </span>
)}
```

---

## 🗄️ Database Migration

### Option 1: Auto Migration (Recommended)
Mongoose sẽ tự động thêm fields mới với giá trị default khi save documents.

### Option 2: Manual Migration Script
**File**: `backend/migrate-featured-products.js`

```javascript
const mongoose = require("mongoose");
const ProductPost = require("./src/models/product_post.model");
const User = require("./src/models/user.model");
require("dotenv").config();

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  console.log("Bắt đầu migration...");
  
  // 1. Update tất cả products chưa có isFeatured field
  const productResult = await ProductPost.updateMany(
    { isFeatured: { $exists: false } },
    { 
      $set: { 
        isFeatured: false,
        featuredAt: null
      }
    }
  );
  console.log(`✓ Đã cập nhật ${productResult.modifiedCount} products`);
  
  // 2. Update tất cả users chưa có hasSetupFeaturedProducts field
  const userResult = await User.updateMany(
    { hasSetupFeaturedProducts: { $exists: false } },
    {
      $set: {
        hasSetupFeaturedProducts: false
      }
    }
  );
  console.log(`✓ Đã cập nhật ${userResult.modifiedCount} users`);
  
  await mongoose.disconnect();
  console.log("Migration hoàn tất!");
}

migrate().catch(console.error);
```

**Chạy migration:**
```bash
node backend/migrate-featured-products.js
```

---

## 📝 Testing Checklist (UPDATED)

### Backend Tests
- [ ] User thường tạo post thứ 6 → bị từ chối
- [ ] Pro user tạo > 5 posts → thành công
- [ ] Pro user set 3 featured products → thành công
- [ ] Pro user set 4 featured products → bị từ chối
- [ ] User thường set featured → bị từ chối
- [ ] Set featured cho product không thuộc user → bị từ chối
- [ ] Set featured cho pending products → thành công
- [ ] Products được sort đúng (Featured > Pro > Normal)
- [ ] Login response include featured reminder info
- [ ] hasSetupFeaturedProducts được set đúng

### Frontend Tests
- [ ] Sau khi mua Pro → redirect đến trang chọn featured
- [ ] Trang chọn featured hiện cả pending + approved products
- [ ] Button "Tạo sản phẩm mới" hoạt động
- [ ] Tạo product mới → có query param returnTo
- [ ] Sau khi tạo xong → quay về trang chọn featured
- [ ] Chọn/bỏ chọn products hoạt động
- [ ] Không chọn quá 3 products
- [ ] Submit → hasSetupFeaturedProducts = true
- [ ] Skip → hasSetupFeaturedProducts = true
- [ ] Login lại → hiện reminder banner nếu chưa setup
- [ ] Click "Chọn ngay" trên banner → navigate đến trang featured
- [ ] Dismiss banner → ẩn banner (session only)
- [ ] Homepage hiển thị featured products trên đầu
- [ ] Marketplace hiển thị featured badge
- [ ] Pending products có badge "Chờ duyệt"

### Edge Cases
- [ ] User tạo product mới trên trang featured → reload để thấy product mới
- [ ] User chọn 3 pending products → tất cả đều được mark featured
- [ ] Admin duyệt pending product → tự động active featured
- [ ] User skip lần đầu → không hiện reminder nữa
- [ ] User Pro hết hạn → featured products không còn ưu tiên

---

## 🔄 Complete User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MUA GÓI PRO THÀNH CÔNG                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ↓
            [VNPay Payment Success]
                         │
                         ↓
        ┌────────────────┴────────────────┐
        │  Backend: vnpayReturn()         │
        │  - Update user.proExpiresAt     │
        │  - Set hasSetupFeaturedProducts │
        │    = false                      │
        │  - Redirect to featured page    │
        └────────────────┬────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────────┐
│         TRANG CHỌN SẢN PHẨM NỔI BẬT                           │
│  /goi-pro/chon-san-pham-noi-bat                               │
└────────────────────────┬───────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ↓                ↓                ↓
   [Chọn SP cũ]   [Tạo SP mới]      [Skip]
        │                │                │
        │                ↓                │
        │    /dang-tin?returnTo=/goi-pro │
        │    /chon-san-pham-noi-bat      │
        │                │                │
        │                ↓                │
        │    [Tạo product thành công]    │
        │                │                │
        │                ↓                │
        │    [Quay về featured page]     │
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ↓
              [Submit hoặc Skip]
                         │
                         ↓
        ┌────────────────┴────────────────┐
        │  hasSetupFeaturedProducts       │
        │  = true                         │
        └────────────────┬────────────────┘
                         │
                         ↓
            [Redirect về homepage]
                         │
                         │
┌────────────────────────┴───────────────────────────────────────┐
│              TRƯỜNG HỢP USER THOÁT TRƯỚC                       │
│           (chưa submit/skip featured)                          │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ↓
               [User logout/close]
                         │
                         ↓
            [hasSetupFeaturedProducts                            
             vẫn = false]
                         │
                         ↓
┌────────────────────────┴───────────────────────────────────────┐
│                   LẦN ĐĂNG NHẬP SAU                            │
└────────────────────────┬───────────────────────────────────────┘
                         │
                         ↓
        ┌────────────────┴────────────────┐
        │  Backend: login()               │
        │  - Check isUserPro = true       │
        │  - Check hasSetupFeatured       │
        │    = false                      │
        │  - Return shouldShow = true     │
        └────────────────┬────────────────┘
                         │
                         ↓
┌────────────────────────────────────────────────────────────────┐
│              HIỂN THỊ REMINDER BANNER                          │
│  "🎉 Bạn chưa chọn sản phẩm nổi bật!"                        │
│  [Chọn ngay]  [X]                                             │
└────────────────┬───────────────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ↓                 ↓
   [Chọn ngay]      [Dismiss (X)]
        │                 │
        ↓                 │
   Navigate to            │
   featured page          │
        │                 │
        └─────────────────┘
                 │
                 ↓
        [Lặp lại flow chọn featured]
```

---

## 🔧 Technical Implementation Details

### 1. **returnTo Query Parameter Logic**

**CreatePost Component:**
```jsx
import { useNavigate, useSearchParams } from "react-router-dom";

export default function CreatePost() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  
  const handleSubmitSuccess = (createdProduct) => {
    if (returnTo) {
      // Quay về trang featured và có thể auto-select product vừa tạo
      navigate(`${returnTo}?newProductId=${createdProduct._id}`);
    } else {
      navigate('/quan-ly/bai-dang');
    }
  };
  
  // ... rest of component
}
```

**SelectFeaturedProducts Component - Handle newProductId:**
```jsx
import { useSearchParams } from "react-router-dom";

export default function SelectFeaturedProducts() {
  const [searchParams] = useSearchParams();
  const newProductId = searchParams.get('newProductId');
  
  useEffect(() => {
    loadMyProducts();
  }, []);
  
  useEffect(() => {
    // Auto-select product vừa tạo (optional)
    if (newProductId && myProducts.length > 0) {
      const newProduct = myProducts.find(p => p._id === newProductId);
      if (newProduct && selectedIds.length < MAX_FEATURED) {
        setSelectedIds([...selectedIds, newProductId]);
        // Scroll to new product
        document.getElementById(`product-${newProductId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }
  }, [newProductId, myProducts]);
  
  // ... rest
}
```

### 2. **Reminder Banner Persistence Strategy**

**Option A: Session-based (Recommended)**
```javascript
// Dismiss chỉ ẩn trong session hiện tại
// Lần login sau vẫn hiện lại nếu chưa setup

const [dismissed, setDismissed] = useState(
  sessionStorage.getItem('featuredReminderDismissed') === 'true'
);

const handleDismiss = () => {
  sessionStorage.setItem('featuredReminderDismissed', 'true');
  setDismissed(true);
};
```

**Option B: API-based (Nếu muốn dismiss vĩnh viễn)**
```javascript
// Thêm field vào User model
dismissedFeaturedReminder: {
  type: Boolean,
  default: false
}

// API endpoint
POST /auth/dismiss-featured-reminder

// Logic: Chỉ hiện nếu:
// - isPro = true
// - hasSetupFeaturedProducts = false  
// - dismissedFeaturedReminder = false
```

### 3. **Admin Approval Flow với Featured Products**

**Khi admin approve pending product:**
```javascript
// In product.controller.js - adminChangeStatus()

if (status === "approved" && existingProduct.postStatus !== "approved") {
  // ... existing notification code ...
  
  // ⭐ Check if product was marked as featured
  if (existingProduct.isFeatured) {
    // Create notification về featured activation
    await createNotification({
      recipientId: existingProduct.ownerId,
      type: "system",
      title: "Sản phẩm nổi bật đã được kích hoạt",
      content: `Sản phẩm "${existingProduct.title}" đã được duyệt và giờ đây đang hiển thị ở vị trí nổi bật!`,
      relatedType: "product",
      relatedId: existingProduct._id,
      link: `/san-pham/${existingProduct._id}`,
    }, req.app.get("io"));
  }
}
```

**Khi admin reject pending product:**
```javascript
if (status === "rejected") {
  // ... existing code ...
  
  // ⭐ Auto unfeatured nếu product bị reject
  if (existingProduct.isFeatured) {
    await ProductPost.findByIdAndUpdate(existingProduct._id, {
      isFeatured: false,
      featuredAt: null
    });
    
    // Notify user
    await createNotification({
      recipientId: existingProduct.ownerId,
      type: "system",
      title: "Sản phẩm nổi bật đã bị hủy",
      content: `Sản phẩm "${existingProduct.title}" đã bị từ chối, do đó không còn ở trạng thái nổi bật.`,
      relatedType: "system",
      link: "/goi-pro/chon-san-pham-noi-bat",
    }, req.app.get("io"));
  }
}
```

### 4. **Featured Products khi Pro hết hạn**

**Option A: Tự động unfeatured (Recommended)**
```javascript
// Tạo cron job check hàng ngày
// File: backend/src/jobs/check-expired-pro.js

const checkExpiredProUsers = async () => {
  const now = new Date();
  
  // Find users có Pro vừa hết hạn
  const expiredUsers = await User.find({
    proExpiresAt: { $lt: now },
    // Có thể thêm field lastChecked để tránh check lại
  });
  
  for (const user of expiredUsers) {
    // Unfeatured tất cả products của user
    await ProductPost.updateMany(
      { 
        ownerId: user._id,
        isFeatured: true 
      },
      { 
        isFeatured: false,
        featuredAt: null 
      }
    );
    
    // Notify user
    await createNotification({
      recipientId: user._id,
      type: "system",
      title: "Gói Pro đã hết hạn",
      content: "Gói Pro của bạn đã hết hạn. Sản phẩm nổi bật đã được chuyển về trạng thái bình thường. Gia hạn ngay để tiếp tục hưởng quyền lợi!",
      link: "/goi-pro",
    });
  }
};

// Trong server.js
setInterval(checkExpiredProUsers, 24 * 60 * 60 * 1000); // Chạy mỗi ngày
```

**Option B: Soft unfeatured (Không xóa flag nhưng không ưu tiên)**
```javascript
// Trong getProducts() sorting
products.sort((a, b) => {
  // Check if owner is still Pro
  const aOwnerIsPro = isUserPro(a.ownerId);
  const bOwnerIsPro = isUserPro(b.ownerId);
  
  // Only prioritize featured if owner is still Pro
  const aIsFeaturedAndPro = a.isFeatured && aOwnerIsPro;
  const bIsFeaturedAndPro = b.isFeatured && bOwnerIsPro;
  
  if (aIsFeaturedAndPro !== bIsFeaturedAndPro) {
    return bIsFeaturedAndPro - aIsFeaturedAndPro;
  }
  
  return Number(bOwnerIsPro) - Number(aOwnerIsPro);
});
```

### 5. **Performance Optimization**

**Index Database Fields:**
```javascript
// Trong ProductPost model
productPostSchema.index({ isFeatured: -1, featuredAt: -1 });
productPostSchema.index({ ownerId: 1, isFeatured: 1 });
productPostSchema.index({ postStatus: 1, isFeatured: -1 });
```

**Cache Featured Products:**
```javascript
// Optional: Cache featured products trên Redis
// Chỉ cần nếu traffic cao

const getFeaturedProductsCache = async () => {
  const cacheKey = 'featured_products_list';
  const cached = await redis.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const featured = await ProductPost.find({ isFeatured: true })
    .populate('ownerId')
    .lean();
  
  await redis.setex(cacheKey, 300, JSON.stringify(featured)); // Cache 5 phút
  
  return featured;
};
```

---

## 📊 Database Schema Visualization

```
┌─────────────────────────────────────────┐
│           users (Collection)            │
├─────────────────────────────────────────┤
│ _id: ObjectId                           │
│ fullName: String                        │
│ email: String                           │
│ proExpiresAt: Date          ← Existing │
│ hasSetupFeaturedProducts    ← NEW      │
│   : Boolean (default: false)            │
└─────────────────────────────────────────┘
                    │
                    │ ownerId
                    ↓
┌─────────────────────────────────────────┐
│      product_posts (Collection)         │
├─────────────────────────────────────────┤
│ _id: ObjectId                           │
│ ownerId: ObjectId → users              │
│ title: String                           │
│ postStatus: String                      │
│ isFeatured: Boolean         ← NEW      │
│   (default: false)                      │
│ featuredAt: Date            ← NEW      │
│   (default: null)                       │
└─────────────────────────────────────────┘
                    │
                    │ userId
                    ↓
┌─────────────────────────────────────────┐
│   pro_subscriptions (Collection)        │
├─────────────────────────────────────────┤
│ _id: ObjectId                           │
│ userId: ObjectId → users               │
│ status: String (paid/pending...)        │
│ expiresAt: Date                         │
└─────────────────────────────────────────┘
```

### 1. Backup Database
```bash
mongodump --uri="your_mongodb_uri" --out=backup_before_featured
```

### 2. Deploy Backend
```bash
cd backend
git pull
npm install
# Chạy migration nếu cần
node migrate-featured-products.js
npm start
```

### 3. Deploy Frontend
```bash
cd frontend
git pull
npm install
npm run build
# Deploy build folder
```

### 4. Verify
- [ ] Test flow mua Pro → chọn featured
- [ ] Kiểm tra sorting trên homepage
- [ ] Kiểm tra API responses

---

## 📌 Notes

### Về Logic "1 tháng"
Hiện tại code dùng **active posts count** thay vì "1 tháng":
```javascript
postStatus: { $in: ["pending", "approved", "available"] }
```

**Nếu muốn giới hạn theo tháng**, cần thêm:
```javascript
const startOfMonth = new Date();
startOfMonth.setDate(1);
startOfMonth.setHours(0, 0, 0, 0);

const activePosts = await ProductPost.countDocuments({
  ownerId: req.user._id,
  createdAt: { $gte: startOfMonth },
  postStatus: { $in: ["pending", "approved", "available"] },
});
```

### Về Featured Products khi hết Pro
**Option 1**: Tự động unfeatured khi hết Pro
```javascript
// Thêm vào getProducts()
if (p.isFeatured && !p.ownerIsPro) {
  p.isFeatured = false; // Hide featured nếu user hết Pro
}
```

**Option 2**: Giữ featured nhưng không ưu tiên sort
- Người dùng biết rằng featured chỉ active khi còn Pro

---

## ❓ Questions to Clarify (UPDATED)

1. **Giới hạn 5 bài**: Theo tháng hay theo active posts?
2. **Featured khi hết Pro**: Tự động unfeatured hay giữ nguyên nhưng không ưu tiên?
3. **Re-select featured**: User có thể thay đổi 3 products bất kỳ lúc nào? ✅ YES
4. **Reminder frequency**: Hiện reminder mỗi lần login hay có thể dismiss vĩnh viễn?
5. **New product on featured page**: Sau khi tạo xong có tự động thêm vào selected không?
6. **Pending featured**: Khi admin reject pending product đã được chọn featured → xử lý thế nào?

---

## 📚 Related Files (UPDATED)

### Backend - Models
- `backend/src/models/product_post.model.js` - Thêm `isFeatured`, `featuredAt`
- `backend/src/models/user.model.js` - Thêm `hasSetupFeaturedProducts`
- `backend/src/models/pro_subscription.model.js` - Không thay đổi

### Backend - Controllers
- `backend/src/controllers/product.controller.js` - Thêm `setFeaturedProducts`, `getFeaturedProducts`, update sorting
- `backend/src/controllers/subscription.controller.js` - Update `vnpayReturn` redirect
- `backend/src/controllers/auth.controller.js` - Thêm `checkFeaturedReminder`, update `login` response

### Backend - Routes
- `backend/src/routes/product.routes.js` - Thêm featured endpoints
- `backend/src/routes/auth.routes.js` - Thêm featured reminder endpoint

### Backend - Utils
- `backend/src/utils/business-rules.js` - Thêm `MAX_FEATURED_PRODUCTS`

### Frontend - Pages
- `frontend/src/pages/user/SelectFeaturedProducts.jsx` - **NEW** - Trang chọn featured với create button
- `frontend/src/pages/product/CreatePost.jsx` - Support returnTo query param
- `frontend/src/pages/core/Home.jsx` - Display featured products first
- `frontend/src/pages/product/Marketplace.jsx` - Display featured badge

### Frontend - Components
- `frontend/src/components/FeaturedReminderBanner.jsx` - **NEW** - Banner reminder
- `frontend/src/components/ecotrade/EcoTradeLayout.jsx` - Display reminder banner
- `frontend/src/components/PrivateRoute.jsx` - Không thay đổi

### Frontend - Services
- `frontend/src/services/product.service.js` - Thêm `setFeaturedProducts`, `getFeaturedProducts`
- `frontend/src/services/auth.service.js` - Thêm `checkFeaturedReminder`, `markFeaturedSetupDone`

### Frontend - Context
- `frontend/src/context/AuthContext.jsx` - Include `hasSetupFeaturedProducts` trong user state

### Frontend - Routes
- `frontend/src/App.jsx` - Thêm route `/goi-pro/chon-san-pham-noi-bat`

### Migration
- `backend/migrate-featured-products.js` - **NEW** - Migration script

---

## ✅ Summary (UPDATED)

### **Minimal Changes Required:**

#### Database Schema (3 fields)
1. ✏️ `ProductPost.isFeatured` - Boolean, đánh dấu featured
2. ✏️ `ProductPost.featuredAt` - Date, track thời gian
3. ✏️ `User.hasSetupFeaturedProducts` - Boolean, track đã setup chưa

#### Backend API (7 endpoints + logic updates)
4. ✏️ `POST /products/my-products/featured` - Set featured products
5. ✏️ `GET /products/my-products/featured` - Get featured products  
6. ✏️ `GET /auth/featured-reminder` - Check reminder status
7. ✏️ `POST /auth/mark-featured-done` - Mark setup done
8. ✏️ Update `vnpayReturn` - Redirect + reset setup flag
9. ✏️ Update `login` - Include reminder info
10. ✏️ Update `getProducts` sorting - Featured first
11. ✏️ Update `setFeaturedProducts` - Allow pending products

#### Frontend (3 pages + 1 component + services)
12. ✏️ `SelectFeaturedProducts.jsx` - **NEW** page với create button
13. ✏️ `FeaturedReminderBanner.jsx` - **NEW** component
14. ✏️ `EcoTradeLayout.jsx` - Display reminder banner
15. ✏️ `CreatePost.jsx` - Support returnTo param
16. ✏️ `product.service.js` - Add featured methods
17. ✏️ `auth.service.js` - Add reminder methods
18. ✏️ `App.jsx` - Add route
19. ✏️ `AuthContext.jsx` - Include hasSetupFeaturedProducts
20. ✏️ Home/Marketplace - Display featured badge & Pro badge

#### Migration
21. ✏️ Migration script cho database fields

### **Key Features Implemented:**

✅ **Flow mua Pro:**
1. User mua Pro → VNPay payment
2. Success → Redirect `/goi-pro/chon-san-pham-noi-bat`
3. User thấy products (pending + approved)
4. Click "Tạo sản phẩm mới" → `/dang-tin?returnTo=...`
5. Sau khi tạo → quay về trang chọn featured
6. Chọn tối đa 3 products (có thể pending)
7. Submit hoặc Skip → Mark `hasSetupFeaturedProducts = true`

✅ **Reminder System:**
1. User Pro chưa setup featured
2. Mỗi lần login → Hiện banner reminder
3. Click "Chọn ngay" → Navigate trang featured
4. Dismiss → Ẩn banner (session only, hiện lại lần sau)
5. Sau khi setup xong → Không hiện nữa

✅ **Featured Products Display:**
1. Homepage & Marketplace: Featured products lên đầu
2. Badge "⭐ NỔI BẬT" màu vàng
3. Badge "👑 PRO" cho Pro users
4. Badge "⏳ Chờ duyệt" cho pending products
5. Sort priority: Featured → Pro → Normal

✅ **Pending Products Support:**
1. Cho phép chọn pending products làm featured
2. Hiển thị warning "Sẽ featured sau khi admin duyệt"
3. Admin approve → Tự động active featured
4. Admin reject → Tự động remove featured

### **Không cần thay đổi:**
- ❌ Core subscription system
- ❌ Payment integration (VNPay)
- ❌ Authentication flow
- ❌ Product CRUD operations
- ❌ Admin approval system
- ❌ Major refactoring

### **Estimated Time:** 6-8 hours
- Backend API: 2-3 hours
- Frontend pages: 2-3 hours  
- Reminder system: 1-2 hours
- Testing & polish: 1 hour

### **Priority Implementation Order:**
1. **Phase 1** (Core): Database schema + Product API + Basic featured page
2. **Phase 2** (Flow): VNPay redirect + Create button + returnTo logic
3. **Phase 3** (Reminder): Reminder banner + Auth API
4. **Phase 4** (Polish): Badges + Sorting + Pending support
5. **Phase 5** (Test): Full testing + Bug fixes


---

## 🚀 Deployment Steps

### 1. Backup Database
```bash
mongodump --uri="mongodb+srv://duyanhAdmin:biboda123@wdp301.cmor6qd.mongodb.net/WDP301" --out=backup_before_featured_$(date +%Y%m%d)
```

### 2. Deploy Backend
```bash
cd backend

# Pull latest code
git pull origin AnhDTD

# Install dependencies (if needed)
npm install

# Run migration
node migrate-featured-products.js

# Restart server
npm start
# hoặc pm2 restart ecotrade-api
```

### 3. Deploy Frontend
```bash
cd frontend

# Pull latest code  
git pull origin AnhDTD

# Install dependencies (if needed)
npm install

# Build production
npm run build

# Deploy build folder
# (Copy to hosting hoặc update server)
```

### 4. Verify Deployment
- [ ] Backend API health check: `GET /api/health`
- [ ] Test featured endpoints: `GET/POST /api/products/my-products/featured`
- [ ] Test reminder endpoint: `GET /api/auth/featured-reminder`
- [ ] Frontend loads without errors
- [ ] Login flow includes reminder info
- [ ] Featured page accessible

### 5. Smoke Tests
```bash
# Test create Pro subscription
curl -X POST http://localhost:5000/api/subscriptions/payment \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"plan":"1m"}'

# Test set featured
curl -X POST http://localhost:5000/api/products/my-products/featured \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"productIds":["<id1>","<id2>"]}'

# Test get featured
curl http://localhost:5000/api/products/my-products/featured \
  -H "Authorization: Bearer <token>"
```

---

## 🐛 Troubleshooting Guide

### Issue 1: Migration fails
**Symptom:** `migrate-featured-products.js` errors out

**Solutions:**
```bash
# Check MongoDB connection
node -e "require('dotenv').config(); console.log(process.env.MONGODB_URI)"

# Check if models are correct
node -e "const ProductPost = require('./src/models/product_post.model'); console.log(ProductPost.schema.paths)"

# Run migration with verbose logging
DEBUG=* node migrate-featured-products.js
```

### Issue 2: Reminder không hiện
**Symptom:** User Pro login nhưng không thấy banner

**Debug:**
```javascript
// Check trong AuthContext hoặc console
console.log('User:', user);
console.log('Is Pro:', isUserPro(user));
console.log('Has setup:', user.hasSetupFeaturedProducts);

// Nên thấy:
// - proExpiresAt: Date trong tương lai
// - hasSetupFeaturedProducts: false
```

**Solutions:**
- Check `hasSetupFeaturedProducts` field exists in User
- Check login API response includes reminder info
- Check banner component renders conditionally
- Clear browser cache / localStorage

### Issue 3: Featured products không lên đầu
**Symptom:** Products không sort đúng

**Debug:**
```javascript
// Trong getProducts() console log
console.log('Before sort:', products.map(p => ({
  id: p._id,
  featured: p.isFeatured,
  ownerPro: p.ownerIsPro
})));

// After sort
console.log('After sort:', products.map(p => ({
  id: p._id,
  featured: p.isFeatured,
  ownerPro: p.ownerIsPro
})));
```

**Solutions:**
- Check sorting logic trong `getProducts()`
- Check `isFeatured` được populate đúng
- Check `ownerIsPro` được calculate đúng
- Verify database có products với `isFeatured: true`

### Issue 4: returnTo không hoạt động
**Symptom:** Tạo product xong không quay về featured page

**Debug:**
```javascript
// Trong CreatePost component
console.log('returnTo:', returnTo);
console.log('Created product:', createdProduct);
```

**Solutions:**
- Check query param được pass đúng: `/dang-tin?returnTo=/goi-pro/chon-san-pham-noi-bat`
- Encode URL nếu cần: `encodeURIComponent(returnTo)`
- Check navigate() được gọi sau successful creation

### Issue 5: Pending products không được chọn
**Symptom:** API reject pending products

**Solutions:**
- Check filter trong `setFeaturedProducts`:
```javascript
postStatus: { $in: ["pending", "approved", "available"] }
```
- Không phải chỉ `["approved", "available"]`

---

## 📈 Monitoring & Analytics

### Metrics to Track

**Business Metrics:**
- Pro subscription conversion rate
- Featured setup completion rate (%)
- Average products selected (0-3)
- Skip rate (%)
- Time to setup after Pro purchase
- Featured reminder CTR (Click-Through Rate)

**Technical Metrics:**
- API response time `/products/my-products/featured`
- Featured products query performance
- Database index usage
- Cache hit rate (if implemented)

### Logging Events

```javascript
// Backend logging examples
logger.info('Featured products set', {
  userId: req.user._id,
  productIds,
  count: productIds.length,
  timestamp: new Date()
});

logger.info('Featured reminder shown', {
  userId: req.user._id,
  isPro: true,
  hasSetup: false
});

logger.info('Featured setup skipped', {
  userId: req.user._id,
  reason: 'user_skip'
});
```

### Database Queries for Analytics

```javascript
// Count Pro users who haven't setup featured
const notSetupCount = await User.countDocuments({
  proExpiresAt: { $gt: new Date() },
  hasSetupFeaturedProducts: false
});

// Count featured products by status
const featuredByStatus = await ProductPost.aggregate([
  { $match: { isFeatured: true } },
  { $group: { _id: '$postStatus', count: { $sum: 1 } } }
]);

// Average featured products per Pro user
const avgFeatured = await ProductPost.aggregate([
  { $match: { isFeatured: true } },
  { $group: { 
      _id: '$ownerId', 
      featuredCount: { $sum: 1 } 
  }},
  { $group: { 
      _id: null, 
      avgCount: { $avg: '$featuredCount' } 
  }}
]);
```

---

## 🔐 Security Considerations

### 1. Authorization Checks
✅ **Implemented:**
- Only Pro users can set featured
- Users can only feature their own products
- Max 3 products limit enforced
- Product ownership verified

⚠️ **Additional checks to consider:**
```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');
const featuredLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per window
  message: 'Too many requests, please try again later'
});

router.post('/my-products/featured', auth, featuredLimiter, setFeaturedProducts);
```

### 2. Input Validation
```javascript
// Validate productIds array
const Joi = require('joi');

const setFeaturedSchema = Joi.object({
  productIds: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/)) // Valid ObjectId
    .min(0)
    .max(3)
    .required()
});

// In controller
const { error } = setFeaturedSchema.validate(req.body);
if (error) {
  return res.status(400).json({ 
    success: false, 
    message: error.details[0].message 
  });
}
```

### 3. XSS Prevention
```javascript
// Sanitize product data before display
import DOMPurify from 'dompurify';

const sanitizedTitle = DOMPurify.sanitize(product.title);
```

### 4. CSRF Protection
```javascript
// Ensure CSRF tokens on mutation endpoints
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

router.post('/my-products/featured', csrfProtection, auth, setFeaturedProducts);
```

---

## 🎓 Best Practices & Recommendations

### Code Quality
- [ ] Add JSDoc comments to functions
- [ ] Use TypeScript (optional but recommended)
- [ ] Add unit tests for business logic
- [ ] Add integration tests for API endpoints
- [ ] Code review before merge

### Performance
- [ ] Add database indexes
- [ ] Implement caching strategy
- [ ] Optimize image loading (lazy load)
- [ ] Use CDN for static assets
- [ ] Monitor query performance

### User Experience
- [ ] Add loading states everywhere
- [ ] Smooth animations/transitions
- [ ] Responsive design tested on all devices
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Error messages are helpful and clear

### Maintenance
- [ ] Document API endpoints (Swagger/OpenAPI)
- [ ] Keep this solution doc updated
- [ ] Log important events
- [ ] Set up error monitoring (Sentry)
- [ ] Regular backup schedule

---

## 🆘 FAQ (Frequently Asked Questions)

### Q1: User có thể thay đổi featured products không?
**A:** Có, user Pro có thể vào lại trang `/goi-pro/chon-san-pham-noi-bat` bất kỳ lúc nào để thay đổi.

### Q2: Nếu user chọn 3 pending products rồi admin reject hết thì sao?
**A:** Tất cả sẽ tự động unfeatured. User sẽ nhận notification và có thể chọn lại products khác.

### Q3: Featured products có expire không?
**A:** Không expire cho đến khi:
- User thay đổi selection
- User hết Pro (optional: tự động unfeatured)
- Admin reject product

### Q4: User có thể featured sản phẩm đang pending không?
**A:** Có, nhưng featured chỉ active sau khi admin approve.

### Q5: Có giới hạn số lần thay đổi featured không?
**A:** Không, Pro user có thể thay đổi không giới hạn.

### Q6: Featured products có được ưu tiên trong search không?
**A:** Có thể implement thêm nếu cần, hiện tại chỉ ưu tiên trên homepage/marketplace listing.

### Q7: Có thể featured rental products không?
**A:** Có, tất cả product types đều có thể featured.

### Q8: Nếu user skip setup, có thể setup sau không?
**A:** Có, vào lại page hoặc click reminder banner.

---

## 📞 Support & Contact

**Technical Issues:**
- Check logs: `backend/logs/error.log`
- Check browser console for frontend errors
- Check network tab for API failures

**Need Help?**
- Review this document thoroughly
- Check related files in codebase
- Test in development environment first
- Ask team members familiar with codebase

---

---

## Bo sung yeu cau User thuong / User Pro va Featured Products

Phan nay la yeu cau chot de trien khai tiep tren he thong hien tai. Khi implement can giu tuong thich nguoc voi du lieu dang co tren MongoDB Atlas va khong lam thay doi hanh vi cua cac module order, rental, cart, admin approval hien tai.

### 1. Chinh sach tai khoan

#### User thuong
- Chi duoc dang toi da **5 san pham dang hoat dong**.
- Cac trang thai duoc tinh vao quota: `pending`, `approved`, `available`.
- Cac trang thai khong tinh vao quota: `rejected`, `sold`, `rented`, `inactive`, `closed`.
- Khong duoc chon san pham noi bat.
- Neu da dat 5 san pham, API tao san pham phai tra `403` va huong dan nang cap Pro.

Backend hien da co logic gan dung trong `createProduct()`:
```javascript
const activePosts = await ProductPost.countDocuments({
  ownerId: req.user._id,
  postStatus: { $in: ["pending", "approved", "available"] },
});
```

Giu logic nay neu chinh sach la "toi da 5 san pham dang hoat dong". Khong doi sang gioi han theo thang neu chua co yeu cau ro rang, vi se anh huong truc tiep den behavior hien tai.

#### User Pro
- Duoc dang san pham **khong gioi han**.
- Duoc chon toi da **3 san pham noi bat**.
- Chi tai khoan con han Pro, tuc `proExpiresAt > now`, moi duoc set featured.
- San pham noi bat chi nen co hieu luc hien thi khi owner con Pro.
- Khi het Pro, co the giu `isFeatured = true` trong database de khong mat lua chon cu, nhung query public khong duoc uu tien san pham do nua. Neu muon du lieu sach hon, co the chay job unset featured cho user het Pro, nhung day khong phai buoc bat buoc.

### 2. Dieu huong khi dang ky Pro

Sau khi VNPay return thanh cong:

1. Backend cap nhat `users.proExpiresAt`.
2. Backend reset `users.hasSetupFeaturedProducts = false`.
3. Backend redirect ve:
```text
/goi-pro/chon-san-pham-noi-bat
```

Neu transaction da `paid` truoc do va user refresh lai VNPay return URL, khong nen reset lai reminder nhieu lan. Idempotent flow nen xu ly nhu sau:

```javascript
if (sub.status === "paid") {
  return res.redirect(`${CLIENT_URL}/goi-pro/chon-san-pham-noi-bat`);
}
```

Khi user vao trang chon san pham noi bat:
- Neu chon va xac nhan: set featured, set `hasSetupFeaturedProducts = true`.
- Neu bam "Bo qua, chon sau": set `hasSetupFeaturedProducts = true` de khong nhac lai lien tuc.
- Neu thoat giua chung ma chua submit/skip: giu `hasSetupFeaturedProducts = false`, lan login sau hien thi reminder.

### 3. Giao dien trang chon san pham noi bat

Trang `/goi-pro/chon-san-pham-noi-bat` can co giao dien tuong tu mockup Visily:

```text
frontend/update_frontend/visily-vinhomes-chọn-sản-phẩm-nổi-bật.png
```

Thanh phan bat buoc:
- Sidebar quan ly ben trai, highlight muc **San pham cua toi**.
- Breadcrumb phia tren: `San pham > Chon san pham noi bat`.
- Hero nen xanh nhat:
  - Badge `Goi Pro da kich hoat`.
  - Heading `Chon san pham noi bat cua ban`.
  - Mo ta ngan ve loi ich Pro.
  - Checklist: dang bai khong gioi han, chon toi da 3 san pham noi bat, san pham duoc uu tien hien thi.
  - Card thong ke ben phai: `Da chon san pham x / 3`.
- Section danh sach:
  - Title `Danh sach san pham duoc duyet`.
  - Chi hien thi san pham du dieu kien de chon featured.
  - Grid 3 cot desktop, responsive xuong 1 cot mobile.
  - Product card co anh, ten, gia, vi tri, danh muc.
  - Card da chon co border xanh va badge `Noi bat`.
  - Button trang thai:
    - Chua chon: `Chon lam noi bat`.
    - Da chon: `Da chon`.
- Bottom sticky action bar:
  - Ben trai: `Dang lua chon: Da chon x san pham`.
  - Button phu: `Bo qua, chon sau`.
  - Button chinh: `Xac nhan (x san pham)`.

Khong can dua san pham `pending` vao section "Danh sach san pham duoc duyet" neu UI dang ghi ro "duoc duyet". Neu van muon cho chon pending, can doi copy thanh "Danh sach san pham co the chon" va hien thi badge `Cho duyet` de tranh sai nghia.

### 4. Cach lay va hien thi san pham noi bat

Khong nen chi sort toan bo marketplace bang `isFeatured` sau khi da `skip/limit`, vi featured o page sau co the khong duoc keo len dau page dau.

Nen tach ro 2 nhom du lieu:

#### API marketplace/homepage de xuat
```json
{
  "success": true,
  "data": {
    "featuredProducts": [],
    "products": []
  },
  "pagination": {}
}
```

#### Query featured products
Dieu kien:
- `isFeatured: true`
- `postStatus` thuoc `approved`, `available`
- owner con Pro: `ownerId.proExpiresAt > now`

Vi `ownerId.proExpiresAt` nam o collection `users`, cach chinh xac nhat la dung aggregation `$lookup`, hoac query featured truoc roi loc owner Pro sau khi populate. Voi du lieu nho co the populate roi filter, nhung ve lau dai nen dung aggregation de on dinh performance.

#### Query products thuong
Danh sach thuong van lay nhu hien tai, nhung loai cac san pham da nam trong `featuredProducts`:
```javascript
_id: { $nin: featuredProductIds }
```

Dieu nay dam bao:
- San pham noi bat nam rieng trong section **San pham noi bat**.
- Cac san pham khac van lay binh thuong theo filter/search/sort hien tai.
- Khong bi duplicate giua section featured va danh sach thuong.

### 5. Database/Mongoose Atlas: thay doi can kiem soat

#### `product_posts`
```javascript
isFeatured: {
  type: Boolean,
  default: false,
},
featuredAt: {
  type: Date,
  default: null,
}
```

Hien code da co 2 field nay trong `ProductPost`. Van can migration cho document cu neu chua co field:
```javascript
await ProductPost.updateMany(
  { isFeatured: { $exists: false } },
  { $set: { isFeatured: false, featuredAt: null } }
);
```

#### `users`
```javascript
hasSetupFeaturedProducts: {
  type: Boolean,
  default: false,
}
```

Migration de xuat:
```javascript
await User.updateMany(
  { hasSetupFeaturedProducts: { $exists: false } },
  { $set: { hasSetupFeaturedProducts: false } }
);
```

Neu khong muon cac Pro user hien tai bi nhac chon featured ngay sau deploy, co the migrate rieng:
```javascript
await User.updateMany(
  {
    proExpiresAt: { $gt: new Date() },
    hasSetupFeaturedProducts: { $exists: false },
  },
  { $set: { hasSetupFeaturedProducts: true } }
);
```

Chon mot trong hai policy truoc khi deploy:
- `false`: Pro user cu cung duoc nhac chon featured.
- `true`: Chi Pro user mua moi sau deploy duoc dua vao flow chon featured.

### 6. Index khuyen nghi

Them index khong lam doi du lieu hien tai, chi ho tro query nhanh hon:

```javascript
productPostSchema.index({ ownerId: 1, postStatus: 1, createdAt: -1 });
productPostSchema.index({ ownerId: 1, isFeatured: 1, featuredAt: -1 });
productPostSchema.index({ postStatus: 1, isFeatured: -1, featuredAt: -1 });
userSchema.index({ proExpiresAt: 1, hasSetupFeaturedProducts: 1 });
```

Khong dung unique index cho `isFeatured`, vi moi user Pro duoc chon toi da 3 san pham.

### 7. Nhung diem khong duoc lam anh huong chuc nang hien tai

- Khong doi enum `postStatus` neu khong can.
- Khong doi y nghia `approved` / `available`, vi cart, order va rental dang dung cac trang thai nay de kiem tra kha dung.
- Khong doi flow admin duyet san pham. San pham moi van phai qua admin approve truoc khi hien thi public.
- Khong doi `pro_subscriptions` neu chi can featured; he thong Pro hien da dua tren `users.proExpiresAt`.
- Khong xoa hoac reset `isFeatured` hang loat khi deploy neu chua backup.
- Khong de user thuong set featured qua API, ke ca khi frontend an button.
- Khong tin du lieu frontend gui len; backend phai tu check owner, Pro status, so luong toi da 3 va status san pham.

### 8. Acceptance checklist

- [ ] User thuong tao toi da 5 san pham active, san pham thu 6 bi chan.
- [ ] User Pro tao san pham khong gioi han.
- [ ] Sau thanh toan Pro thanh cong, user duoc dieu huong den `/goi-pro/chon-san-pham-noi-bat`.
- [ ] Trang chon featured giong layout mockup: sidebar, hero xanh, grid card, counter, sticky action bar.
- [ ] User Pro chon toi da 3 san pham noi bat.
- [ ] San pham noi bat hien thi o section rieng **San pham noi bat**.
- [ ] Danh sach san pham thuong khong duplicate san pham noi bat.
- [ ] User het Pro khong con duoc uu tien featured tren public listing.
- [ ] Migration tren MongoDB Atlas chi them field default, khong lam mat du lieu cu.

**Document Version:** 2.1 (Updated with user/pro policy and featured UI requirements)  
**Last Updated:** 2026-07-06  
**Author:** Claude (AI Assistant)  
**Status:** ✅ Ready for Implementation
