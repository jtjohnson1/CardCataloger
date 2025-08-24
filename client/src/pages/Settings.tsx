import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings as SettingsIcon,
  Key,
  Database,
  Zap,
  Image as ImageIcon,
  Download,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useToast } from '@/hooks/useToast'

export function Settings() {
  const [ebaySettings, setEbaySettings] = useState({
    developerId: '',
    appId: '',
    certId: '',
    token: ''
  })
  const [ollamaSettings, setOllamaSettings] = useState({
    endpoint: 'http://localhost:11434',
    model: 'llava',
    gpuEnabled: true
  })
  const [imageSettings, setImageSettings] = useState({
    thumbnailSize: '200',
    quality: 'high',
    format: 'jpg'
  })
  const { toast } = useToast()

  const handleSaveEbaySettings = () => {
    console.log('Saving eBay settings:', ebaySettings)
    toast({
      title: "Success",
      description: "eBay API settings saved successfully"
    })
  }

  const handleSaveOllamaSettings = () => {
    console.log('Saving Ollama settings:', ollamaSettings)
    toast({
      title: "Success",
      description: "Ollama settings saved successfully"
    })
  }

  const handleSaveImageSettings = () => {
    console.log('Saving image settings:', imageSettings)
    toast({
      title: "Success",
      description: "Image processing settings saved successfully"
    })
  }

  const handleTestConnection = (service: string) => {
    console.log(`Testing ${service} connection...`)
    toast({
      title: "Testing Connection",
      description: `Testing ${service} connection...`
    })
  }

  const handleBackupDatabase = () => {
    console.log('Starting database backup...')
    toast({
      title: "Backup Started",
      description: "Database backup has been initiated"
    })
  }

  const handleRestoreDatabase = () => {
    console.log('Starting database restore...')
    toast({
      title: "Restore Started",
      description: "Database restore has been initiated"
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Configure API connections and system preferences
        </p>
      </div>

      <Tabs defaultValue="apis" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="apis">API Settings</TabsTrigger>
          <TabsTrigger value="ollama">AI Processing</TabsTrigger>
          <TabsTrigger value="images">Image Settings</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        {/* API Settings */}
        <TabsContent value="apis" className="space-y-6">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-900 dark:text-white">
                <Key className="w-5 h-5 mr-2" />
                eBay API Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="developerId">Developer ID</Label>
                  <Input
                    id="developerId"
                    value={ebaySettings.developerId}
                    onChange={(e) => setEbaySettings(prev => ({ ...prev, developerId: e.target.value }))}
                    placeholder="Enter your eBay Developer ID"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appId">Application ID</Label>
                  <Input
                    id="appId"
                    value={ebaySettings.appId}
                    onChange={(e) => setEbaySettings(prev => ({ ...prev, appId: e.target.value }))}
                    placeholder="Enter your eBay App ID"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certId">Certificate ID</Label>
                  <Input
                    id="certId"
                    value={ebaySettings.certId}
                    onChange={(e) => setEbaySettings(prev => ({ ...prev, certId: e.target.value }))}
                    placeholder="Enter your eBay Cert ID"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token">User Token</Label>
                  <Input
                    id="token"
                    type="password"
                    value={ebaySettings.token}
                    onChange={(e) => setEbaySettings(prev => ({ ...prev, token: e.target.value }))}
                    placeholder="Enter your eBay User Token"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button onClick={handleSaveEbaySettings} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                  Save Settings
                </Button>
                <Button variant="outline" onClick={() => handleTestConnection('eBay')}>
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ollama Settings */}
        <TabsContent value="ollama" className="space-y-6">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-900 dark:text-white">
                <Zap className="w-5 h-5 mr-2" />
                Ollama AI Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endpoint">Ollama Endpoint</Label>
                  <Input
                    id="endpoint"
                    value={ollamaSettings.endpoint}
                    onChange={(e) => setOllamaSettings(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="http://localhost:11434"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">AI Model</Label>
                  <Input
                    id="model"
                    value={ollamaSettings.model}
                    onChange={(e) => setOllamaSettings(prev => ({ ...prev, model: e.target.value }))}
                    placeholder="llava"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-3">GPU Status</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-slate-900 dark:text-white">NVIDIA GeForce RTX 3070 Ti</span>
                    </div>
                    <Badge variant="secondary">8GB VRAM</Badge>
                  </div>
                  <Badge variant="default" className="bg-green-500">Active</Badge>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  GPU acceleration is enabled and optimized for your hardware
                </p>
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSaveOllamaSettings} className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                  Save Settings
                </Button>
                <Button variant="outline" onClick={() => handleTestConnection('Ollama')}>
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Image Settings */}
        <TabsContent value="images" className="space-y-6">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-900 dark:text-white">
                <ImageIcon className="w-5 h-5 mr-2" />
                Image Processing Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="thumbnailSize">Thumbnail Size (px)</Label>
                  <Input
                    id="thumbnailSize"
                    value={imageSettings.thumbnailSize}
                    onChange={(e) => setImageSettings(prev => ({ ...prev, thumbnailSize: e.target.value }))}
                    placeholder="200"
                    className="bg-white dark:bg-slate-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quality">Image Quality</Label>
                  <select
                    id="quality"
                    value={imageSettings.quality}
                    onChange={(e) => setImageSettings(prev => ({ ...prev, quality: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format">Output Format</Label>
                  <select
                    id="format"
                    value={imageSettings.format}
                    onChange={(e) => setImageSettings(prev => ({ ...prev, format: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md"
                  >
                    <option value="jpg">JPEG</option>
                    <option value="png">PNG</option>
                    <option value="webp">WebP</option>
                  </select>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-3">File Naming Patterns</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Front images:</span>
                    <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">*-front.jpg</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Back images:</span>
                    <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">*-back.jpg</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Example:</span>
                    <code className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">box1a-00003-front.jpg</code>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveImageSettings} className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database" className="space-y-6">
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center text-slate-900 dark:text-white">
                <Database className="w-5 h-5 mr-2" />
                Database Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900 dark:text-white">Backup Database</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Create a backup of your card collection database including all images and metadata.
                  </p>
                  <Button onClick={handleBackupDatabase} className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Create Backup
                  </Button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900 dark:text-white">Restore Database</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Restore your card collection from a previously created backup file.
                  </p>
                  <Button onClick={handleRestoreDatabase} variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Restore from Backup
                  </Button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-white mb-3">Database Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">1,247</div>
                    <div className="text-slate-600 dark:text-slate-400">Total Cards</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">2.3GB</div>
                    <div className="text-slate-600 dark:text-slate-400">Database Size</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">15.7GB</div>
                    <div className="text-slate-600 dark:text-slate-400">Image Storage</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">99.8%</div>
                    <div className="text-slate-600 dark:text-slate-400">Uptime</div>
                  </div>
                </div>
              </div>

              <div className="border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-orange-800 dark:text-orange-200">Important Notice</h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                      Database operations may take several minutes to complete depending on the size of your collection. 
                      Please do not close the application during backup or restore operations.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}