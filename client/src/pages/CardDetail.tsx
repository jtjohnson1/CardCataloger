import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Edit,
  ZoomIn
} from 'lucide-react'
import { getCardById } from '@/api/cards'
import { getPriceComparison } from '@/api/pricing'
import { useToast } from '@/hooks/useToast'
import type { Card as CardType } from '@/api/cards'
import type { PriceComparison } from '@/api/pricing'

export function CardDetail() {
  const { id } = useParams<{ id: string }>()
  const [card, setCard] = useState<CardType | null>(null)
  const [priceData, setPriceData] = useState<PriceComparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageZoom, setImageZoom] = useState<'front' | 'back' | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchCardData = async () => {
      if (!id) return

      console.log('CardDetail: Received ID from URL params:', id);
      console.log('CardDetail: ID type:', typeof id);
      console.log('CardDetail: ID length:', id.length);

      try {
        console.log('Fetching card details for ID:', id)
        const [cardResponse, priceResponse] = await Promise.all([
          getCardById(id),
          getPriceComparison(id)
        ])
        console.log('CardDetail: Successfully fetched card:', cardResponse.card);
        setCard(cardResponse.card)
        setPriceData(priceResponse)
      } catch (error) {
        console.error('Failed to fetch card data:', error)
        console.error('CardDetail: Error details:', {
          message: error.message,
          id: id,
          idType: typeof id
        });
        toast({
          title: "Error",
          description: "Failed to load card details",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCardData()
  }, [id, toast])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          <div className="w-48 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="w-full h-96 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="w-full h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="w-3/4 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="w-1/2 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (!card) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Card Not Found</h2>
        <Link to="/database">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Database
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/database">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{card.name}</h1>
            <p className="text-slate-600 dark:text-slate-400">
              {card.year} • {card.manufacturer} • #{card.cardNumber}
            </p>
          </div>
        </div>
        <Button variant="outline">
          <Edit className="w-4 h-4 mr-2" />
          Edit Card
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Images */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Card Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="relative group cursor-pointer" onClick={() => setImageZoom('front')}>
                  <ImageWithFallback
                    src={card.frontImage}
                    alt="Card Front"
                    className="w-full aspect-[3/4] object-cover rounded-lg border"
                    fallbackClassName="w-full aspect-[3/4] rounded-lg border"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <p className="text-center text-sm text-slate-600 dark:text-slate-400">Front</p>
              </div>

              {card.backImage ? (
                <div className="space-y-2">
                  <div className="relative group cursor-pointer" onClick={() => setImageZoom('back')}>
                    <ImageWithFallback
                      src={card.backImage}
                      alt="Card Back"
                      className="w-full aspect-[3/4] object-cover rounded-lg border"
                      fallbackClassName="w-full aspect-[3/4] rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <p className="text-center text-sm text-slate-600 dark:text-slate-400">Back</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-full aspect-[3/4] bg-slate-100 dark:bg-slate-700 rounded-lg border flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-slate-500 dark:text-slate-400">No back image available</p>
                    </div>
                  </div>
                  <p className="text-center text-sm text-slate-600 dark:text-slate-400">Back</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card Information */}
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Card Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Player</label>
                <p className="text-slate-900 dark:text-white">{card.player}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Sport</label>
                <p className="text-slate-900 dark:text-white">{card.sport}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Set</label>
                <p className="text-slate-900 dark:text-white">{card.set}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Series</label>
                <p className="text-slate-900 dark:text-white">{card.series}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Condition</label>
                <Badge variant="secondary">{card.condition}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Estimated Value</label>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${card.estimatedValue.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-slate-900 dark:text-white mb-2">File Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-slate-600 dark:text-slate-400">Lot Number</label>
                  <p className="text-slate-900 dark:text-white font-mono">{card.lotNumber}</p>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400">Iteration</label>
                  <p className="text-slate-900 dark:text-white font-mono">{card.iteration}</p>
                </div>
                <div>
                  <label className="text-slate-600 dark:text-slate-400">Date Added</label>
                  <p className="text-slate-900 dark:text-white">{new Date(card.dateAdded).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Price Comparison */}
      {priceData && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-white">Price Comparison</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Updated: {new Date(priceData.lastUpdated).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  ${priceData.averagePrice.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Average Price</div>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  ${priceData.medianPrice.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Median Price</div>
              </div>
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  ${priceData.priceRange.min.toLocaleString()} - ${priceData.priceRange.max.toLocaleString()}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Price Range</div>
              </div>
            </div>

            <Tabs defaultValue="ebay-sold" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ebay-sold">eBay Sold</TabsTrigger>
                <TabsTrigger value="ebay-active">eBay Active</TabsTrigger>
                <TabsTrigger value="other">Other Sources</TabsTrigger>
              </TabsList>

              <TabsContent value="ebay-sold" className="space-y-4">
                <div className="space-y-2">
                  {priceData.sources.ebay.recentSales.map((sale, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{sale.condition}</Badge>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Sold on {new Date(sale.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-slate-900 dark:text-white">
                          ${sale.price.toLocaleString()}
                        </span>
                        {sale.url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={sale.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="ebay-active" className="space-y-4">
                <div className="space-y-2">
                  {priceData.sources.ebay.activeListings.map((listing, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{listing.condition}</Badge>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Listed on {new Date(listing.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-slate-900 dark:text-white">
                          ${listing.price.toLocaleString()}
                        </span>
                        {listing.url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={listing.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="other" className="space-y-4">
                <div className="space-y-2">
                  {priceData.sources.other.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{source.source}</Badge>
                        <Badge variant="secondary">{source.condition}</Badge>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {new Date(source.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-slate-900 dark:text-white">
                          ${source.price.toLocaleString()}
                        </span>
                        {source.url && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={source.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Image Zoom Modal */}
      {imageZoom && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setImageZoom(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <ImageWithFallback
              src={imageZoom === 'front' ? card.frontImage : card.backImage}
              alt={`Card ${imageZoom}`}
              className="max-w-full max-h-full object-contain rounded-lg"
              fallbackClassName="max-w-full max-h-full rounded-lg flex items-center justify-center bg-slate-100 dark:bg-slate-700"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 bg-white/90 hover:bg-white"
              onClick={() => setImageZoom(null)}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}