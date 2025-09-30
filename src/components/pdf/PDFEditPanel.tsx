import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { FileText, Tags, Type, Plus, Trash2, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pdfApi, handleApiError } from '@/api/pdf';

interface PDFFile {
  file: File;
  url: string;
  fileId?: string;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  };
  edits?: {
    textOverlays?: Array<{
      page: number;
      x: number;
      y: number;
      text: string;
      fontSize: number;
      color: string;
    }>;
    textReplacements?: Array<{
      page: number;
      original: string;
      replacement: string;
    }>;
  };
}

interface PDFEditPanelProps {
  file: PDFFile;
  onMetadataUpdate: (metadata: PDFFile['metadata']) => void;
  onEditsUpdate: (edits: PDFFile['edits']) => void;
}

export const PDFEditPanel: React.FC<PDFEditPanelProps> = ({
  file,
  onMetadataUpdate,
  onEditsUpdate,
}) => {
  const { toast } = useToast();
  const [metadata, setMetadata] = useState(file.metadata || {});
  const [isSaving, setIsSaving] = useState(false);
  const [newOverlay, setNewOverlay] = useState({
    page: 1,
    x: 100,
    y: 100,
    text: '',
    fontSize: 12,
    color: '#000000',
  });
  const [newReplacement, setNewReplacement] = useState({
    page: 1,
    original: '',
    replacement: '',
  });

  const handleMetadataChange = (field: string, value: string) => {
    const updatedMetadata = { ...metadata, [field]: value };
    setMetadata(updatedMetadata);
    onMetadataUpdate(updatedMetadata);
  };

  const saveEditsToBackend = async () => {
    if (!file.fileId) {
      toast({
        title: "No file ID",
        description: "Cannot save edits without a file ID. Please re-upload the file.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Convert local edits to API format
      const edits = file.edits?.textOverlays?.map(overlay => ({
        pageNumber: overlay.page,
        x: overlay.x,
        y: overlay.y,
        width: overlay.text.length * overlay.fontSize * 0.6, // Approximate width
        height: overlay.fontSize * 1.2, // Approximate height
        text: overlay.text,
        action: 'add_text' as const,
      })) || [];

      // Add text replacements as edits
      const replacementEdits = file.edits?.textReplacements?.map(replacement => ({
        pageNumber: replacement.page,
        x: 0, // Will be determined by backend
        y: 0,
        width: 0,
        height: 0,
        text: replacement.replacement,
        action: 'add_text' as const,
      })) || [];

      const allEdits = [...edits, ...replacementEdits];

      if (allEdits.length === 0) {
        toast({
          title: "No edits to save",
          description: "Please add some text overlays or replacements before saving.",
          variant: "destructive",
        });
        return;
      }

      const result = await pdfApi.edit(file.fileId, allEdits);
      
      toast({
        title: "Edits saved successfully",
        description: `Your edits have been saved to the server.`,
      });
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast({
        title: "Save failed",
        description: errorInfo.message,
        variant: "destructive",
      });
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addTextOverlay = () => {
    if (!newOverlay.text.trim()) {
      toast({
        title: "Missing text",
        description: "Please enter text for the overlay.",
        variant: "destructive",
      });
      return;
    }

    const updatedOverlays = [
      ...(file.edits?.textOverlays || []),
      { ...newOverlay }
    ];
    
    onEditsUpdate({
      ...file.edits,
      textOverlays: updatedOverlays,
    });

    setNewOverlay({
      page: 1,
      x: 100,
      y: 100,
      text: '',
      fontSize: 12,
      color: '#000000',
    });

    toast({
      title: "Text overlay added",
      description: "The text overlay has been added to your edits.",
    });
  };

  const removeTextOverlay = (index: number) => {
    const updatedOverlays = (file.edits?.textOverlays || []).filter((_, i) => i !== index);
    onEditsUpdate({
      ...file.edits,
      textOverlays: updatedOverlays,
    });

    toast({
      title: "Text overlay removed",
      description: "The text overlay has been removed from your edits.",
    });
  };

  const addTextReplacement = () => {
    if (!newReplacement.original.trim() || !newReplacement.replacement.trim()) {
      toast({
        title: "Missing text",
        description: "Please enter both original and replacement text.",
        variant: "destructive",
      });
      return;
    }

    const updatedReplacements = [
      ...(file.edits?.textReplacements || []),
      { ...newReplacement }
    ];
    
    onEditsUpdate({
      ...file.edits,
      textReplacements: updatedReplacements,
    });

    setNewReplacement({
      page: 1,
      original: '',
      replacement: '',
    });

    toast({
      title: "Text replacement added",
      description: "The text replacement has been added to your edits.",
    });
  };

  const removeTextReplacement = (index: number) => {
    const updatedReplacements = (file.edits?.textReplacements || []).filter((_, i) => i !== index);
    onEditsUpdate({
      ...file.edits,
      textReplacements: updatedReplacements,
    });

    toast({
      title: "Text replacement removed",
      description: "The text replacement has been removed from your edits.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Save Button */}
      <Card className="p-4 bg-gradient-primary border-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Save Your Edits</h3>
            <p className="text-white/80 text-sm">
              Save your changes to the server to apply them to the PDF
            </p>
          </div>
          <Button
            onClick={saveEditsToBackend}
            disabled={isSaving || !file.fileId}
            className="bg-white text-primary hover:bg-white/90 shadow-custom-glow transition-all"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Edits
              </>
            )}
          </Button>
        </div>
      </Card>

      <Tabs defaultValue="metadata" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger 
            value="metadata" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <FileText className="w-4 h-4" />
            Metadata
          </TabsTrigger>
          <TabsTrigger 
            value="overlay" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Type className="w-4 h-4" />
            Text Overlay
          </TabsTrigger>
          <TabsTrigger 
            value="replace" 
            className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Tags className="w-4 h-4" />
            Text Replace
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metadata" className="space-y-4">
          <Card className="p-6 bg-gradient-secondary border-0">
            <h3 className="text-lg font-semibold text-foreground mb-4">Document Metadata</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Document title"
                    value={metadata.title || ''}
                    onChange={(e) => handleMetadataChange('title', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    placeholder="Document author"
                    value={metadata.author || ''}
                    onChange={(e) => handleMetadataChange('author', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Document subject"
                  value={metadata.subject || ''}
                  onChange={(e) => handleMetadataChange('subject', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Textarea
                  id="keywords"
                  placeholder="Document keywords (comma-separated)"
                  value={metadata.keywords || ''}
                  onChange={(e) => handleMetadataChange('keywords', e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="overlay" className="space-y-4">
          <Card className="p-6 bg-gradient-secondary border-0">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add Text Overlay</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overlay-page">Page</Label>
                  <Input
                    id="overlay-page"
                    type="number"
                    min={1}
                    value={newOverlay.page}
                    onChange={(e) => setNewOverlay({ ...newOverlay, page: parseInt(e.target.value) || 1 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overlay-x">X Position</Label>
                  <Input
                    id="overlay-x"
                    type="number"
                    value={newOverlay.x}
                    onChange={(e) => setNewOverlay({ ...newOverlay, x: parseInt(e.target.value) || 0 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overlay-y">Y Position</Label>
                  <Input
                    id="overlay-y"
                    type="number"
                    value={newOverlay.y}
                    onChange={(e) => setNewOverlay({ ...newOverlay, y: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overlay-text">Text</Label>
                  <Input
                    id="overlay-text"
                    placeholder="Text to overlay"
                    value={newOverlay.text}
                    onChange={(e) => setNewOverlay({ ...newOverlay, text: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overlay-fontsize">Font Size</Label>
                  <Input
                    id="overlay-fontsize"
                    type="number"
                    min={8}
                    max={72}
                    value={newOverlay.fontSize}
                    onChange={(e) => setNewOverlay({ ...newOverlay, fontSize: parseInt(e.target.value) || 12 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="overlay-color">Color</Label>
                  <Input
                    id="overlay-color"
                    type="color"
                    value={newOverlay.color}
                    onChange={(e) => setNewOverlay({ ...newOverlay, color: e.target.value })}
                  />
                </div>
              </div>
              
              <Button onClick={addTextOverlay} className="w-full bg-gradient-primary hover:shadow-custom-glow transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Add Text Overlay
              </Button>
            </div>
          </Card>

          {/* Existing Overlays */}
          {file.edits?.textOverlays && file.edits.textOverlays.length > 0 && (
            <Card className="p-6 bg-card border-0">
              <h4 className="text-md font-semibold text-foreground mb-4">Current Text Overlays</h4>
              <div className="space-y-3">
                {file.edits.textOverlays.map((overlay, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">Page {overlay.page}</Badge>
                        <span className="text-sm text-muted-foreground">
                          ({overlay.x}, {overlay.y})
                        </span>
                      </div>
                      <p className="font-medium text-foreground">{overlay.text}</p>
                      <p className="text-sm text-muted-foreground">
                        Size: {overlay.fontSize}px, Color: {overlay.color}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTextOverlay(index)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="replace" className="space-y-4">
          <Card className="p-6 bg-gradient-secondary border-0">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add Text Replacement</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="replace-page">Page</Label>
                <Input
                  id="replace-page"
                  type="number"
                  min={1}
                  value={newReplacement.page}
                  onChange={(e) => setNewReplacement({ ...newReplacement, page: parseInt(e.target.value) || 1 })}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="replace-original">Original Text</Label>
                  <Textarea
                    id="replace-original"
                    placeholder="Text to find and replace"
                    value={newReplacement.original}
                    onChange={(e) => setNewReplacement({ ...newReplacement, original: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="replace-replacement">Replacement Text</Label>
                  <Textarea
                    id="replace-replacement"
                    placeholder="New text to replace with"
                    value={newReplacement.replacement}
                    onChange={(e) => setNewReplacement({ ...newReplacement, replacement: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              
              <Button onClick={addTextReplacement} className="w-full bg-gradient-primary hover:shadow-custom-glow transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Add Text Replacement
              </Button>
            </div>
          </Card>

          {/* Existing Replacements */}
          {file.edits?.textReplacements && file.edits.textReplacements.length > 0 && (
            <Card className="p-6 bg-card border-0">
              <h4 className="text-md font-semibold text-foreground mb-4">Current Text Replacements</h4>
              <div className="space-y-3">
                {file.edits.textReplacements.map((replacement, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-accent rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">Page {replacement.page}</Badge>
                      </div>
                      <div className="text-sm">
                        <div className="mb-1">
                          <span className="font-medium text-foreground">From:</span>
                          <span className="ml-2 text-muted-foreground">{replacement.original}</span>
                        </div>
                        <div>
                          <span className="font-medium text-foreground">To:</span>
                          <span className="ml-2 text-muted-foreground">{replacement.replacement}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTextReplacement(index)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
