import { useAuthStore } from "@/store/useAuthStore";
import { useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { User as UserIcon } from "lucide-react";
import logo from "../../../assets/images/logo.svg";
import { Compass } from "lucide-react";
import { FolderKanban } from "lucide-react";

interface AuthUser {
  username: string;
  email: string;
  profile_picture?: string | null;
}

export default function Navbar() {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const location = useLocation();

  const isAuthenticated = !!(token && user);
  const isExplorePage = location.pathname === "/";
  const isMyProjectsPage = location.pathname === "/my-projects";

  return (
    <nav className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-10 flex justify-between items-center h-20">
        <a href="/">
          <img src={logo} alt="WordIT Logo" className="h-8" />
        </a>

        {isAuthenticated ? (
          <>
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-2">
              <Button variant={isExplorePage ? "secondary" : "ghost"} asChild>
                <a href="/" className="flex items-center gap-2">
                  <Compass />
                  <span>Explore</span>
                </a>
              </Button>

              <Button
                variant={isMyProjectsPage ? "secondary" : "ghost"}
                asChild
              >
                <a href="/my-projects" className="flex items-center gap-2">
                  <FolderKanban />
                  <span>My Projects</span>
                </a>
              </Button>
            </div>

            <div className="hidden md:block">
              <ProfileDropdown user={user} />
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden">
              <MobileMenu user={user} />
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <a href="/login">Login</a>
            </Button>
            <Button variant="default" asChild>
              <a href="/register">Register</a>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}

function ProfileDropdown({ user }: { user: AuthUser | null }) {
  const logout = useAuthStore((state) => state.logout);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-3 cursor-pointer">
          <Avatar className="w-9 h-9">
            <AvatarImage
              src={
                user?.profile_picture
                  ? `${import.meta.env.VITE_API_URL}/${user.profile_picture}`
                  : undefined
              }
              alt="User Avatar"
            />
            <AvatarFallback>
              {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>

          <span className="text-sm font-medium text-slate-900">
            {user?.username ?? "User"}
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="flex flex-col py-2 px-2 border-b">
          <p className="font-semibold text-sm mb-1">{user?.username}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <DropdownMenuItem asChild className="cursor-pointer py-2.5">
          <a href="/profile" className="flex items-center">
            <UserIcon className="w-4 h-4 mr-2" />
            Profile
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer py-2.5">
          <a href="/my-projects" className="flex items-center">
            <FolderKanban className="w-4 h-4 mr-2" />
            My Projects
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer py-2.5 text-red-600 focus:text-red-600"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2 text-red-500" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileMenu({ user }: { user: AuthUser | null }) {
  const logout = useAuthStore((state) => state.logout);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <div className="flex flex-col py-2 px-2 border-b">
          <div className="flex items-center gap-3 mb-2">
            <Avatar className="w-8 h-8">
              <AvatarImage
                src={
                  user?.profile_picture
                    ? `${import.meta.env.VITE_API_URL}/${user.profile_picture}`
                    : undefined
                }
                alt="User Avatar"
              />
              <AvatarFallback>
                {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <p className="font-semibold text-sm">{user?.username}</p>
          </div>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <DropdownMenuItem asChild className="cursor-pointer py-2.5">
          <a href="/" className="flex items-center">
            <Compass className="w-4 h-4 mr-2" />
            Explore
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer py-2.5">
          <a href="/my-projects" className="flex items-center">
            <FolderKanban className="w-4 h-4 mr-2" />
            My Projects
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="cursor-pointer py-2.5">
          <a href="/profile" className="flex items-center">
            <UserIcon className="w-4 h-4 mr-2" />
            Profile
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer py-2.5 text-red-600 focus:text-red-600"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2 text-red-500" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
