import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/mode-toggle";
import { FileText, Menu, User, LogOut, Home, UploadCloud } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">Recapify</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild className="lg:hidden ml-4">
              <Button variant="outline" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="grid gap-4 py-4">
                <Link
                  to="/"
                  className="flex items-center space-x-2 text-sm font-medium"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="flex items-center space-x-2 text-sm font-medium"
                    >
                      <FileText className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center space-x-2 text-sm font-medium"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                    <Button
                      variant="ghost"
                      className="flex items-center justify-start space-x-2 px-2"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </Button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center space-x-2 text-sm font-medium"
                    >
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/signup"
                      className="flex items-center space-x-2 text-sm font-medium"
                    >
                      <span>Sign Up</span>
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <nav className="hidden flex-1 lg:flex lg:gap-6 lg:justify-center">
          <Link
            to="/"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Home
          </Link>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="flex-1 sm:grow-0"></div>

          <ModeToggle />

          {isAuthenticated ? (
            <>
              <Button
                variant="outline"
                className="hidden md:flex gap-2"
                onClick={() => navigate("/dashboard")}
              >
                <UploadCloud className="h-4 w-4" />
                Upload Document
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.username ? getInitials(user.username) : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.username && (
                        <p className="font-medium">{user.username}</p>
                      )}
                      {user?.email && (
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard">
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="hidden sm:flex sm:items-center sm:gap-2">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="default">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
