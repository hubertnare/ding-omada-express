import { Wifi } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  return (
    <header className="w-full bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* DING Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-accent via-pink-500 to-primary rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">DING</h1>
              <p className="text-xs text-muted-foreground -mt-1">TECHNOLOGIES</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-secondary hidden sm:block">Making Technology Work for You</p>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Header;
