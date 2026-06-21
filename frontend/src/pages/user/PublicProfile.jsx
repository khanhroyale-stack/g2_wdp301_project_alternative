import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import userService from "../../services/user.service";

const VER_BADGE = {
  unverified: { label: "Chưa xác minh", cls: "bg-surface-container text-on-surface-variant" },
  pending: { label: "Chờ duyệt KYC", cls: "bg-surface-container-high text-on-surface" },
  verified: { label: "Đã xác minh ✓", cls: "bg-secondary-container text-on-secondary-container" },
  rejected: { label: "Bị từ chối", cls: "bg-error-container text-on-error-container" },
};

const ACC_BADGE = {
  active: { label: "Đang hoạt động", cls: "text-secondary" },
  inactive: { label: "Chưa kích hoạt", cls: "text-on-surface-variant" },
  banned: { label: "Tài khoản bị khóa", cls: "text-error" },
};

const PublicProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    userService.getPublicProfile(id)
      .then((res) => {
        if (res.success) setProfile(res.user);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-3xl text-primary">refresh</span>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center gap-4 text-on-surface-variant">
        <span className="material-symbols-outlined text-6xl opacity-30">person_off</span>
        <p className="font-semibold text-lg">Không tìm thấy người dùng</p>
        <Link to="/marketplace" className="text-sm text-primary font-medium hover:underline">
          Quay lại Marketplace
        </Link>
      </div>
    );
  }

  const displayName = profile.fullName || "Người dùng";
  const verBadge = VER_BADGE[profile.verificationStatus] || VER_BADGE.unverified;
  const accBadge = ACC_BADGE[profile.accountStatus] || ACC_BADGE.active;
  const reputation = profile.reputationScore ?? 100;
  const roleLabel = { admin: "Quản trị viên", shipper: "Shipper", user: "Người dùng" }[profile.role] || "Người dùng";

  return (
    <div className="min-h-screen bg-[#F5F5F7] py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Back */}
        <Link to={-1} className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface mb-6 transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Quay lại
        </Link>

        {/* Hero card */}
        <div className="relative bg-gradient-to-r from-primary to-primary-fixed rounded-2xl p-8 mb-6 overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-3xl font-black shadow-lg flex-shrink-0">
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
                : displayName.charAt(0).toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Hồ sơ người dùng</p>
              <h1 className="text-2xl font-black text-white">{displayName}</h1>
              <p className="text-white/70 text-sm mt-0.5">{roleLabel}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${verBadge.cls}`}>
                  {verBadge.label}
                </span>
                <span className={`text-xs font-medium ${accBadge.cls}`}>
                  {accBadge.label}
                </span>
              </div>
            </div>

            {/* Reputation */}
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-xl p-5 text-center min-w-[130px]">
              <p className="text-white/70 text-xs font-medium mb-1">Điểm uy tín</p>
              <p className={`text-4xl font-black ${reputation < 50 ? "text-red-300" : "text-white"}`}>
                {reputation}
              </p>
              <div className="mt-2 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${reputation < 50 ? "bg-red-400" : "bg-white"}`}
                  style={{ width: `${Math.min(reputation, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Điểm uy tín", value: reputation, icon: "verified_user", color: reputation < 50 ? "text-error" : "text-primary" },
            { label: "Đánh giá TB", value: profile.averageRating ? `${profile.averageRating.toFixed(1)} ★` : "Chưa có", icon: "star", color: "text-amber-500" },
            { label: "Xác minh", value: verBadge.label, icon: "badge", color: "text-secondary" },
          ].map((s) => (
            <div key={s.label} className="bg-surface-container-lowest rounded-2xl p-4 text-center shadow-apple border border-surface-variant/30">
              <span className={`material-symbols-outlined text-2xl mb-2 ${s.color}`}>{s.icon}</span>
              <p className="font-bold text-on-surface text-sm">{s.value}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Banned warning */}
        {profile.accountStatus === "banned" && (
          <div className="bg-error-container/40 border border-error/30 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-error flex-shrink-0">block</span>
            <div>
              <p className="font-semibold text-error">Tài khoản bị khóa</p>
              <p className="text-sm text-on-error-container mt-0.5">
                Người dùng này không thể thực hiện giao dịch trên EcoTrade.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProfile;
