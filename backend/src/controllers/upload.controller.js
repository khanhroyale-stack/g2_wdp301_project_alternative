const uploadImages = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }
    // Return relative URLs so the frontend can display them correctly
    const urls = req.files.map(file => `/uploads/${file.filename}`);
    res.status(200).json({ success: true, urls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadImages };
