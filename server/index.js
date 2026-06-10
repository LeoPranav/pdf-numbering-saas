import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import connectDB from "./db.js";
import History from "./models/History.js";

const app = express();

// Connect to MongoDB
connectDB();

// Enable CORS so your Vite frontend (port 5173) can talk to this server
app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);
app.use(express.json());

// Use memory storage so we can work with the PDF bytes directly
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Valid page number positions
const VALID_POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

/**
 * Calculate x, y coordinates for the page number text based on position.
 */
function getTextCoordinates(position, pageWidth, pageHeight, textWidth) {
  const margin = 40;
  const topY = pageHeight - margin;
  const bottomY = 30;

  switch (position) {
    case "top-left":
      return { x: margin, y: topY };
    case "top-center":
      return { x: (pageWidth - textWidth) / 2, y: topY };
    case "top-right":
      return { x: pageWidth - textWidth - margin, y: topY };
    case "bottom-left":
      return { x: margin, y: bottomY };
    case "bottom-right":
      return { x: pageWidth - textWidth - margin, y: bottomY };
    case "bottom-center":
    default:
      return { x: (pageWidth - textWidth) / 2, y: bottomY };
  }
}

// Public Route
app.get("/api/public", (req, res) => {
  res.json({ message: "This is public data. Anyone can see this." });
});

// Protected Route - requires a valid Clerk Token
app.get("/api/dashboard-data", ClerkExpressRequireAuth(), (req, res) => {
  const { userId } = req.auth;

  res.json({
    message: "Welcome to the protected API!",
    userId: userId,
  });
});

// Protected PDF processing route - adds page numbers and returns a new PDF
app.post(
  "/api/add-page-numbers",
  ClerkExpressRequireAuth(),
  upload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).json({ error: "Only PDF files are supported" });
      }

      // Get position from the form data, default to bottom-center
      const position = VALID_POSITIONS.includes(req.body.position)
        ? req.body.position
        : "bottom-center";

      const pdfDoc = await PDFDocument.load(req.file.buffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const totalPages = pages.length;

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const pageNumberText = `${index + 1} / ${totalPages}`;

        const fontSize = 12;
        const textWidth = font.widthOfTextAtSize(pageNumberText, fontSize);
        const { x, y } = getTextCoordinates(
          position,
          width,
          height,
          textWidth,
        );

        page.drawText(pageNumberText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0.4, 0.4, 0.4),
        });
      });

      const pdfBytes = await pdfDoc.save();

      // Save to history (non-blocking — don't let DB errors break the response)
      try {
        const { userId } = req.auth;
        await History.create({
          userId,
          originalFileName: req.file.originalname,
          originalFileData: req.file.buffer,
          processedFileData: Buffer.from(pdfBytes),
          pageCount: totalPages,
          position,
          fileSize: req.file.size,
        });
      } catch (dbErr) {
        console.warn("⚠️  Failed to save history:", dbErr.message);
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="pdf-with-page-numbers.pdf"',
      );
      return res.send(Buffer.from(pdfBytes));
    } catch (err) {
      return next(err);
    }
  },
);

// GET /api/history — fetch processing history for the authenticated user
app.get("/api/history", ClerkExpressRequireAuth(), async (req, res, next) => {
  try {
    const { userId } = req.auth;

    const records = await History.find({ userId })
      .select("-originalFileData -processedFileData") // Don't send file buffers in the list
      .sort({ processedAt: -1 })
      .limit(50)
      .lean();

    res.json(records);
  } catch (err) {
    return next(err);
  }
});

// GET /api/history/:id/download — re-download a processed PDF from history
app.get(
  "/api/history/:id/download",
  ClerkExpressRequireAuth(),
  async (req, res, next) => {
    try {
      const { userId } = req.auth;
      const record = await History.findOne({
        _id: req.params.id,
        userId,
      });

      if (!record) {
        return res.status(404).json({ error: "Record not found" });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="paged-${record.originalFileName}"`,
      );
      return res.send(record.processedFileData);
    } catch (err) {
      return next(err);
    }
  },
);

// Error handler for Auth and other errors
app.use((err, req, res, next) => {
  console.error("Server error details:", err);

  if (err?.message === "Unauthenticated") {
    return res
      .status(401)
      .json({ error: "You must be logged in to access this." });
  }

  const errorMessage =
    err?.message ||
    (typeof err === "string" ? err : JSON.stringify(err)) ||
    "Internal Server Error";

  res.status(500).json({ error: errorMessage });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`),
);