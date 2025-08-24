import { NavLink, useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { 
  Home, 
  ScanLine, 
  Database, 
  Settings, 
  Activity,
  Zap
} from "lucide-react"
import { Badge } from "./ui/badge"
import { useSystemStatus } from "@/hooks/useSystemStatus"

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Process Cards', href: '/process', icon: ScanLine },
  { name: 'Card Database', href: '/database', icon: Database },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const location = useLocation()
  const { systemStatus } = useSystemStatus()

  return (
    <div className="w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">CardVault</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Collection Manager</p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">System Status</span>
              <Badge variant={systemStatus.overall === 'healthy' ? 'default' : 'destructive'} className="text-xs">
                {systemStatus.overall}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Activity className="w-3 h-3" />
                  <span>Database</span>
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  systemStatus.database ? "bg-green-500" : "bg-red-500"
                )} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Zap className="w-3 h-3" />
                  <span>Ollama AI</span>
                </div>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  systemStatus.ollama ? "bg-green-500" : "bg-red-500"
                )} />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}