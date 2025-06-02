import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/lib/store';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-12rem)]">
      <div className="max-w-md w-full mx-auto px-4 py-10 space-y-6 text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="text-2xl font-semibold">Page not found</h2>
        <p className="text-muted-foreground">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="default" 
            className="gap-2"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          >
            <Home className="h-4 w-4" />
            {isAuthenticated ? 'Back to Dashboard' : 'Back to Home'}
          </Button>
          
          <Button 
            variant="outline" 
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