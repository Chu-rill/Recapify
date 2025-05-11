import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import FileUpload from "../components/FileUpload";
import DocumentCard from "../components/DocumentCard";
import DeleteAccountModal from "../components/DeleteAccountModal";
import { useDocumentsStore } from "../store/documentsStore";
import { getDocuments } from "../services/document-service";
import { Document } from "../types/document";
import { toast } from "../components/ui/sonner";
import { Search } from "lucide-react";

const DashboardPage = () => {
  const { documents, setDocuments, isLoading, setLoading, error, setError } =
    useDocumentsStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await getDocuments();

        // Add a status field to each document if it doesn't exist
        const docsWithStatus = response.data.map((doc: Document) => ({
          ...doc,
          status: doc.status || "completed", // Default to 'completed' if not provided by API
        }));

        setDocuments(docsWithStatus);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError("Failed to load documents");
        toast.error("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [setDocuments, setLoading, setError]);

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Upload documents, view summaries, and generate audio
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <FileUpload />

          <div className="mt-8 bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Account Settings
            </h2>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full py-2 px-4 text-red-600 border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete Account
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Your Documents
            </h2>

            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block w-full pl-10 p-2.5"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 text-primary hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                {searchTerm ? (
                  <p>No documents match your search.</p>
                ) : (
                  <p>You haven't uploaded any documents yet.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredDocuments.map((doc) => (
                  <DocumentCard key={doc.id} document={doc} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </Layout>
  );
};

export default DashboardPage;
