import mongoose from "mongoose";

export default async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.warn(
        "⚠️  MONGODB_URI not set in .env — history features will be unavailable.",
      );
      return;
    }

    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    // Don't crash the server — PDF processing can still work without history
  }
}
