import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import { 
  Database, 
  ScanLine, 
  TrendingUp, 
  Activity,
  Plus,
  Eye,
  DollarSign
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCards } from '@/api/cards'
import { useToast } from '@/hooks/useToast'
import type { Card as CardType } from '@/api/cards'

export function Dashboard() {
  const [cards, setCards] = useState<CardType[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchCards = async () => {
      try {
        console.log('Fetching cards for dashboard...')
        const response = await getCards()
        setCards(response.cards.slice(0, 6)) // Show only first 6 cards
      } catch (error) {
        console.error('Failed to fetch cards:', error)
        toast({
          title: "Error",
          description: "Failed to load cards",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCards()
  }, [toast])

  const totalValue = cards.reduce((sum, card) => sum + card.estimatedValue, 0)
  const averageValue = cards.length > 0 ? totalValue / cards.length : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your card collection with AI-powered processing
          </p>
        </div>
        <Link to="/process">
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Process Cards
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Cards
            </CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {loading ? '...' : cards.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              ${loading ? '...' : totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              +8% from last week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Average Value
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              ${loading ? '...' : averageValue.toFixed(0)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Per card in collection
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Processing Status
            </CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              Idle
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ready to process
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Cards */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 dark:text-white">Recent Cards</CardTitle>
            <Link to="/database">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                View All
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-200 dark:bg-slate-700 rounded-lg h-48 mb-3"></div>
                  <div className="bg-slate-200 dark:bg-slate-700 rounded h-4 mb-2"></div>
                  <div className="bg-slate-200 dark:bg-slate-700 rounded h-3 w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card) => (
                <Link key={card._id} to={`/card/${card._id}`}>
                  <div className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700 aspect-[3/4] mb-3">
                      <ImageWithFallback
                        src={card.frontImage}
                        alt={card.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-white/90 text-slate-900">
                          ${card.estimatedValue.toLocaleString()}
                        </Badge>
                      </div>
                    </div>
                    <h3 className="font-medium text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {card.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {card.year} • {card.manufacturer}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}