import { useState, useRef, ChangeEvent } from "react";
import { uploadDocument } from "../services/document-service";
import { useDocumentsStore } from "../store/documentsStore";
import { toast } from "./ui/sonner";
import { Upload } from "lucide-react";

const FileUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addDocument } = useDocumentsStore();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);

      // Simulate upload progress - in a real app, you might use axios progress events
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      const response = await uploadDocument(file);
      clearInterval(progressInterval);
      setUploadProgress(100);

      addDocument({
        ...response.data,
        status: "pending",
      });

      toast.success("File uploaded successfully");

      // Reset form after successful upload
      setFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      toast.error("Error uploading file");
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white">
      <div
        className="flex flex-col items-center justify-center cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          accept=".pdf,.doc,.docx,.txt"
        />

        <div className="rounded-full bg-primary/10 p-4 mb-4">
          <Upload size={24} className="text-primary" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Upload a document
          </h3>
          <p className="text-sm text-gray-500">
            {file ? file.name : "Drag & drop a file or click to browse"}
          </p>
          <p className="text-xs text-gray-400">
            Supported formats: PDF, DOC, DOCX, TXT
          </p>
        </div>
      </div>

      {file && (
        <div className="mt-6">
          {uploading ? (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-center text-gray-500">
                Uploading... {uploadProgress}%
              </p>
            </div>
          ) : (
            <button
              onClick={handleUpload}
              className="w-full py-2 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Upload File
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
