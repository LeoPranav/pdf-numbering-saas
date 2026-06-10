import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  originalFileName: {
    type: String,
    required: true,
  },
  originalFileData: {
    type: Buffer,
    required: true,
  },
  processedFileData: {
    type: Buffer,
    required: true,
  },
  pageCount: {
    type: Number,
    required: true,
  },
  position: {
    type: String,
    required: true,
    enum: [
      "top-left",
      "top-center",
      "top-right",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ],
  },
  fileSize: {
    type: Number,
    required: true,
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
});

const History = mongoose.model("History", historySchema);

export default History;
