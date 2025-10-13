import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Document } from "@/types";
import { useDocumentStore, useSummaryStore } from "@/lib/store";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, ExternalLink, Loader2, RefreshCw, Sparkles } from "lucide-react";
import { formatDate } from "@/lib/format";

interface DocumentsListProps {
  documents: Document[];
}

export default function DocumentsList({ documents }: DocumentsListProps) {
  const navigate = useNavigate();
  const { deleteDocument, isLoading } = useDocumentStore();
  const { generateSummary, isLoading: isSummaryLoading } = useSummaryStore();

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

  const handleRetrySummary = async (
    documentId: string,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    try {
      toast.info("Retrying summary generation...");
      await generateSummary(documentId);
      toast.success("Summary generated successfully!");
      // Refresh documents list to show updated status
      window.location.reload();
    } catch (error) {
      toast.error("Failed to generate summary. Please try again.");
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
            className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 flex items-center gap-1.5"
          >
            <Sparkles className="h-3 w-3 animate-pulse" />
            Summarizing...
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
      {documents.map((document) => {
        const status = document.processingStatus?.toUpperCase();
        const isProcessing = status === "PROCESSING" || !status || status === "PENDING";
        const isFailed = status === "FAILED";

        return (
          <Card
            key={document.id}
            className={`cursor-pointer hover:bg-muted/50 transition-colors ${
              isProcessing ? "border-blue-300 dark:border-blue-800" : ""
            } ${isFailed ? "border-red-300 dark:border-red-800" : ""}`}
            onClick={() => handleViewDocument(document.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start space-x-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-md ${
                    isProcessing
                      ? "bg-blue-100 dark:bg-blue-900"
                      : isFailed
                      ? "bg-red-100 dark:bg-red-900"
                      : "bg-primary/10"
                  }`}>
                    {isProcessing ? (
                      <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                    ) : (
                      <FileText className={`h-5 w-5 ${
                        isFailed ? "text-red-600 dark:text-red-400" : "text-primary"
                      }`} />
                    )}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <h3 className="font-medium text-sm line-clamp-1 break-words">
                      {document.fileName || "Unnamed Document"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(document.uploadedAt)}
                    </p>
                    {isProcessing && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        AI is analyzing your document...
                      </p>
                    )}
                    {isFailed && (
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        Summary generation failed
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">{getStatusBadge(document.processingStatus)}</div>
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

              {isFailed ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex gap-1 text-blue-600 border-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-950"
                  disabled={isSummaryLoading}
                  onClick={(e) => handleRetrySummary(document.id, e)}
                >
                  {isSummaryLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="sr-only md:not-sr-only md:inline-block">
                    Retry Summary
                  </span>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex gap-1"
                  disabled={isProcessing}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only md:not-sr-only md:inline-block">
                    View
                  </span>
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
