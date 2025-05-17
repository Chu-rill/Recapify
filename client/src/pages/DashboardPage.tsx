import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Alert, AlertDescription } from "@/components/ui/alert";
import UploadDocumentForm from "@/components/documents/UploadDocumentForm";
import DocumentsList from "@/components/documents/DocumentsList";
import AudioList from "@/components/audio/AudioList";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  // const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("documents");

  const {
    documents,
    isLoading: isDocumentLoading,
    // error: documentError,
    uploadProgress,
    fetchDocuments,
  } = useDocumentStore();

  const {
    audioList,
    isLoading: isAudioLoading,
    // error: audioError,
    fetchAudioList,
  } = useAudioStore();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        await fetchDocuments();
        await fetchAudioList();
      } catch (error) {
        toast.error("Failed to load dashboard data");
      }
    };

    loadDashboardData();
  }, [fetchDocuments, fetchAudioList]);

  const isLoading = isDocumentLoading || isAudioLoading;
  // const hasError = documentError || audioError;

  // Function to handle view all documents click
  const handleViewAllDocuments = () => {
    // First update the active tab
    setActiveTab("documents");

    // Then scroll to the documents section
    const documentsSection = document.querySelector('[data-value="documents"]');
    if (documentsSection) {
      documentsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Upload documents, view summaries, and generate audio.
          </p>
        </div>

        {/* {hasError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {documentError || audioError}
            </AlertDescription>
          </Alert>
        )} */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Document</CardTitle>
              <CardDescription>
                Upload a document to generate an AI summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadDocumentForm />

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4 space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-xs text-center text-muted-foreground">
                    Uploading: {uploadProgress}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>
                Your recently uploaded documents and summaries
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    You haven't uploaded any documents yet.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                  >
                    Upload Your First Document
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-md">
                  <DocumentsList documents={documents.slice(0, 3)} />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button
                variant="ghost"
                className="w-full"
                onClick={handleViewAllDocuments}
              >
                View All Documents
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Tabs
          defaultValue="documents"
          value={activeTab}
          onValueChange={setActiveTab}
          data-value={activeTab}
        >
          <TabsList>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="audio">Audio Summaries</TabsTrigger>
          </TabsList>
          <TabsContent
            value="documents"
            className="mt-6"
            data-value="documents"
          >
            <Card>
              <CardHeader>
                <CardTitle>All Documents</CardTitle>
                <CardDescription>
                  Manage your documents and summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isDocumentLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : documents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      You haven't uploaded any documents yet.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                    >
                      Upload Your First Document
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-md">
                    <DocumentsList documents={documents} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="audio" className="mt-6" data-value="audio">
            <Card>
              <CardHeader>
                <CardTitle>Audio Summaries</CardTitle>
                <CardDescription>
                  Listen to your generated audio summaries
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAudioLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : audioList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-muted-foreground mb-4">
                      You haven't generated any audio summaries yet.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("documents")}
                    >
                      View Documents to Generate Audio
                    </Button>
                  </div>
                ) : (
                  <AudioList audioList={audioList} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
