import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import { 
  Home, 
  Database, 
  Settings, 
  Scan,
  AlertCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useSystemStatus } from '../hooks/useSystemStatus';

export function Sidebar() {
  const location = useLocation();
  const { status, isLoading } = useSystemStatus();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Process Cards', href: '/process', icon: Scan },
    { name: 'Card Database', href: '/database', icon: Database },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const getStatusIcon = () => {
    if (isLoading) return <AlertCircle className="h-4 w-4 text-gray-400 animate-pulse" />;
    
    switch (status?.overall) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    if (isLoading) return 'Checking...';
    
    if (!status) return 'Unknown';
    
    const isDevelopment = status.details?.environment?.developmentMode;
    
    switch (status.overall) {
      case 'healthy':
        if (isDevelopment && !status.ollama) {
          return 'Ready for Development';
        }
        return 'All Systems Operational';
      case 'warning':
        if (isDevelopment && !status.ollama) {
          return 'Database OK (AI Optional)';
        }
        return 'Some Issues Detected';
      case 'error':
        return 'System Issues';
      default:
        return 'Status Unknown';
    }
  };

  const getStatusDetails = () => {
    if (!status) return null;
    
    const isDevelopment = status.details?.environment?.developmentMode;
    
    return (
      <div className="text-xs text-muted-foreground mt-1">
        <div>DB: {status.database ? '✓' : '✗'}</div>
        <div>
          AI: {status.ollama ? '✓' : isDevelopment ? '○' : '✗'}
          {isDevelopment && !status.ollama && (
            <span className="ml-1" title="AI features disabled - install Ollama or use Docker">
              (Disabled)
            </span>
          )}
        </div>
        {isDevelopment && (
          <div className="text-blue-400">Dev Mode</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-semibold">CardCataloger</h1>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <div className="flex items-start space-x-2">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              System Status
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {getStatusText()}
            </div>
            {getStatusDetails()}
          </div>
        </div>
      </div>
    </div>
  );
}