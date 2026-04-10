import React from 'react';
import { Link } from 'wouter';
import { HelpCircle, FileText, Mail, Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/50 py-6 px-4 md:px-6">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center">
              <div
                className="h-8 w-8 rounded-md flex items-center justify-center mr-2"
                style={{ background: 'hsl(var(--primary))' }}
              >
                <span className="font-bold text-lg" style={{ color: 'hsl(var(--primary-foreground))' }}>CF</span>
              </div>
              <span className="text-xl font-bold text-foreground">CostForge</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Benton County Assessor's Office — cost approach valuation and assessment platform.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-3">Resources</h3>
            <ul className="space-y-2">
              <li><Link href="/documentation" className="text-sm text-muted-foreground hover:text-primary transition-colors">Documentation</Link></li>
              <li><Link href="/tutorials" className="text-sm text-muted-foreground hover:text-primary transition-colors">Tutorials</Link></li>
              <li><Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/resources" className="text-sm text-muted-foreground hover:text-primary transition-colors">Resource Library</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-3">Features</h3>
            <ul className="space-y-2">
              <li><Link href="/calculator" className="text-sm text-muted-foreground hover:text-primary transition-colors">Cost Calculator</Link></li>
              <li><Link href="/properties" className="text-sm text-muted-foreground hover:text-primary transition-colors">Property Database</Link></li>
              <li><Link href="/analytics" className="text-sm text-muted-foreground hover:text-primary transition-colors">Analytics Dashboard</Link></li>
              <li><Link href="/ai-tools" className="text-sm text-muted-foreground hover:text-primary transition-colors">AI Tools</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-foreground mb-3">Help &amp; Support</h3>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start text-sm h-9">
                <HelpCircle className="h-4 w-4 mr-2" />
                <span>Help Center</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm h-9">
                <FileText className="h-4 w-4 mr-2" />
                <span>Submit a Ticket</span>
              </Button>
              <Button variant="outline" className="w-full justify-start text-sm h-9">
                <Mail className="h-4 w-4 mr-2" />
                <span>Contact Support</span>
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col md:flex-row justify-between items-center mt-6 text-sm text-muted-foreground">
          <div className="mb-4 md:mb-0">
            © {currentYear} CostForge — Benton County Assessor's Office
          </div>
          <div className="flex space-x-6">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
            <a
              href="https://github.com/benton-county/terrabuild"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center hover:text-primary transition-colors"
            >
              <Github className="h-4 w-4 mr-1" />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
