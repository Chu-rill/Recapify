import { Link } from "react-router-dom";
import { Document } from "../types/document";
import {
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  Loader,
} from "lucide-react";

interface DocumentCardProps {
  document: Document;
}

const DocumentCard = ({ document }: DocumentCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const getStatusIcon = () => {
    switch (document.status) {
      case "pending":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "processing":
        return <Loader className="w-5 h-5 text-primary animate-spin" />;
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusText = () => {
    switch (document.status) {
      case "pending":
        return "Pending";
      case "processing":
        return "Processing";
      case "completed":
        return "Completed";
      case "failed":
        return "Failed";
      default:
        return "Pending";
    }
  };

  return (
    <Link
      to={`/document/${document.id}`}
      className="block bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 p-2 rounded-md">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-medium text-gray-900 truncate max-w-[200px]">
              {document.name}
            </h3>
          </div>
          <div className="flex items-center space-x-1">
            {getStatusIcon()}
            <span className="text-xs">{getStatusText()}</span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="text-xs text-gray-500">
            <span>{formatDate(document.createdAt)}</span>
          </div>
          <div className="bg-primary/5 text-xs text-primary rounded-full px-2 py-1">
            {document.fileType.toUpperCase()}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default DocumentCard;
