import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Document } from "@/types";
import { useDocumentStore } from "@/lib/store";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/format";

interface DocumentsListProps {
  documents: Document[];
}

export default function DocumentsList({ documents }: DocumentsListProps) {
  const navigate = useNavigate();
  const { deleteDocument, isLoading } = useDocumentStore();

  const handleViewDocument = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  const handleDeleteDocument = async (
    documentId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    if (
      confirm(
        "Are you sure you want to delete this document? This action cannot be undone."
      )
    ) {
      try {
        await deleteDocument(documentId);
        toast.success("Document deleted successfully");
      } catch (error) {
        toast.error("Failed to delete document");
      }
    }
  };

  const getStatusBadge = (processingStatus?: string) => {
    // Log the actual status for debugging
    // console.log("Document status:", processingStatus);

    // Normalize the status (handle case sensitivity and undefined)
    const status = processingStatus?.toUpperCase() || "";

    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
          >
            Pending
          </Badge>
        );
      case "PROCESSING":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
          >
            Processing
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
          >
            Completed
          </Badge>
        );
      case "FAILED":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
          >
            Failed
          </Badge>
        );
      default:
        console.warn(`Unknown processing status: ${processingStatus}`);
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No documents found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {documents.map((document) => (
        <Card
          key={document.id}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => handleViewDocument(document.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-primary/10 rounded-md">
                  <FileText className="h-5 w-5 text-primary" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium text-sm line-clamp-1">
                    {document.fileName || "Unnamed Document"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(document.uploadedAt)}
                  </p>
                </div>
              </div>

              <div>{getStatusBadge(document.processingStatus)}</div>
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0 flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="flex gap-1"
              disabled={isLoading}
              onClick={(e) => handleDeleteDocument(document.id, e)}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              <span className="sr-only md:not-sr-only md:inline-block">
                Delete
              </span>
            </Button>

            <Button variant="outline" size="sm" className="flex gap-1">
              <ExternalLink className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:inline-block">
                View
              </span>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
