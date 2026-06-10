import { useAuth, UserButton } from "@clerk/clerk-react";
import { useState, useEffect, useRef, useCallback } from "react";
import ThemeToggle from "./components/ThemeToggle";
import "./DashboardPage.css";

const API_BASE = "http://localhost:3000";

const POSITIONS = [
  { id: "top-left", label: "Top Left" },
  { id: "top-center", label: "Top Center" },
  { id: "top-right", label: "Top Right" },
  { id: "bottom-left", label: "Bottom Left" },
  { id: "bottom-center", label: "Bottom Center" },
  { id: "bottom-right", label: "Bottom Right" },
];

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [position, setPosition] = useState("bottom-center");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.warn("Failed to fetch history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // --- Drag and Drop ---
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setError(null);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (droppedFile.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }
      if (droppedFile.size > 10 * 1024 * 1024) {
        setError("File size must be under 10 MB.");
        return;
      }
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setError(null);
      setFile(selected);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- Process PDF ---
  const handleProcess = async () => {
    if (!file) {
      setError("Please upload a PDF file first.");
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("position", position);

      const response = await fetch(`${API_BASE}/api/add-page-numbers`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        let msg = "Failed to process PDF";
        try {
          const errData = await response.json();
          msg = errData.error || msg;
        } catch {
          msg = (await response.text()) || msg;
        }
        throw new Error(msg);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `paged-${file.name}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setToast({ type: "success", message: "PDF downloaded successfully!" });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Refresh history
      fetchHistory();
    } catch (err) {
      console.error("Error processing PDF:", err);
      setError(err.message || "Something went wrong while processing the PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Download from history ---
  const handleHistoryDownload = async (record) => {
    try {
      const token = await getToken();
      const res = await fetch(
        `${API_BASE}/api/history/${record._id}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Failed to download");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paged-${record.originalFileName}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setToast({ type: "success", message: "Downloaded from history!" });
    } catch (err) {
      setToast({ type: "error", message: "Failed to download file." });
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header">
        <div className="dash-header-logo">
          <div className="dash-header-logo-icon">#</div>
          <span>PageNum</span>
        </div>
        <div className="dash-header-actions">
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Content */}
      <main className="dash-content">
        <h1 className="dash-section-title">Add Page Numbers</h1>
        <p className="dash-section-subtitle">
          Upload a PDF, choose a position, and download your numbered document.
        </p>

        {/* Drop Zone */}
        <div
          className={`dropzone ${isDragOver ? "dropzone-active" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          id="pdf-dropzone"
        >
          <div className="dropzone-content">
            <div className="dropzone-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="dropzone-title">Drop your PDF here</p>
            <p className="dropzone-subtitle">
              or <span>browse to upload</span> · Max 10 MB
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
          />
        </div>

        {/* File Selected */}
        {file && (
          <div className="file-selected">
            <div className="file-selected-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div className="file-selected-info">
              <div className="file-selected-name">{file.name}</div>
              <div className="file-selected-size">{formatFileSize(file.size)}</div>
            </div>
            <button
              className="file-selected-remove"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              aria-label="Remove file"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}

        {/* Position Selector */}
        {file && (
          <div className="position-section">
            <p className="position-label">Page number position</p>
            <div className="position-grid">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.id}
                  className={`position-option ${position === pos.id ? "active" : ""}`}
                  onClick={() => setPosition(pos.id)}
                  id={`position-${pos.id}`}
                >
                  <div className={`position-page-preview pos-${pos.id}`}>
                    <div className="position-dot" />
                  </div>
                  <span className="position-option-label">{pos.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="error-message">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            {error}
          </div>
        )}

        {/* Process Button */}
        {file && (
          <div className="process-section">
            <button
              className="btn btn-primary"
              onClick={handleProcess}
              disabled={isProcessing}
              id="process-pdf-btn"
              style={{ width: "100%", padding: "14px" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Add Page Numbers & Download
            </button>
          </div>
        )}

        {/* History */}
        <div className="history-section">
          <div className="history-header">
            <h2>History</h2>
            <button className="btn btn-ghost btn-sm" onClick={fetchHistory}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh
            </button>
          </div>

          {historyLoading ? (
            <div className="history-empty">
              <div style={{ animation: "pulse 1.5s ease infinite" }}>
                Loading history...
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="history-empty">
              <div className="history-empty-icon">📄</div>
              No files processed yet. Upload a PDF to get started!
            </div>
          ) : (
            <div className="history-list">
              {history.map((record) => (
                <div className="history-item" key={record._id}>
                  <div className="history-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="history-info">
                    <div className="history-filename">
                      {record.originalFileName}
                    </div>
                    <div className="history-meta">
                      <span>{record.pageCount} pages</span>
                      <span>·</span>
                      <span>{formatFileSize(record.fileSize)}</span>
                      <span>·</span>
                      <span>{record.position?.replace("-", " ")}</span>
                      <span>·</span>
                      <span>{formatDate(record.processedAt)}</span>
                    </div>
                  </div>
                  <button
                    className="history-download"
                    onClick={() => handleHistoryDownload(record)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="loader-overlay">
          <div className="loader-card">
            <div className="loader-spinner" />
            <p className="loader-title">Processing your PDF</p>
            <p className="loader-subtitle">
              Adding page numbers at {position.replace("-", " ")}...
            </p>
            <div className="loader-progress-bar">
              <div className="loader-progress-fill" />
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === "success" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}