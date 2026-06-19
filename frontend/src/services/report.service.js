import api from "./api";

const reportService = {
  // User tạo báo cáo
  createReport: (data) =>
    api.post("/reports", data).then((r) => r.data),

  // User xem báo cáo của mình
  getMyReports: () =>
    api.get("/reports/my").then((r) => r.data),

  // Admin xem danh sách (filter theo status)
  getAdminReports: (status, page = 1, limit = 20) =>
    api.get("/reports", { params: { status, page, limit } }).then((r) => r.data),

  // Admin xem chi tiết
  getReportById: (id) =>
    api.get(`/reports/${id}`).then((r) => r.data),

  // Admin xử lý (resolved / dismissed / investigating)
  // violationLevel: "warning" | "minor" | "major" | undefined
  resolveReport: (id, { status, adminNote, violationLevel }) =>
    api.patch(`/reports/${id}/resolve`, { status, adminNote, violationLevel }).then((r) => r.data),

  // User đính kèm bằng chứng sau khi tạo báo cáo
  addEvidence: (reportId, mediaIds) =>
    api.post(`/reports/${reportId}/evidence`, { mediaIds }).then((r) => r.data),
};

export default reportService;
