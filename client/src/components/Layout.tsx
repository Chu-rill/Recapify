import { ReactNode } from "react";
import Navbar from "./Navbar";
import { ThemeProvider } from "./ThemeProvider";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <Navbar />
        <main className="flex-grow py-6 px-4 sm:px-6 md:px-8 container mx-auto max-w-7xl">
          {children}
        </main>
        <footer className="bg-white dark:bg-gray-800 shadow-inner py-6 px-4 border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto max-w-7xl text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© 2025 Recapify. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
};

export default Layout;
