import { useRef } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useDocumentStore } from "@/lib/store";
import { Upload, FileX } from "lucide-react";

interface UploadDocumentFormProps {
  onUploadSuccess?: () => void; // Add this prop
}

export default function UploadDocumentForm({
  onUploadSuccess,
}: UploadDocumentFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument, isLoading } = useDocumentStore();

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    // Check file size (max 4MB)
    const MAX_SIZE = 4 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    try {
      console.log("Uploading file:", file);
      await uploadDocument(file);

      // Call the callback if provided
      onUploadSuccess?.();

      toast.success("Document uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload document");
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
        // "application/msword": [".doc"],
        // "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        //   [".docx"],
        // "text/plain": [".txt"],
      },
      maxFiles: 1,
      disabled: isLoading,
    });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md px-6 py-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary/70 bg-primary/5"
            : isDragReject
            ? "border-destructive/70 bg-destructive/5"
            : "border-input hover:border-primary/50 hover:bg-accent"
        }`}
      >
        <input
          {...getInputProps()}
          id="file-upload"
          className="sr-only"
          ref={fileInputRef}
        />

        {isDragActive ? (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">
              Drop the file here...
            </p>
          </div>
        ) : isDragReject ? (
          <div className="flex flex-col items-center">
            <FileX className="h-10 w-10 text-destructive mb-2" />
            <p className="text-sm text-destructive">Unsupported file type</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm font-medium mb-1">Drag and drop a file</p>
            <p className="text-xs text-muted-foreground mb-2">
              {/*  PDF, Word, or Text document (max 10MB)*/}
              PDF(max 4MB)
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              Browse Files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
