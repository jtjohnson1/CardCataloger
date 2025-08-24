import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  FolderOpen,
  ScanLine,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Images
} from 'lucide-react'
import { scanDirectory, processCards, getProcessingProgress } from '@/api/cards'
import { useToast } from '@/hooks/useToast'
import type { ProcessingProgress } from '@/api/cards'
import { ImageWithFallback } from '@/components/ui/image-with-fallback'

interface ScannedCard {
  frontImage: string
  backImage?: string
  lotNumber: string
  iteration: string
}

export function ProcessCards() {
  const [directory, setDirectory] = useState('/tmp/test-cards')
  const [includeSubdirectories, setIncludeSubdirectories] = useState(true)
  const [scannedCards, setScannedCards] = useState<ScannedCard[]>([])
  const [selectedCards, setSelectedCards] = useState<string[]>([])
  const [scanning, setScanning] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<ProcessingProgress | null>(null)
  const [jobId, setJobId] = useState<string | null>(null)
  const [scanResults, setScanResults] = useState<{
    totalImages: number
    validPairs: number
    singleCards: number
  } | null>(null)
  const { toast } = useToast()

  const handleScanDirectory = async () => {
    if (!directory.trim()) {
      toast({
        title: "Error",
        description: "Please enter a directory path",
        variant: "destructive"
      })
      return
    }

    setScanning(true)
    try {
      console.log('Scanning directory:', directory)
      const response = await scanDirectory({ directory, includeSubdirectories })
      setScannedCards(response.cards)
      setScanResults({
        totalImages: response.totalImages,
        validPairs: response.validPairs,
        singleCards: response.singleCards
      })
      toast({
        title: "Success",
        description: `Found ${response.cards.length} cards to process`
      })
    } catch (error) {
      console.error('Failed to scan directory:', error)
      toast({
        title: "Error",
        description: "Failed to scan directory",
        variant: "destructive"
      })
    } finally {
      setScanning(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedCards.length === scannedCards.length) {
      setSelectedCards([])
    } else {
      setSelectedCards(scannedCards.map((_, index) => index.toString()))
    }
  }

  const handleCardSelect = (index: string) => {
    setSelectedCards(prev =>
      prev.includes(index)
        ? prev.filter(id => id !== index)
        : [...prev, index]
    )
  }

  const handleProcessCards = async () => {
    if (selectedCards.length === 0) {
      toast({
        title: "Error",
        description: "Please select cards to process",
        variant: "destructive"
      })
      return
    }

    setProcessing(true)
    try {
      console.log('Processing cards:', selectedCards)
      const response = await processCards({
        directory,
        includeSubdirectories,
        selectedCards
      })
      setJobId(response.jobId)
      toast({
        title: "Success",
        description: "Card processing started"
      })
    } catch (error) {
      console.error('Failed to start processing:', error)
      toast({
        title: "Error",
        description: "Failed to start processing",
        variant: "destructive"
      })
      setProcessing(false)
    }
  }

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (processing && jobId) {
      interval = setInterval(async () => {
        try {
          const progressData = await getProcessingProgress(jobId)
          setProgress(progressData)

          if (progressData.completed === progressData.total) {
            setProcessing(false)
            toast({
              title: "Complete",
              description: "Card processing finished successfully"
            })
          }
        } catch (error) {
          console.error('Failed to get progress:', error)
        }
      }, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [processing, jobId, toast])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Process Cards</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Scan directories and process card images with AI recognition
        </p>
      </div>

      {/* Directory Selection */}
      <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-slate-900 dark:text-white">
            <FolderOpen className="w-5 h-5 mr-2" />
            Directory Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="directory">Source Directory</Label>
            <Input
              id="directory"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              placeholder="/path/to/card/images"
              className="bg-white dark:bg-slate-900"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="subdirectories"
              checked={includeSubdirectories}
              onCheckedChange={(checked) => setIncludeSubdirectories(checked as boolean)}
            />
            <Label htmlFor="subdirectories">Include subdirectories (recursive scan)</Label>
          </div>

          <Button
            onClick={handleScanDirectory}
            disabled={scanning}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            {scanning ? (
              <>
                <ScanLine className="w-4 h-4 mr-2 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <ScanLine className="w-4 h-4 mr-2" />
                Scan Directory
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scanResults && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">Scan Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {scanResults.totalImages}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Total Images</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {scanResults.validPairs}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Valid Pairs</div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {scanResults.singleCards}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Single Cards</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card Selection */}
      {scannedCards.length > 0 && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-white">
                Card Selection ({selectedCards.length} of {scannedCards.length} selected)
              </CardTitle>
              <div className="space-x-2">
                <Button variant="outline" onClick={handleSelectAll}>
                  {selectedCards.length === scannedCards.length ? 'Deselect All' : 'Select All'}
                </Button>
                <Button
                  onClick={handleProcessCards}
                  disabled={selectedCards.length === 0 || processing}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Process Selected Cards
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {scannedCards.map((card, index) => (
                <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-2 mb-3">
                    <Checkbox
                      checked={selectedCards.includes(index.toString())}
                      onCheckedChange={() => handleCardSelect(index.toString())}
                    />
                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                      {card.lotNumber}-{card.iteration}
                    </span>
                  </div>

                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <ImageWithFallback
                        src={card.frontImage}
                        alt="Front"
                        className="w-full h-24 object-cover rounded border"
                        fallbackClassName="w-full h-24 rounded border"
                      />
                      <div className="flex items-center justify-center mt-1">
                        <ImageIcon className="w-3 h-3 mr-1" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">Front</span>
                      </div>
                    </div>

                    <div className="flex-1">
                      {card.backImage ? (
                        <>
                          <ImageWithFallback
                            src={card.backImage}
                            alt="Back"
                            className="w-full h-24 object-cover rounded border"
                            fallbackClassName="w-full h-24 rounded border"
                          />
                          <div className="flex items-center justify-center mt-1">
                            <Images className="w-3 h-3 mr-1" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">Back</span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-24 bg-slate-100 dark:bg-slate-700 rounded border flex items-center justify-center">
                          <div className="text-center">
                            <AlertCircle className="w-4 h-4 mx-auto text-slate-400 mb-1" />
                            <span className="text-xs text-slate-500 dark:text-slate-400">No Back</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Progress */}
      {processing && progress && (
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-900 dark:text-white">
              <Play className="w-5 h-5 mr-2" />
              Processing Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{progress.completed} of {progress.total} cards</span>
              </div>
              <Progress value={(progress.completed / progress.total) * 100} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Speed:</span>
                <span className="ml-2 font-medium">{progress.speed} cards/min</span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Time Remaining:</span>
                <span className="ml-2 font-medium">{progress.estimatedTimeRemaining} min</span>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Errors:</span>
                <span className="ml-2 font-medium">{progress.errors.length}</span>
              </div>
            </div>

            {progress.currentCard && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-medium mb-2 text-slate-900 dark:text-white">Currently Processing</h4>
                <div className="flex space-x-4">
                  <ImageWithFallback
                    src={progress.currentCard.frontImage}
                    alt="Current front"
                    className="w-16 h-20 object-cover rounded border"
                    fallbackClassName="w-16 h-20 rounded border"
                  />
                  {progress.currentCard.backImage && (
                    <ImageWithFallback
                      src={progress.currentCard.backImage}
                      alt="Current back"
                      className="w-16 h-20 object-cover rounded border"
                      fallbackClassName="w-16 h-20 rounded border"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">
                      {progress.currentCard.lotNumber}-{progress.currentCard.iteration}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Analyzing with AI...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}