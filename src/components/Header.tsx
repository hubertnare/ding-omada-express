import { Wifi } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full bg-card border-b border-border">
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
        
        <p className="text-sm font-medium text-secondary">Making Technology Work for You</p>
      </div>
    </header>
  );
};

export default Header;
