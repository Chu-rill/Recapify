import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { FileText, Upload, Headphones, Sparkles } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)]">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-background to-background/95">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                Transform Documents into Audio Summaries with AI
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                Upload documents, get AI-powered summaries, and listen to them on the go.
                Save time and increase productivity with Recapify.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 min-[400px]:w-auto justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Get Started Free'}
              </Button>
              
              {!isAuthenticated && (
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                How It Works
              </h2>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
                Our powerful AI technology makes document summarization and audio conversion simple.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
              <div className="flex flex-col items-center space-y-2 p-6 bg-card rounded-lg shadow-sm">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                  <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold">Upload</h3>
                <p className="text-muted-foreground text-center">
                  Upload any document in seconds. We support PDFs, Word docs, and more.
                </p>
              </div>
              
              <div className="flex flex-col items-center space-y-2 p-6 bg-card rounded-lg shadow-sm">
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                  <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold">Summarize</h3>
                <p className="text-muted-foreground text-center">
                  Our AI extracts the key points and creates concise, accurate summaries.
                </p>
              </div>
              
              <div className="flex flex-col items-center space-y-2 p-6 bg-card rounded-lg shadow-sm">
                <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                  <Headphones className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold">Listen</h3>
                <p className="text-muted-foreground text-center">
                  Convert summaries to audio and listen anytime, anywhere, on any device.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                Ready to save time and boost productivity?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-lg">
                Join thousands of professionals who use Recapify to consume information more efficiently.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 min-[400px]:w-auto justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Start for Free'}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}