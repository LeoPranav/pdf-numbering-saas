import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";

const app = express();

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
    secretData: "The Krabby Patty formula is...",
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
        return res.status(400).send("No file uploaded");
      }

      if (req.file.mimetype !== "application/pdf") {
        return res.status(400).send("Only PDF files are supported");
      }

      const pdfDoc = await PDFDocument.load(req.file.buffer);
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const totalPages = pages.length;

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const pageNumberText = `${index + 1} / ${totalPages}`;

        const fontSize = 12;
        const textWidth = font.widthOfTextAtSize(pageNumberText, fontSize);
        const x = (width - textWidth) / 2;
        const y = 30;

        page.drawText(pageNumberText, {
          x,
          y,
          size: fontSize,
          font,
          color: rgb(0, 0, 0),
        });
      });

      const pdfBytes = await pdfDoc.save();

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

// Error handler for Auth and other errors
app.use((err, req, res, next) => {
  if (err?.message === "Unauthenticated") {
    res.status(401).json({ error: "You must be logged in to access this." });
  } else {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Backend running on http://localhost:${PORT}`),
);