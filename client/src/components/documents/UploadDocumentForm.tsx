import { useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/lib/store";
import { Upload, FileX, FileCheck } from "lucide-react";
import {
  FILE_SIZE_LIMITS,
  SUPPORTED_FILE_TYPES,
  formatFileSize,
} from "@/services/documents";

interface UploadDocumentFormProps {
  onUploadSuccess?: () => void;
}

export default function UploadDocumentForm({
  onUploadSuccess,
}: UploadDocumentFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument, isLoading } = useDocumentStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setSelectedFile(file);

    try {
      console.log("Uploading file:", file.name, formatFileSize(file.size));
      await uploadDocument(file);

      // Call the callback if provided
      onUploadSuccess?.();

      toast.success(`${file.name} uploaded successfully!`);
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload document";
      toast.error(errorMessage);
      setSelectedFile(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: SUPPORTED_FILE_TYPES,
      maxFiles: 1,
      maxSize: FILE_SIZE_LIMITS.MAX_FILE_SIZE,
      disabled: isLoading,
      onDropRejected: (fileRejections) => {
        const rejection = fileRejections[0];
        if (rejection.errors[0].code === "file-too-large") {
          toast.error(
            `File is too large. Maximum size is ${formatFileSize(FILE_SIZE_LIMITS.MAX_FILE_SIZE)}`
          );
        } else if (rejection.errors[0].code === "file-invalid-type") {
          toast.error("Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.");
        } else {
          toast.error(rejection.errors[0].message);
        }
      },
    });

  const maxSizeMB = FILE_SIZE_LIMITS.MAX_FILE_SIZE / (1024 * 1024);

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg px-6 py-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-primary/70 bg-primary/5 scale-[1.02]"
            : isDragReject
            ? "border-destructive/70 bg-destructive/5"
            : isLoading
            ? "border-muted bg-muted/20 cursor-not-allowed"
            : "border-input hover:border-primary/50 hover:bg-accent/50"
        }`}
      >
        <input
          {...getInputProps()}
          id="file-upload"
          className="sr-only"
          ref={fileInputRef}
        />

        {isLoading ? (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-2 animate-pulse" />
            <p className="text-sm font-medium mb-1">Uploading...</p>
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-primary mb-2 animate-bounce" />
            <p className="text-sm font-medium text-primary">
              Drop the file here...
            </p>
          </div>
        ) : isDragReject ? (
          <div className="flex flex-col items-center">
            <FileX className="h-10 w-10 text-destructive mb-2" />
            <p className="text-sm font-medium text-destructive">
              Unsupported file type
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Please upload PDF, DOC, DOCX, or TXT files
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="p-3 rounded-full bg-primary/10 mb-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium mb-1">
              Drag and drop your file here
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              PDF, Word, or Text document (max {maxSizeMB}MB)
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="gap-2"
            >
              <FileCheck className="h-4 w-4" />
              Browse Files
            </Button>
          </div>
        )}
      </div>

      {selectedFile && !isLoading && (
        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md text-sm">
          <FileCheck className="h-4 w-4 text-primary" />
          <span className="flex-1 truncate">{selectedFile.name}</span>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(selectedFile.size)}
          </span>
        </div>
      )}
    </div>
  );
}
