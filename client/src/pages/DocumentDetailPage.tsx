import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AudioPlayer from "../components/AudioPlayer";
import { useDocumentsStore } from "../store/documentsStore";
import { getDocument } from "../services/document-service";
import { getSummary, generateSummary } from "../services/summary-service";
import { generateAudio } from "../services/audio-service";
import { Document } from "../types/document";
import { Summary } from "../types/summary";
import { Audio } from "../types/audio";
import { toast } from "../components/ui/sonner";
import { ArrowLeft, FileText, Zap, Headphones } from "lucide-react";

const DocumentDetailPage = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const [document, setDocument] = useState<Document | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [audio, setAudio] = useState<Audio | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "keyPoints">(
    "summary"
  );
  const { setSelectedDocument } = useDocumentsStore();

  useEffect(() => {
    if (!documentId) return;

    const fetchDocumentDetails = async () => {
      try {
        setIsLoading(true);

        // Fetch document
        const docResponse = await getDocument(documentId);
        setDocument(docResponse.data);
        setSelectedDocument(docResponse.data);

        // Try to fetch summary
        try {
          const summaryResponse = await getSummary(documentId);
          setSummary(summaryResponse.data);

          // If summary exists, try to check if audio exists as well
          // This is a placeholder since we don't have a specific endpoint to check for audio by documentId
          // In a real implementation, you might need to adjust this logic
        } catch (error) {
          // Summary doesn't exist yet, which is okay
          console.log("No summary available yet");
        }
      } catch (error) {
        console.error("Error fetching document details:", error);
        toast.error("Failed to load document details");
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentDetails();
  }, [documentId, navigate, setSelectedDocument]);

  const handleGenerateSummary = async () => {
    if (!documentId) return;

    try {
      setIsSummarizing(true);
      const response = await generateSummary(documentId);
      setSummary(response.data);
      toast.success("Summary generated successfully");
    } catch (error) {
      console.error("Error generating summary:", error);
      toast.error("Failed to generate summary");
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!summary) return;

    try {
      setIsGeneratingAudio(true);
      const response = await generateAudio(summary.id);
      setAudio(response.data);
      toast.success("Audio generated successfully");
    } catch (error) {
      console.error("Error generating audio:", error);
      toast.error("Failed to generate audio");
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!document) {
    return (
      <Layout>
        <div className="text-center py-10">
          <p className="text-red-500">Document not found</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Go back to Dashboard
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center text-gray-600 hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Document header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary/10 p-2 rounded-md">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                {document.name}
              </h1>
            </div>
            <div className="text-sm text-gray-500">
              {new Date(document.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Document content */}
        <div className="px-6 py-4">
          {!summary ? (
            <div className="text-center py-10">
              <p className="text-gray-600 mb-4">
                This document hasn't been summarized yet.
              </p>
              <button
                onClick={handleGenerateSummary}
                disabled={isSummarizing}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {isSummarizing ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" /> Generate Summary
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              {/* Summary / Key Points tabs */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6">
                  <button
                    onClick={() => setActiveTab("summary")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "summary"
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Full Summary
                  </button>
                  <button
                    onClick={() => setActiveTab("keyPoints")}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === "keyPoints"
                        ? "border-primary text-primary"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    Key Points
                  </button>
                </nav>
              </div>

              {/* Summary content */}
              <div className="py-4">
                {activeTab === "summary" ? (
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Summary
                    </h3>
                    <p className="whitespace-pre-line text-gray-700">
                      {summary.content}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      Key Points
                    </h3>
                    <ul className="list-disc pl-5 space-y-2">
                      {summary.keyPoints.map((point, index) => (
                        <li key={index} className="text-gray-700">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Audio section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Audio Summary
                </h3>

                {audio ? (
                  <AudioPlayer audio={audio} />
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <div className="flex justify-center mb-4">
                      <Headphones className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-gray-600 mb-4">
                      Generate an audio version of this summary to listen on the
                      go.
                    </p>
                    <button
                      onClick={handleGenerateAudio}
                      disabled={isGeneratingAudio}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    >
                      {isGeneratingAudio ? (
                        <>
                          <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          Generating Audio...
                        </>
                      ) : (
                        <>
                          <Headphones className="mr-2 h-4 w-4" /> Generate Audio
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default DocumentDetailPage;
