import { Wifi } from "lucide-react";

interface HeaderProps {
  mallName?: string;
}

const Header = ({ mallName = "Shopping Mall" }: HeaderProps) => {
  return (
    <header className="w-full bg-card border-b border-border">
      <div className="container py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* DING Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Wifi className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary tracking-tight">DING</h1>
              <p className="text-xs text-muted-foreground -mt-1">TECHNOLOGIES</p>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">OMADA Vouchers</p>
          <p className="text-xs text-muted-foreground">for {mallName}</p>
        </div>
      </div>
    </header>
  );
};

export default Header;
