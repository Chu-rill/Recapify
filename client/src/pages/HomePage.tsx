import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/store";
import { Upload, Headphones, Sparkles } from "lucide-react";

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-gradient-to-b from-background to-background/95">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container px-4 md:px-6 relative">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="space-y-4 max-w-4xl">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent leading-tight">
                Transform Documents into Audio Summaries with AI
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl leading-relaxed">
                Upload documents, get AI-powered summaries, and listen to them
                on the go. Save time and increase productivity with Recapify.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-lg px-8 py-6"
                onClick={() =>
                  navigate(isAuthenticated ? "/dashboard" : "/signup")
                }
              >
                {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
              </Button>

              {!isAuthenticated && (
                <Button
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-6"
                  onClick={() => navigate("/login")}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-8 text-center">
            <div className="space-y-3 max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tighter md:text-5xl">
                How It Works
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground text-lg md:text-xl">
                Our powerful AI technology makes document summarization and
                audio conversion simple.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-8 w-full max-w-6xl">
              <div className="flex flex-col items-center space-y-4 p-8 bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600">
                  <Upload className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold">Upload</h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Upload any document in seconds. We support PDFs, Word docs,
                  and more.
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4 p-8 bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 rounded-full bg-gradient-to-br from-purple-500 to-purple-600">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold">Summarize</h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Our AI extracts the key points and creates concise, accurate
                  summaries.
                </p>
              </div>

              <div className="flex flex-col items-center space-y-4 p-8 bg-card rounded-xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-4 rounded-full bg-gradient-to-br from-orange-500 to-orange-600">
                  <Headphones className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold">Listen</h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  Convert summaries to audio and listen anytime, anywhere, on
                  any device.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-8 text-center max-w-4xl mx-auto">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter md:text-5xl">
                Ready to save time and boost productivity?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground text-lg md:text-xl leading-relaxed">
                Join thousands of professionals who use Recapify to consume
                information more efficiently.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center pt-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-lg px-8 py-6"
                onClick={() =>
                  navigate(isAuthenticated ? "/dashboard" : "/signup")
                }
              >
                {isAuthenticated ? "Go to Dashboard" : "Start for Free"}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
