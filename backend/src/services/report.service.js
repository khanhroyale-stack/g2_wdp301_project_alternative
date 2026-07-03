const EventEmitter = require("events");

class ReportEmitter extends EventEmitter {}
const reportEvents = new ReportEmitter();

const processReport = async (reportId, action, adminId, note) => {
  // Logic xử lý report sẽ viết ở đây
  
  // Phát ra event để người 1 (Reputation) lắng nghe và trừ điểm
  // reportEvents.emit("report_resolved", { reportedUserId, penaltyPoints });
};

module.exports = {
  processReport,
  reportEvents,
};
