import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  Calculator,
  ChevronDown,
  LogOut,
  PanelLeft,
  Shield,
  User,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';

interface TerraFusionHeaderProps {
  isLanding?: boolean;
}

export default function TerraFusionHeader({ isLanding = false }: TerraFusionHeaderProps) {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (logout) {
      try {
        await logout();
        toast({ description: 'Session terminated.' });
        navigate('/auth');
      } catch {
        window.location.href = '/api/logout';
      }
    } else {
      window.location.href = '/api/logout';
    }
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '48px',
        padding: '0 16px',
        background: 'hsl(var(--background))',
        borderBottom: '1px solid hsl(var(--border))',
        flexShrink: 0,
      }}
    >
      {/* Left: logo + sidebar toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {!isLanding && (
          <button
            onClick={toggleSidebar}
            style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--muted-foreground))',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <PanelLeft size={16} />
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Calculator size={14} color="hsl(var(--background))" />
          </div>
          <span
            style={{
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: 'hsl(var(--foreground))',
            }}
          >
            CostForge
          </span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              color: 'hsl(var(--accent) / 0.7)',
              textTransform: 'uppercase',
            }}
          >
            Cost Approach
          </span>
        </div>
      </div>

      {/* Right: user menu (nav lives in sidebar — no duplicate links here) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  color: 'hsl(var(--foreground))',
                  fontSize: '12px',
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <User size={12} color="hsl(var(--background))" />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                  {user?.name || 'Assessor'}
                </span>
                <ChevronDown size={12} style={{ color: 'hsl(var(--muted-foreground))' }} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel style={{ fontSize: '11px' }}>
                Benton County
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <Shield size={14} />
                  Preferences
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                style={{ color: 'hsl(var(--destructive))', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <LogOut size={14} />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" variant="ghost" asChild>
            <Link href="/auth">Sign In</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

