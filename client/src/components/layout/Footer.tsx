import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
          <Link to="/" className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-semibold">Recapify</span>
          </Link>
          
          <p className="text-xs text-muted-foreground md:text-sm">
            © {new Date().getFullYear()} Recapify. All rights reserved.
          </p>
        </div>
        
        <nav className="flex gap-4 sm:gap-6">
          <Link
            to="/privacy"
            className="text-xs text-muted-foreground transition-colors hover:text-primary md:text-sm"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="text-xs text-muted-foreground transition-colors hover:text-primary md:text-sm"
          >
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}