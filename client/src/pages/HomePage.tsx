import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuthStore } from "../store/authStore";
import { FileText, Headphones, Zap } from "lucide-react";

const HomePage = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Layout>
      <div className="pb-16 pt-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Transform Documents into{" "}
            <span className="text-primary">Audio Summaries</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Upload any document and instantly get AI-powered summaries and audio
            recordings. Save time and consume content on the go.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to={isAuthenticated ? "/dashboard" : "/signup"}
              className="px-8 py-3 rounded-md shadow-md text-white bg-primary hover:bg-primary/90 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="px-8 py-3 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Log In
              </Link>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24">
          <h2 className="text-3xl font-bold text-center mb-12">
            How Recapify Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="bg-primary/10 p-3 rounded-lg inline-block mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload Documents</h3>
              <p className="text-gray-600">
                Upload any document in popular formats like PDF, DOC, DOCX, or
                TXT. Our system processes them securely.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="bg-primary/10 p-3 rounded-lg inline-block mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Summarization</h3>
              <p className="text-gray-600">
                Our advanced AI analyzes and summarizes your document,
                extracting the most important information.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="bg-primary/10 p-3 rounded-lg inline-block mb-4">
                <Headphones className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Listen on the Go</h3>
              <p className="text-gray-600">
                Convert summaries to audio files and listen anywhere. Perfect
                for commutes, workouts, or multitasking.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-24 bg-primary rounded-xl p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
            Ready to save time and be more productive?
          </h2>
          <Link
            to={isAuthenticated ? "/dashboard" : "/signup"}
            className="inline-block px-8 py-3 rounded-md shadow-md bg-white text-primary hover:bg-gray-100 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {isAuthenticated ? "Go to Dashboard" : "Start Using Recapify"}
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
