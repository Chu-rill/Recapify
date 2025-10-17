import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDocumentStore, useAudioStore } from "@/lib/store";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AudioPlayer } from "@/components/ui/audio-player";
import {
  Loader2,
  FileText,
  ArrowLeft,
  Headphones,
  AlertCircle,
  Download,
  Copy,
} from "lucide-react";
import { formatDate } from "@/lib/format";

export default function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const {
    documents,
    currentDocument,
    currentSummary,
    fetchDocuments,
    fetchSummary,
  } = useDocumentStore();
  const {
    audioList,

    fetchAudioList,
    generateAudio,
    isLoading: isAudioLoading,
  } = useAudioStore();

  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  useEffect(() => {
    const loadDocumentData = async () => {
      if (!documentId) return;

      try {
        // Fetch documents if not already loaded
        if (documents.length === 0) {
          await fetchDocuments();
        }

        // Fetch summary for this document
   
        setIsLoadingSummary(true);
        await fetchSummary(documentId);
        setIsLoadingSummary(false);

        // Fetch audio summaries
        await fetchAudioList();
      } catch (error) {
        setIsLoadingSummary(false);
        toast.error("Failed to load document data");
      }
    };

    loadDocumentData();
  }, [
    documentId,
    fetchDocuments,
    fetchSummary,
    fetchAudioList,
    documents.length,
  ]);

  const handleGenerateAudio = async () => {
    const summaryToUse = currentDoc?.summary || currentSummary;
    if (!summaryToUse) return;

    setIsGeneratingAudio(true);
    try {
      await generateAudio(summaryToUse.id);
      toast.success("Audio summary generated successfully");
    } catch (error) {
      toast.error("Failed to generate audio summary");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  // Find the audio for this document
  const documentAudio = audioList.find(
    (audio) => audio.documentId === documentId
  );

  // Find document from the documents list - renamed to avoid conflict with global document
  const currentDoc =
    documents.find((doc) => doc.id === documentId) || currentDocument;

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleDownloadAudio = (
    url: string,
    title: string,
    format: string = "mp3"
  ) => {
    const link = window.document.createElement("a");
    link.href = url;
    link.download = `${title || "audio-summary"}.${format}`;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const isLoading = isLoadingSummary || !currentDoc;

  // DEBUG LOGS
  // console.log("=== DOCUMENT DETAIL DEBUG ===");
  // console.log("documentId:", documentId);
  // console.log("all documents:", documents);
  // console.log("currentDoc:", currentDoc);
  // console.log("currentDoc.summary:", currentDoc?.summary);
  // console.log("currentSummary (from store):", currentSummary);
  // console.log("isLoadingSummary:", isLoadingSummary);
  // console.log("Render condition check:", {
  //   hasCurrentSummary: !!currentSummary,
  //   isLoadingSummary: isLoadingSummary,
  //   willRenderSummary: !!currentSummary && !isLoadingSummary
  // });
  // console.log("===========================");

  // Use summary from document if available, fallback to store
  const displaySummary = currentDoc?.summary || currentSummary;

  return (
    <div className="container py-8 md:py-12 mt-4">
      <Button
        variant="ghost"
        className="mb-8 gap-2 hover:bg-muted/50"
        onClick={() => navigate("/dashboard")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {currentDoc?.fileName}
                    </CardTitle>
                    <CardDescription>
                      {formatDate(currentDoc?.uploadedAt || "")}
                    </CardDescription>
                  </div>

                  {currentDoc?.processingStatus && (
                    <Badge variant="outline">
                      {currentDoc.processingStatus}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {displaySummary ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Short Summary
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {displaySummary.shortSummary}
                      </p>
                    </div>

                    <Separator />

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium">Full Summary</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1"
                          onClick={() => handleCopyText(displaySummary.content)}
                        >
                          <Copy className="h-4 w-4" />
                          <span>Copy</span>
                        </Button>
                      </div>
                      <div className="bg-muted/50 rounded-md p-4 max-h-[400px] overflow-y-auto">
                        <p className="whitespace-pre-line">
                          {displaySummary.content}
                        </p>
                      </div>
                    </div>

                    {displaySummary.keyPoints &&
                      displaySummary.keyPoints.length > 0 && (
                        <>
                          <Separator />

                          <div>
                            <h3 className="text-lg font-medium mb-2">
                              Key Points
                            </h3>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                              {displaySummary.keyPoints.map((point, index) => (
                                <li key={index}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      )}

                    {displaySummary.wasTruncated && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Note</AlertTitle>
                        <AlertDescription>
                          The document was too large and was truncated for
                          processing. Some information may be missing from the
                          summary.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : isLoadingSummary ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No summary available for this document.
                    </p>
                  </div>
                )}
              </CardContent>

              {displaySummary && !documentAudio && (
                <CardFooter>
                  <Button
                    onClick={handleGenerateAudio}
                    disabled={isGeneratingAudio || isAudioLoading}
                    className="gap-2"
                  >
                    {isGeneratingAudio || isAudioLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Headphones className="h-4 w-4" />
                    )}
                    {isGeneratingAudio
                      ? "Generating Audio..."
                      : "Generate Audio Summary"}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>

          <div>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Headphones className="h-5 w-5" />
                  Audio Summary
                </CardTitle>
                <CardDescription>
                  Listen to the generated audio summary
                </CardDescription>
              </CardHeader>

              <CardContent>
                {documentAudio ? (
                  <div className="space-y-4">
                    <AudioPlayer
                      src={documentAudio.fileUrl}
                      title={documentAudio.title}
                    />

                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() =>
                        handleDownloadAudio(
                          documentAudio.fileUrl,
                          documentAudio.title || "audio-summary",
                          documentAudio.format || "mp3"
                        )
                      }
                    >
                      <Download className="h-4 w-4" />
                      Download Audio
                    </Button>
                  </div>
                ) : isGeneratingAudio ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Generating audio summary...
                    </p>
                  </div>
                ) : displaySummary ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
                    <p className="text-muted-foreground">
                      No audio summary available yet.
                    </p>
                    <Button
                      onClick={handleGenerateAudio}
                      disabled={isGeneratingAudio || isAudioLoading}
                      className="gap-2"
                    >
                      {isGeneratingAudio || isAudioLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Headphones className="h-4 w-4" />
                      )}
                      Generate Audio
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-muted-foreground">
                      A summary is required before generating audio.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
