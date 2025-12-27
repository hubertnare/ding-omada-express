import { MessageCircle, Shield } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full bg-card border-t border-border mt-auto">
      <div className="container py-6 space-y-4">
        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-success" />
            Secure Payment
          </span>
          <span className="text-border">|</span>
          <span>24/7 Support</span>
        </div>

        {/* WhatsApp Support */}
        <div className="text-center">
          <a
            href="https://wa.me/263771234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <MessageCircle className="w-4 h-4" />
            Need help? WhatsApp +263 77 123 4567
          </a>
        </div>

        {/* Branding */}
        <div className="text-center text-xs text-muted-foreground">
          Powered by <span className="font-semibold text-primary">DING Technologies</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
