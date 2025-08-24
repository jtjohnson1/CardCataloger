import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, getCard, updateCard } from '../api/cards';
import { PriceComparison, getCardPricing } from '../api/pricing';
import { Button } from '../components/ui/button';
import { Card as UICard, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Separator } from '../components/ui/separator';
import { ArrowLeft, Edit, Save, X, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { ImageWithFallback } from '../components/ui/image-with-fallback';
import { getCardImageUrl } from '../api/cards';

export function CardDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [card, setCard] = useState<Card | null>(null);
  const [pricing, setPricing] = useState<PriceComparison | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingPricing, setIsRefreshingPricing] = useState(false);
  const [editedCard, setEditedCard] = useState<Partial<Card>>({});

  useEffect(() => {
    if (id) {
      fetchCard();
      fetchPricing();
    }
  }, [id]);

  const fetchCard = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const response = await getCard(id);
      setCard(response.card);
      setEditedCard(response.card);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load card details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPricing = async () => {
    if (!id) return;
    
    try {
      const response = await getCardPricing(id);
      setPricing(response.pricing);
    } catch (error) {
      console.error('Failed to load pricing data:', error);
    }
  };

  const handleSave = async () => {
    if (!id || !editedCard) return;

    try {
      setIsSaving(true);
      const response = await updateCard(id, editedCard);
      setCard(response.card);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Card updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update card",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedCard(card || {});
    setIsEditing(false);
  };

  const handleRefreshPricing = async () => {
    if (!id) return;
    
    try {
      setIsRefreshingPricing(true);
      // Note: refreshCardPricing function would need to be implemented
      await fetchPricing();
      toast({
        title: "Success",
        description: "Pricing data refreshed",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh pricing data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshingPricing(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading card details...</div>
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-muted-foreground">Card not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/database')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Database
          </Button>
          <h1 className="text-3xl font-bold">{card.name}</h1>
        </div>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Images */}
        <div className="lg:col-span-1">
          <UICard>
            <CardHeader>
              <CardTitle>Card Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Front Image */}
              <div>
                <Label className="text-sm font-medium">Front</Label>
                <div className="mt-2">
                  <ImageWithFallback
                    src={getCardImageUrl(card.images.front)}
                    alt={`${card.name} - Front`}
                    className="w-full h-auto rounded-lg border"
                    fallbackText="Front Image"
                  />
                </div>
              </div>

              {/* Back Image */}
              <div>
                <Label className="text-sm font-medium">Back</Label>
                <div className="mt-2">
                  {card.images.back ? (
                    <ImageWithFallback
                      src={getCardImageUrl(card.images.back)}
                      alt={`${card.name} - Back`}
                      className="w-full h-auto rounded-lg border"
                      fallbackText="Back Image"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-lg border flex items-center justify-center">
                      <span className="text-muted-foreground">No back image available</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </UICard>
        </div>

        {/* Card Details and Pricing */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
              <TabsTrigger value="details">Card Details</TabsTrigger>
              <TabsTrigger value="pricing">Price Comparison</TabsTrigger>
            </TabsList>

            {/* Card Details Tab */}
            <TabsContent value="details">
              <UICard>
                <CardHeader>
                  <CardTitle>Card Information</CardTitle>
                  <CardDescription>
                    Detailed information about this card
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Card Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          value={editedCard.name || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, name: e.target.value })}
                        />
                      ) : (
                        <div className="mt-1 text-sm">{card.name}</div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="manufacturer">Manufacturer</Label>
                      {isEditing ? (
                        <Input
                          id="manufacturer"
                          value={editedCard.manufacturer || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, manufacturer: e.target.value })}
                        />
                      ) : (
                        <div className="mt-1 text-sm">{card.manufacturer}</div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="year">Year</Label>
                      {isEditing ? (
                        <Input
                          id="year"
                          type="number"
                          value={editedCard.year || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, year: parseInt(e.target.value) })}
                        />
                      ) : (
                        <div className="mt-1 text-sm">{card.year}</div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="player">Player/Subject</Label>
                      {isEditing ? (
                        <Input
                          id="player"
                          value={editedCard.player || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, player: e.target.value })}
                        />
                      ) : (
                        <div className="mt-1 text-sm">{card.player}</div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="team">Team</Label>
                      {isEditing ? (
                        <Input
                          id="team"
                          value={editedCard.team || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, team: e.target.value })}
                        />
                      ) : (
                        <div className="mt-1 text-sm">{card.team}</div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      {isEditing ? (
                        <Input
                          id="cardNumber"
                          value={editedCard.cardNumber || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, cardNumber: e.target.value })}
                        />
                      ) : (
                        <div className="mt-1 text-sm">{card.cardNumber}</div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="series">Series</Label>
                      {isEditing ? (
                        <Input
                          id="series"
                          value={editedCard.series || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, series: e.target.value })}
                        />
                      ) : (
                        <div className="mt-1 text-sm">{card.series}</div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="condition">Condition</Label>
                      {isEditing ? (
                        <Input
                          id="condition"
                          value={editedCard.condition || ''}
                          onChange={(e) => setEditedCard({ ...editedCard, condition: e.target.value })}
                        />
                      ) : (
                        <Badge variant="secondary">{card.condition}</Badge>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label>File Information</Label>
                    <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                      <div><strong>Lot Number:</strong> {card.fileInfo.lotNumber}</div>
                      <div><strong>Iteration:</strong> {card.fileInfo.iteration}</div>
                      <div><strong>Front File:</strong> {card.fileInfo.frontFile}</div>
                      {card.fileInfo.backFile && (
                        <div><strong>Back File:</strong> {card.fileInfo.backFile}</div>
                      )}
                      <div><strong>Date Added:</strong> {new Date(card.dateAdded).toLocaleDateString()}</div>
                    </div>
                  </div>
                </CardContent>
              </UICard>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing">
              <UICard>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Price Comparison</CardTitle>
                      <CardDescription>
                        Market prices from various sources
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleRefreshPricing}
                      disabled={isRefreshingPricing}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshingPricing ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {pricing ? (
                    <div className="space-y-6">
                      {/* Price Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">${pricing.averagePrice.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">Average Price</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold">${pricing.medianPrice.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">Median Price</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="flex items-center justify-center space-x-2">
                            {getTrendIcon(pricing.trend)}
                            <span className="text-2xl font-bold capitalize">{pricing.trend}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">Price Trend</div>
                        </div>
                      </div>

                      {/* Price Range */}
                      <div>
                        <Label>Price Range</Label>
                        <div className="mt-2 text-sm">
                          ${pricing.priceRange.min.toFixed(2)} - ${pricing.priceRange.max.toFixed(2)}
                        </div>
                      </div>

                      {/* eBay Data */}
                      {pricing.sources.ebay && (
                        <div className="space-y-4">
                          <Separator />
                          <div>
                            <h4 className="font-semibold mb-2">eBay Recent Sales</h4>
                            {pricing.sources.ebay.recentSales.length > 0 ? (
                              <div className="space-y-2">
                                {pricing.sources.ebay.recentSales.slice(0, 5).map((sale, index) => (
                                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                    <div>
                                      <div className="font-medium">{sale.title}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {sale.condition} • {new Date(sale.date).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold">${sale.price.toFixed(2)}</div>
                                      {sale.shipping && (
                                        <div className="text-sm text-muted-foreground">
                                          +${sale.shipping.toFixed(2)} shipping
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-muted-foreground">No recent sales data available</div>
                            )}
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2">eBay Active Listings</h4>
                            {pricing.sources.ebay.activeListings.length > 0 ? (
                              <div className="space-y-2">
                                {pricing.sources.ebay.activeListings.slice(0, 5).map((listing, index) => (
                                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                                    <div>
                                      <div className="font-medium">{listing.title}</div>
                                      <div className="text-sm text-muted-foreground">{listing.condition}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold">${listing.price.toFixed(2)}</div>
                                      {listing.shipping && (
                                        <div className="text-sm text-muted-foreground">
                                          +${listing.shipping.toFixed(2)} shipping
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-muted-foreground">No active listings available</div>
                            )}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            Last updated: {new Date(pricing.sources.ebay.lastUpdated).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-muted-foreground">No pricing data available</div>
                    </div>
                  )}
                </CardContent>
              </UICard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}