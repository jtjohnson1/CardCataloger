import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'
import {
  Search,
  Filter,
  Trash2,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Image as ImageIcon,
  Images,
  Plus
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getCards, deleteCards, createCard } from '@/api/cards'
import { useToast } from '@/hooks/useToast'
import type { Card as CardType } from '@/api/cards'

type SortField = 'name' | 'manufacturer' | 'year' | 'estimatedValue' | 'dateAdded'
type SortDirection = 'asc' | 'desc'

export function CardDatabase() {
  const [cards, setCards] = useState<CardType[]>([])
  const [filteredCards, setFilteredCards] = useState<CardType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>('dateAdded')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('')
  const [yearFilter, setYearFilter] = useState<string>('')
  const [wildcard, setWildcard] = useState('')
  const [showAddCardDialog, setShowAddCardDialog] = useState(false)
  const [addingCard, setAddingCard] = useState(false)
  const [newCard, setNewCard] = useState({
    name: '',
    manufacturer: '',
    year: '',
    player: '',
    series: '',
    cardNumber: '',
    estimatedValue: 0,
    sport: '',
    set: '',
    condition: '',
    lotNumber: '',
    iteration: '',
    frontImage: '',
    backImage: ''
  })
  const { toast } = useToast()

  useEffect(() => {
    console.log('CardDatabase: Component mounted, fetching cards...');
  }, []);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        setLoading(true);
        console.log('CardDatabase: Calling getCards API...');
        const response = await getCards();
        console.log('CardDatabase: Received cards data:', response.cards);
        console.log('CardDatabase: First card ID:', response.cards[0]?._id);
        console.log('CardDatabase: All card IDs:', response.cards.map(card => card._id));
        setCards(response.cards);
      } catch (error) {
        console.error('CardDatabase: Failed to fetch cards:', error);
        toast({
          title: "Error",
          description: "Failed to load cards",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCards()
  }, [toast]);

  useEffect(() => {
    let filtered = [...cards]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(card =>
        card.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.player.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.year.includes(searchTerm)
      )
    }

    // Manufacturer filter
    if (manufacturerFilter) {
      filtered = filtered.filter(card => card.manufacturer === manufacturerFilter)
    }

    // Year filter
    if (yearFilter) {
      filtered = filtered.filter(card => card.year === yearFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'estimatedValue') {
        aValue = Number(aValue)
        bValue = Number(bValue)
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    console.log('CardDatabase: Filtered cards:', filtered.length);
    console.log('CardDatabase: Filtered card IDs:', filtered.map(card => card._id));
    setFilteredCards(filtered)
  }, [cards, searchTerm, manufacturerFilter, yearFilter, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = () => {
    if (selectedCards.length === filteredCards.length) {
      setSelectedCards([])
    } else {
      setSelectedCards(filteredCards.map(card => card._id))
    }
  }

  const handleCardSelect = (cardId: string) => {
    setSelectedCards(prev =>
      prev.includes(cardId)
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    )
  }

  const handleDeleteSelected = async () => {
    try {
      console.log('Deleting selected cards:', selectedCards)
      await deleteCards(selectedCards)
      setCards(prev => prev.filter(card => !selectedCards.includes(card._id)))
      setSelectedCards([])
      toast({
        title: "Success",
        description: `${selectedCards.length} cards deleted successfully`
      })
    } catch (error) {
      console.error('Failed to delete cards:', error)
      toast({
        title: "Error",
        description: "Failed to delete cards",
        variant: "destructive"
      })
    }
  }

  const handleWildcardDelete = async () => {
    if (!wildcard.trim()) return

    const pattern = wildcard.replace(/\*/g, '.*')
    const regex = new RegExp(pattern, 'i')

    const cardsToDelete = cards.filter(card =>
      regex.test(card.name) ||
      regex.test(card.manufacturer) ||
      regex.test(card.year) ||
      regex.test(card.lotNumber)
    )

    if (cardsToDelete.length === 0) {
      toast({
        title: "No matches",
        description: "No cards match the wildcard pattern"
      })
      return
    }

    try {
      console.log('Wildcard deleting cards:', cardsToDelete.map(c => c._id))
      await deleteCards(cardsToDelete.map(c => c._id))
      setCards(prev => prev.filter(card => !cardsToDelete.some(c => c._id === card._id)))
      toast({
        title: "Success",
        description: `${cardsToDelete.length} cards deleted successfully`
      })
      setWildcard('')
    } catch (error) {
      console.error('Failed to delete cards:', error)
      toast({
        title: "Error",
        description: "Failed to delete cards",
        variant: "destructive"
      })
    }
  }

  const handleAddCard = async () => {
    try {
      setAddingCard(true)
      console.log('CardDatabase: Starting to add new card:', newCard)

      // Validate required fields
      if (!newCard.name || !newCard.lotNumber || !newCard.iteration) {
        console.error('CardDatabase: Validation failed - missing required fields')
        toast({
          title: "Error",
          description: "Name, lot number, and iteration are required fields",
          variant: "destructive"
        })
        return
      }

      console.log('CardDatabase: Calling createCard API...')
      const response = await createCard(newCard)
      console.log('CardDatabase: createCard API response:', response)

      // Add the new card to the list
      console.log('CardDatabase: Adding card to local state...')
      setCards(prev => {
        const newCards = [response.card, ...prev]
        console.log('CardDatabase: Updated cards list length:', newCards.length)
        return newCards
      })

      // Reset form and close dialog
      setNewCard({
        name: '',
        manufacturer: '',
        year: '',
        player: '',
        series: '',
        cardNumber: '',
        estimatedValue: 0,
        sport: '',
        set: '',
        condition: '',
        lotNumber: '',
        iteration: '',
        frontImage: '',
        backImage: ''
      })
      setShowAddCardDialog(false)

      console.log('CardDatabase: Card creation completed successfully')
      toast({
        title: "Success",
        description: "Card created successfully"
      })
    } catch (error) {
      console.error('CardDatabase: Failed to create card:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to create card",
        variant: "destructive"
      })
    } finally {
      setAddingCard(false)
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
  }

  const manufacturers = [...new Set(cards.map(card => card.manufacturer))].sort()
  const years = [...new Set(cards.map(card => card.year))].sort()

  console.log('CardDatabase: Rendering with', filteredCards.length, 'filtered cards');
  console.log('CardDatabase: Loading state:', loading);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Card Database</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Browse and manage your card collection
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {filteredCards.length} cards
          </Badge>
          <Dialog open={showAddCardDialog} onOpenChange={setShowAddCardDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-800 max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-900 dark:text-white">Add New Card</DialogTitle>
                <DialogDescription>
                  Enter the details for the new card. Fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Card Name *</Label>
                  <Input
                    id="name"
                    value={newCard.name}
                    onChange={(e) => setNewCard(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter card name"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={newCard.manufacturer}
                    onChange={(e) => setNewCard(prev => ({ ...prev, manufacturer: e.target.value }))}
                    placeholder="e.g., Topps, Panini"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    value={newCard.year}
                    onChange={(e) => setNewCard(prev => ({ ...prev, year: e.target.value }))}
                    placeholder="e.g., 1989"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="player">Player</Label>
                  <Input
                    id="player"
                    value={newCard.player}
                    onChange={(e) => setNewCard(prev => ({ ...prev, player: e.target.value }))}
                    placeholder="Player name"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="series">Series</Label>
                  <Input
                    id="series"
                    value={newCard.series}
                    onChange={(e) => setNewCard(prev => ({ ...prev, series: e.target.value }))}
                    placeholder="Series name"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    value={newCard.cardNumber}
                    onChange={(e) => setNewCard(prev => ({ ...prev, cardNumber: e.target.value }))}
                    placeholder="e.g., 1, 250"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimatedValue">Estimated Value ($)</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    value={newCard.estimatedValue}
                    onChange={(e) => setNewCard(prev => ({ ...prev, estimatedValue: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sport">Sport</Label>
                  <Input
                    id="sport"
                    value={newCard.sport}
                    onChange={(e) => setNewCard(prev => ({ ...prev, sport: e.target.value }))}
                    placeholder="e.g., Baseball, Basketball"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="set">Set</Label>
                  <Input
                    id="set"
                    value={newCard.set}
                    onChange={(e) => setNewCard(prev => ({ ...prev, set: e.target.value }))}
                    placeholder="Set name"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={newCard.condition} onValueChange={(value) => setNewCard(prev => ({ ...prev, condition: value }))}>
                    <SelectTrigger className="bg-white dark:bg-slate-900">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mint">Mint</SelectItem>
                      <SelectItem value="Near Mint">Near Mint</SelectItem>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Very Good">Very Good</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lotNumber">Lot Number *</Label>
                  <Input
                    id="lotNumber"
                    value={newCard.lotNumber}
                    onChange={(e) => setNewCard(prev => ({ ...prev, lotNumber: e.target.value }))}
                    placeholder="e.g., box1a"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="iteration">Iteration *</Label>
                  <Input
                    id="iteration"
                    value={newCard.iteration}
                    onChange={(e) => setNewCard(prev => ({ ...prev, iteration: e.target.value }))}
                    placeholder="e.g., 00001"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frontImage">Front Image URL</Label>
                  <Input
                    id="frontImage"
                    value={newCard.frontImage}
                    onChange={(e) => setNewCard(prev => ({ ...prev, frontImage: e.target.value }))}
                    placeholder="URL to front image"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backImage">Back Image URL</Label>
                  <Input
                    id="backImage"
                    value={newCard.backImage}
                    onChange={(e) => setNewCard(prev => ({ ...prev, backImage: e.target.value }))}
                    placeholder="URL to back image (optional)"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowAddCardDialog(false)}
                  disabled={addingCard}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddCard}
                  disabled={addingCard}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {addingCard ? 'Adding...' : 'Add Card'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-900 dark:text-white">
            <Filter className="w-5 h-5 mr-2" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-900"
              />
            </div>

            <Select value={manufacturerFilter} onValueChange={setManufacturerFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <SelectValue placeholder="All Manufacturers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-manufacturers">All Manufacturers</SelectItem>
                {manufacturers.map(manufacturer => (
                  <SelectItem key={manufacturer} value={manufacturer}>
                    {manufacturer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="bg-white dark:bg-slate-900">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-years">All Years</SelectItem>
                {years.map(year => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex space-x-2">
              <Input
                placeholder="Wildcard delete (e.g., *1989*)"
                value={wildcard}
                onChange={(e) => setWildcard(e.target.value)}
                className="bg-white dark:bg-slate-900"
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={!wildcard.trim()}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white dark:bg-slate-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Wildcard Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will delete all cards matching the pattern "{wildcard}". This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleWildcardDelete} className="bg-red-600 hover:bg-red-700">
                      Delete Matching Cards
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedCards.length > 0 && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {selectedCards.length} cards selected
              </span>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Selected
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white dark:bg-slate-800">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete {selectedCards.length} selected cards? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteSelected} className="bg-red-600 hover:bg-red-700">
                      Delete Cards
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards Table */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCards.length === filteredCards.length && filteredCards.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-32">Images</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('name')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Card Name
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('manufacturer')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Manufacturer
                      {getSortIcon('manufacturer')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('year')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Year
                      {getSortIcon('year')}
                    </Button>
                  </TableHead>
                  <TableHead>Player</TableHead>
                  <TableHead>Series</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('estimatedValue')}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      Value
                      {getSortIcon('estimatedValue')}
                    </Button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <div className="w-12 h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                          <div className="w-12 h-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                        </div>
                      </TableCell>
                      <TableCell><div className="w-32 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-16 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="w-16 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  filteredCards.map((card) => {
                    console.log('CardDatabase: Rendering table row for card:', card._id, card.name);
                    return (
                      <TableRow key={card._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedCards.includes(card._id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCards([...selectedCards, card._id]);
                              } else {
                                setSelectedCards(selectedCards.filter(id => id !== card._id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <ImageWithFallback
                              src={card.frontImage}
                              alt="Card Front"
                              className="w-12 h-16 object-cover rounded border"
                              fallbackClassName="w-12 h-16 rounded border"
                            />
                            {card.backImage && (
                              <ImageWithFallback
                                src={card.backImage}
                                alt="Card Back"
                                className="w-12 h-16 object-cover rounded border"
                                fallbackClassName="w-12 h-16 rounded border"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/card/${card._id}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={() => {
                              console.log('CardDatabase: Navigating to card with ID:', card._id);
                              console.log('CardDatabase: Full card object:', card);
                            }}
                          >
                            {card.name}
                          </Link>
                        </TableCell>
                        <TableCell>{card.manufacturer}</TableCell>
                        <TableCell>{card.year}</TableCell>
                        <TableCell>{card.player}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{card.series}</div>
                            <div className="text-sm text-slate-500">#{card.cardNumber}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            ${card.estimatedValue.toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              onClick={() => handleCardSelect(card._id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => handleCardSelect(card._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}