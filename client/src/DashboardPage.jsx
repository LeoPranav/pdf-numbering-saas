import { useAuth, UserButton } from "@clerk/clerk-react";
import { useState } from "react";

function DashboardPage() {
  const { getToken } = useAuth();
  const [data, setData] = useState(null);
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrivateData = async () => {
    try {
      const token = await getToken();
      const response = await fetch("http://localhost:3000/api/dashboard-data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleFileChange = (event) => {
    setFile(event.target.files?.[0] ?? null);
    setError(null);
  };

  const handleUploadWithPageNumbers = async () => {
    if (!file) {
      setError("Please choose a PDF file first.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const token = await getToken();
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:3000/api/add-page-numbers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const msg = await response.text();
        throw new Error(msg || "Failed to process PDF");
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
    } catch (err) {
      console.error("Error uploading PDF:", err);
      setError(err.message || "Something went wrong while processing the PDF.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Dashboard</h2>
        <UserButton afterSignOutUrl="/" />
      </header>

      <section style={{ marginTop: "20px" }}>
        <h3>Test Protected API</h3>
        <button onClick={fetchPrivateData} style={{ marginTop: "10px" }}>
          Load Secret Server Data
        </button>

        {data && (
          <pre
            style={{
              background: "black",
              color: "white",
              padding: "10px",
              marginTop: "10px",
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </section>

      <section style={{ marginTop: "40px" }}>
        <h3>Add Page Numbers to PDF</h3>
        <p>Upload a PDF and download a new one with page numbers added.</p>

        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          style={{ display: "block", marginTop: "10px" }}
        />

        <button
          onClick={handleUploadWithPageNumbers}
          disabled={isUploading || !file}
          style={{ marginTop: "10px" }}
        >
          {isUploading ? "Processing..." : "Upload & Add Page Numbers"}
        </button>

        {error && (
          <p style={{ color: "red", marginTop: "10px" }}>
            {error}
          </p>
        )}
      </section>
    </div>
  );
}

export default DashboardPage;