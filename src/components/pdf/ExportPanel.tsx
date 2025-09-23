import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, FileImage, Archive, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveAs } from 'file-saver';

interface PDFFile {
  file: File;
  url: string;
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
    setIsExporting(true);
    setExportProgress(0);
    setExportComplete(false);

    try {
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

      // Simulate API call to backend for processing
      const formData = new FormData();
      formData.append('file', file.file);
      formData.append('format', selectedFormat);
      formData.append('metadata', JSON.stringify(file.metadata || {}));
      formData.append('edits', JSON.stringify(file.edits || {}));

      // For demo purposes, we'll simulate the export process
      await simulateExport(formData, selectedFormat);

      clearInterval(progressInterval);
      setExportProgress(100);
      setExportComplete(true);

      toast({
        title: "Export successful",
        description: `Your ${selectedFormat.toUpperCase()} file has been prepared for download.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const simulateExport = async (formData: FormData, format: ExportFormat): Promise<void> => {
    // In a real implementation, this would call your C# backend API
    // For demo purposes, we'll create a dummy file
    return new Promise((resolve) => {
      setTimeout(() => {
        const fileName = file.file.name.replace('.pdf', '');
        let blob: Blob;
        let downloadFileName: string;

        switch (format) {
          case 'pdf':
            blob = new Blob(['Dummy PDF content'], { type: 'application/pdf' });
            downloadFileName = `${fileName}_edited.pdf`;
            break;
          case 'docx':
            blob = new Blob(['Dummy DOCX content'], { 
              type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
            });
            downloadFileName = `${fileName}.docx`;
            break;
          case 'images':
            blob = new Blob(['Dummy ZIP content'], { type: 'application/zip' });
            downloadFileName = `${fileName}_pages.zip`;
            break;
          default:
            throw new Error('Unknown format');
        }

        // Auto-download the file
        saveAs(blob, downloadFileName);
        resolve();
      }, 2000);
    });
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
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

      {/* Backend Info Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> This is a frontend demonstration. In a complete implementation, 
          the export functionality would connect to a C# ASP.NET Core backend API that handles 
          PDF processing using libraries like Aspose.PDF or similar tools.
        </AlertDescription>
      </Alert>

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