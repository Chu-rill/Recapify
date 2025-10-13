import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-8rem)] pt-16">
      <div className="max-w-md w-full mx-auto px-4 py-10 space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-8xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-3xl font-semibold">Page not found</h2>
          <p className="text-muted-foreground text-lg">
            Sorry, the page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button
            variant="default"
            size="lg"
            className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          >
            <Home className="h-4 w-4" />
            {isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}