import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { FileUpload } from './pdf/FileUpload';
import { PDFViewer } from './pdf/PDFViewer';
import { PDFEditPanel } from './pdf/PDFEditPanel';
import { ExportPanel } from './pdf/ExportPanel';
import { Upload, Eye, Edit, Download, Trash2, Loader2 } from 'lucide-react';
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

export const PDFEditor: React.FC = () => {
  const { toast } = useToast();
  const [pdfFile, setPdfFile] = useState<PDFFile | null>(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleFileUpload = (file: File, fileId?: string) => {
    const url = URL.createObjectURL(file);
    setPdfFile({
      file,
      url,
      fileId,
      metadata: {},
      edits: { textOverlays: [], textReplacements: [] }
    });
    setActiveTab('preview');
  };

  const handleMetadataUpdate = (metadata: PDFFile['metadata']) => {
    if (pdfFile) {
      setPdfFile({
        ...pdfFile,
        metadata: { ...pdfFile.metadata, ...metadata }
      });
    }
  };

  const handleEditsUpdate = (edits: PDFFile['edits']) => {
    if (pdfFile) {
      setPdfFile({
        ...pdfFile,
        edits: { ...pdfFile.edits, ...edits }
      });
    }
  };

  const handleDeleteFile = async () => {
    if (!pdfFile?.fileId) {
      toast({
        title: "No file to delete",
        description: "No file is currently loaded.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);
    try {
      await pdfApi.delete(pdfFile.fileId);
      
      // Clean up the object URL
      if (pdfFile.url) {
        URL.revokeObjectURL(pdfFile.url);
      }
      
      // Reset state
      setPdfFile(null);
      setActiveTab('upload');
      setCurrentPage(1);
      setNumPages(0);
      
      toast({
        title: "File deleted successfully",
        description: "The PDF file has been removed from the server.",
      });
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast({
        title: "Delete failed",
        description: errorInfo.message,
        variant: "destructive",
      });
      console.error('Delete error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-accent">
      <div className="container mx-auto p-6">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <h1 className="text-4xl font-bold text-foreground">
              PDF Editor Pro
            </h1>
            <div className="flex-1 flex justify-end">
              {pdfFile && (
                <Button
                  onClick={handleDeleteFile}
                  disabled={isDeleting}
                  variant="outline"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete File
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          <p className="text-lg text-muted-foreground">
            Upload, edit, and export your PDF documents with ease
          </p>
        </div>

        <Card className="shadow-custom-lg border-0 bg-card/80 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50">
              <TabsTrigger 
                value="upload" 
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Upload className="w-4 h-4" />
                Upload
              </TabsTrigger>
              <TabsTrigger 
                value="preview" 
                disabled={!pdfFile}
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
              <TabsTrigger 
                value="edit" 
                disabled={!pdfFile}
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Edit className="w-4 h-4" />
                Edit
              </TabsTrigger>
              <TabsTrigger 
                value="export" 
                disabled={!pdfFile}
                className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <Download className="w-4 h-4" />
                Export
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-6">
              <FileUpload onFileUpload={handleFileUpload} />
            </TabsContent>

            <TabsContent value="preview" className="mt-6">
              {pdfFile && (
                <PDFViewer
                  file={pdfFile}
                  currentPage={currentPage}
                  numPages={numPages}
                  onPageChange={setCurrentPage}
                  onDocumentLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
                />
              )}
            </TabsContent>

            <TabsContent value="edit" className="mt-6">
              {pdfFile && (
                <PDFEditPanel
                  file={pdfFile}
                  onMetadataUpdate={handleMetadataUpdate}
                  onEditsUpdate={handleEditsUpdate}
                />
              )}
            </TabsContent>

            <TabsContent value="export" className="mt-6">
              {pdfFile && (
                <ExportPanel file={pdfFile} />
              )}
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};