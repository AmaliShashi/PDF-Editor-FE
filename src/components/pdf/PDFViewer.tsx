import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pdfApi, handleApiError } from '@/api/pdf';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFFile {
  file: File;
  url: string;
  fileId?: string;
  metadata?: any;
  edits?: any;
}

interface PDFViewerProps {
  file: PDFFile;
  currentPage: number;
  numPages: number;
  onPageChange: (page: number) => void;
  onDocumentLoadSuccess: (pdf: any) => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  file,
  currentPage,
  numPages,
  onPageChange,
  onDocumentLoadSuccess,
}) => {
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const { toast } = useToast();

  // Load preview from backend when fileId is available
  useEffect(() => {
    const loadPreview = async () => {
      if (file.fileId && !previewUrl) {
        setIsLoadingPreview(true);
        try {
          const previewResult = await pdfApi.preview(file.fileId);
          setPreviewUrl(previewResult.previewUrl);
        } catch (error) {
          const errorInfo = handleApiError(error);
          toast({
            title: "Preview failed",
            description: errorInfo.message,
            variant: "destructive",
          });
          console.error('Preview error:', error);
        } finally {
          setIsLoadingPreview(false);
        }
      }
    };

    loadPreview();
  }, [file.fileId, previewUrl, toast]);

  const handleDocumentLoadSuccess = (pdf: any) => {
    setLoading(false);
    onDocumentLoadSuccess(pdf);
    toast({
      title: "PDF loaded successfully",
      description: `Document has ${pdf.numPages} pages.`,
    });
  };

  const handleDocumentLoadError = (error: Error) => {
    setLoading(false);
    toast({
      title: "Error loading PDF",
      description: "Failed to load the PDF document. Please try again.",
      variant: "destructive",
    });
    console.error('PDF load error:', error);
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value);
    if (page >= 1 && page <= numPages) {
      onPageChange(page);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="p-4 bg-pdf-toolbar border-0 shadow-custom-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Page Navigation */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="page-input" className="text-sm font-medium">
                Page
              </Label>
              <Input
                id="page-input"
                type="number"
                min={1}
                max={numPages}
                value={currentPage}
                onChange={handlePageInputChange}
                className="w-16 text-center"
              />
              <span className="text-sm text-muted-foreground">
                of {numPages}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Zoom and Rotation Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            
            <span className="text-sm font-medium text-foreground min-w-16 text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={scale >= 3.0}
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={rotate}
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* PDF Display */}
      <Card className="p-6 bg-pdf-viewer border-0 shadow-custom-md">
        <div className="flex justify-center">
          <div className="shadow-custom-lg rounded-lg overflow-hidden">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></Loader2>
                <span className="ml-3 text-muted-foreground">Loading preview from server...</span>
              </div>
            ) : (
              <Document
                file={previewUrl || file.url}
                onLoadSuccess={handleDocumentLoadSuccess}
                onLoadError={handleDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <span className="ml-3 text-muted-foreground">Loading PDF...</span>
                  </div>
                }
              >
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  rotate={rotation}
                  loading={
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  }
                  className="pdf-page"
                />
              </Document>
            )}
          </div>
        </div>
      </Card>

      {/* File Info */}
      <Card className="p-4 bg-gradient-secondary border-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <Label className="font-medium text-foreground">File Name:</Label>
            <p className="text-muted-foreground truncate">{file.file.name}</p>
          </div>
          <div>
            <Label className="font-medium text-foreground">File Size:</Label>
            <p className="text-muted-foreground">
              {(file.file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <div>
            <Label className="font-medium text-foreground">Pages:</Label>
            <p className="text-muted-foreground">{numPages} pages</p>
          </div>
        </div>
      </Card>
    </div>
  );
};