import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, FileImage, Archive, Download, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveAs } from 'file-saver';
import { pdfApi, handleApiError, pdfUtils } from '@/api/pdf';
import { api } from '@/api/client';

interface PDFFile {
  file: File;
  url: string;
  fileId?: string;
  metadata?: any;
  edits?: any;
}

interface ExportPanelProps {
  file: PDFFile;
}

type ExportFormat = 'pdf' | 'docx' | 'images';

export const ExportPanel: React.FC<ExportPanelProps> = ({ file }) => {
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);

  const formatOptions = [
    {
      value: 'pdf' as ExportFormat,
      label: 'PDF (Updated)',
      description: 'Export as an updated PDF with all edits applied',
      icon: FileText,
    },
    {
      value: 'docx' as ExportFormat,
      label: 'Word Document (.docx)',
      description: 'Convert to Microsoft Word format',
      icon: FileText,
    },
    {
      value: 'images' as ExportFormat,
      label: 'Images (ZIP)',
      description: 'Export each page as PNG/JPEG in a ZIP archive',
      icon: FileImage,
    },
  ];

  const handleExport = async () => {
    if (!file.fileId) {
      toast({
        title: "No file ID",
        description: "Cannot export without a file ID. Please re-upload the file.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportComplete(false);

    // Simulate export progress
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {

      // Call the actual export API - backend returns file directly
      const response = await api.post(`/export/${file.fileId}`, {
        format: selectedFormat === 'images' ? 'png' : selectedFormat as 'pdf' | 'docx',
        quality: 'high',
      }, {
        responseType: 'blob' // Important: tell axios to expect binary data
      });

      clearInterval(progressInterval);
      setExportProgress(100);
      setExportComplete(true);

      // Log the response to debug
      console.log('Export response:', response);

      // The backend returns the file directly, so we can download it immediately
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.file.name.replace('.pdf', '')}_exported.${selectedFormat === 'images' ? 'zip' : selectedFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Your ${selectedFormat.toUpperCase()} file has been downloaded.`,
      });
    } catch (error) {
      const errorInfo = handleApiError(error);
      console.error('Export error:', error);
      console.error('Error details:', errorInfo);
      
      // Clear progress interval if it's still running
      clearInterval(progressInterval);
      
      toast({
        title: "Export failed",
        description: errorInfo.message || 'An unexpected error occurred during export',
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };


  const resetExport = () => {
    setExportComplete(false);
    setExportProgress(0);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-secondary border-0">
        <h3 className="text-lg font-semibold text-foreground mb-4">Export Options</h3>
        
        <RadioGroup value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as ExportFormat)}>
          <div className="space-y-4">
            {formatOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <div key={option.value} className="flex items-start space-x-3 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer">
                      <IconComponent className="w-5 h-5 text-primary" />
                      <span className="font-medium text-foreground">{option.label}</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </RadioGroup>
      </Card>

      {/* Export Progress */}
      {(isExporting || exportComplete) && (
        <Card className="p-6 bg-card border-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-foreground">
                {exportComplete ? 'Export Complete' : 'Exporting...'}
              </h4>
              {exportComplete && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
            
            <Progress value={exportProgress} className="w-full" />
            
            <p className="text-sm text-muted-foreground">
              {exportComplete
                ? 'Your file has been downloaded successfully.'
                : `Processing your ${selectedFormat.toUpperCase()} export... ${exportProgress}%`
              }
            </p>
          </div>
        </Card>
      )}

      {/* Export Button */}
      <Card className="p-6 bg-gradient-primary border-0">
        <div className="text-center space-y-4">
          <Button
            onClick={exportComplete ? resetExport : handleExport}
            disabled={isExporting}
            size="lg"
            className="w-full bg-white text-primary hover:bg-white/90 shadow-custom-glow transition-all"
          >
            {exportComplete ? (
              <>
                <Archive className="w-5 h-5 mr-2" />
                Export Another Format
              </>
            ) : isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-5 h-5 mr-2" />
                Export as {selectedFormat.toUpperCase()}
              </>
            )}
          </Button>
          
          <p className="text-sm text-white/80">
            The exported file will be automatically downloaded to your default download folder.
          </p>
        </div>
      </Card>

      {/* Export Summary */}
      {(file.metadata || file.edits) && (
        <Card className="p-6 bg-card border-0">
          <h4 className="text-md font-semibold text-foreground mb-4">Export Summary</h4>
          
          <div className="space-y-3 text-sm">
            {file.metadata && Object.keys(file.metadata).length > 0 && (
              <div>
                <span className="font-medium text-foreground">Metadata updates:</span>
                <span className="ml-2 text-muted-foreground">
                  {Object.keys(file.metadata).filter(key => file.metadata?.[key]).length} fields modified
                </span>
              </div>
            )}
            
            {file.edits?.textOverlays && file.edits.textOverlays.length > 0 && (
              <div>
                <span className="font-medium text-foreground">Text overlays:</span>
                <span className="ml-2 text-muted-foreground">
                  {file.edits.textOverlays.length} overlay(s) to be applied
                </span>
              </div>
            )}
            
            {file.edits?.textReplacements && file.edits.textReplacements.length > 0 && (
              <div>
                <span className="font-medium text-foreground">Text replacements:</span>
                <span className="ml-2 text-muted-foreground">
                  {file.edits.textReplacements.length} replacement(s) to be applied
                </span>
              </div>
            )}
            
            {(!file.metadata || Object.keys(file.metadata).length === 0) && 
             (!file.edits?.textOverlays || file.edits.textOverlays.length === 0) &&
             (!file.edits?.textReplacements || file.edits.textReplacements.length === 0) && (
              <div className="text-muted-foreground">
                No edits or metadata changes to apply. Original file will be converted to the selected format.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};