import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Folder,
  Search,
  Play,
  CheckCircle,
  AlertCircle,
  FileImage,
  Clock,
  Zap
} from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { scanDirectory, processCards, getProcessingProgress, CardPair, ScanResult, ProcessingProgress } from '../api/cards';

export function ProcessCards() {
  const { toast } = useToast();

  // Directory scanning state - Start with empty directory
  const [directory, setDirectory] = useState('');
  const [includeSubdirectories, setIncludeSubdirectories] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedCards, setScannedCards] = useState<ScanResult | null>(null);

  // Card selection state
  const [selectedCards, setSelectedCards] = useState<string[]>([]);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState<ProcessingProgress | null>(null);

  const handleScanDirectory = async () => {
    if (!directory.trim()) {
      toast({
        title: "Error",
        description: "Please enter a directory path",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsScanning(true);
      console.log('Scanning directory:', directory);

      const response = await scanDirectory({
        directory: directory.trim(),
        includeSubdirectories
      });

      console.log('Scan response:', response);

      // Defensive programming - ensure response structure
      if (!response || !response.success || !response.data) {
        throw new Error('Invalid response from server');
      }

      const scanResult = response.data;

      // Ensure arrays exist
      if (!scanResult.validPairs) {
        scanResult.validPairs = [];
      }
      if (!scanResult.singleCards) {
        scanResult.singleCards = [];
      }

      setScannedCards(scanResult);
      setSelectedCards([]); // Reset selection

      const totalCards = scanResult.validPairs.length + scanResult.singleCards.length;

      toast({
        title: "Scan Complete",
        description: `Found ${totalCards} cards (${scanResult.validPairs.length} pairs, ${scanResult.singleCards.length} singles)`,
      });

    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to scan directory",
        variant: "destructive",
      });
      setScannedCards(null);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCardSelection = (cardId: string, checked: boolean) => {
    if (checked) {
      setSelectedCards(prev => [...prev, cardId]);
    } else {
      setSelectedCards(prev => prev.filter(id => id !== cardId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (!scannedCards) return;

    if (checked) {
      const allCardIds = [
        ...scannedCards.validPairs.map(card => card.id),
        ...scannedCards.singleCards.map(card => card.id)
      ];
      setSelectedCards(allCardIds);
    } else {
      setSelectedCards([]);
    }
  };

  const handleProcessCards = async () => {
    if (selectedCards.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one card to process",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      const response = await processCards({
        selectedCards,
        directory
      });

      if (response.success && response.jobId) {
        setProcessingJobId(response.jobId);

        // Start polling for progress
        pollProcessingProgress(response.jobId);

        toast({
          title: "Processing Started",
          description: `Processing ${selectedCards.length} cards`,
        });
      } else {
        throw new Error('Failed to start processing');
      }

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start processing",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const pollProcessingProgress = async (jobId: string) => {
    try {
      const response = await getProcessingProgress(jobId);
      setProcessingProgress(response.progress);

      if (response.progress.status === 'processing') {
        // Continue polling
        setTimeout(() => pollProcessingProgress(jobId), 2000);
      } else if (response.progress.status === 'completed') {
        setIsProcessing(false);
        toast({
          title: "Processing Complete",
          description: `Successfully processed ${response.progress.cardsCompleted} cards`,
        });
      } else if (response.progress.status === 'failed') {
        setIsProcessing(false);
        toast({
          title: "Processing Failed",
          description: "Some cards failed to process. Check the progress details.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Progress polling error:', error);
      setIsProcessing(false);
    }
  };

  const renderCardList = () => {
    if (!scannedCards) return null;

    const allCards = [...scannedCards.validPairs, ...scannedCards.singleCards];

    if (allCards.length === 0) {
      return (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No card images found in the specified directory. Make sure your images follow the naming convention: lot-iteration-front.jpg
          </AlertDescription>
        </Alert>
      );
    }

    const isAllSelected = allCards.length > 0 && selectedCards.length === allCards.length;
    const isSomeSelected = selectedCards.length > 0 && selectedCards.length < allCards.length;

    return (
      <div className="space-y-4">
        {/* Select All Checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="select-all"
            checked={isAllSelected}
            ref={(el) => {
              if (el) el.indeterminate = isSomeSelected;
            }}
            onCheckedChange={handleSelectAll}
          />
          <Label htmlFor="select-all" className="font-medium">
            Select All ({allCards.length} cards)
          </Label>
        </div>

        <Separator />

        {/* Card List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {allCards.map((card) => (
            <div key={card.id} className="flex items-center space-x-3 p-3 border rounded-lg">
              <Checkbox
                id={card.id}
                checked={selectedCards.includes(card.id)}
                onCheckedChange={(checked) => handleCardSelection(card.id, checked as boolean)}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <FileImage className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{card.frontFile}</span>
                  {card.hasBack && (
                    <Badge variant="secondary" className="text-xs">
                      Has Back
                    </Badge>
                  )}
                  {!card.hasBack && (
                    <Badge variant="outline" className="text-xs">
                      Front Only
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Lot: {card.lotNumber} • Iteration: {card.iteration}
                </div>
                {card.backFile && (
                  <div className="text-sm text-muted-foreground">
                    Back: {card.backFile}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProcessingProgress = () => {
    if (!isProcessing || !processingProgress) return null;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Processing Cards</span>
          </CardTitle>
          <CardDescription>
            AI analysis in progress...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{processingProgress.progress}%</span>
            </div>
            <Progress value={processingProgress.progress} />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>
              <span className="ml-2 capitalize">{processingProgress.status}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Cards:</span>
              <span className="ml-2">{processingProgress.cardsCompleted} / {processingProgress.totalCards}</span>
            </div>
          </div>

          {processingProgress.currentCard && (
            <div className="text-sm">
              <span className="text-muted-foreground">Current:</span>
              <span className="ml-2">{processingProgress.currentCard}</span>
            </div>
          )}

          {processingProgress.estimatedTimeRemaining && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>~{Math.round(processingProgress.estimatedTimeRemaining / 60)} minutes remaining</span>
            </div>
          )}

          {processingProgress.errors && processingProgress.errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {processingProgress.errors.length} error(s) occurred during processing
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Process Cards</h1>
        <p className="text-muted-foreground">
          Scan directories for card images and process them with AI analysis
        </p>
      </div>

      {/* Directory Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Folder className="h-5 w-5" />
            <span>Directory Selection</span>
          </CardTitle>
          <CardDescription>
            Select the directory containing your card images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="directory">Directory Path</Label>
            <Input
              id="directory"
              value={directory}
              onChange={(e) => setDirectory(e.target.value)}
              placeholder="/path/to/your/card/images"
            />
            <div className="text-sm text-muted-foreground">
              Enter the full path to your card images directory. Images should follow the naming pattern: lot-iteration-front.jpg
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="subdirectories"
              checked={includeSubdirectories}
              onCheckedChange={setIncludeSubdirectories}
            />
            <Label htmlFor="subdirectories">Include subdirectories (recursive scan)</Label>
          </div>

          <Button
            onClick={handleScanDirectory}
            disabled={isScanning}
            className="w-full"
          >
            <Search className="h-4 w-4 mr-2" />
            {isScanning ? 'Scanning...' : 'Scan Directory'}
          </Button>
        </CardContent>
      </Card>

      {/* Scan Results */}
      {scannedCards && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Scan Results</span>
            </CardTitle>
            <CardDescription>
              Found {(scannedCards.validPairs?.length || 0) + (scannedCards.singleCards?.length || 0)} cards
              ({scannedCards.validPairs?.length || 0} pairs, {scannedCards.singleCards?.length || 0} singles)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderCardList()}
          </CardContent>
        </Card>
      )}

      {/* Process Button */}
      {scannedCards && (scannedCards.validPairs?.length > 0 || scannedCards.singleCards?.length > 0) && (
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleProcessCards}
              disabled={selectedCards.length === 0 || isProcessing}
              className="w-full"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Process Selected Cards ({selectedCards.length})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Processing Progress */}
      {renderProcessingProgress()}
    </div>
  );
}