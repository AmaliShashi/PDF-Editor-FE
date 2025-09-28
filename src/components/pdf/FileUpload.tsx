import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle, Eye, Edit, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pdfApi, handleApiError, pdfUtils } from '@/api/pdf';

interface FileUploadProps {
  onFileUpload: (file: File, fileId?: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        // Validate file using utility function
        const validation = pdfUtils.validateFile(file);
        if (!validation.isValid) {
          toast({
            title: "Invalid file",
            description: validation.error,
            variant: "destructive",
          });
          return;
        }

        setIsUploading(true);
        
        try {
          // Upload file to backend
          const uploadResult = await pdfApi.upload(file);
          
          // Call parent callback with file and fileId
          onFileUpload(file, uploadResult.fileId);
          
          toast({
            title: "File uploaded successfully",
            description: `${file.name} is ready for editing.`,
          });
        } catch (error) {
          const errorInfo = handleApiError(error);
          toast({
            title: "Upload failed",
            description: errorInfo.message,
            variant: "destructive",
          });
          console.error('Upload error:', error);
        } finally {
          setIsUploading(false);
        }
      }
    },
    [onFileUpload, toast]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB (matching API validation)
    disabled: isUploading,
  });

  return (
    <div className="space-y-6">
      <Card
        {...getRootProps()}
        className={`
          border-2 border-dashed cursor-pointer transition-all duration-300 p-12 text-center
          ${isDragActive && !isDragReject 
            ? 'border-primary bg-primary/5 shadow-custom-glow' 
            : isDragReject 
            ? 'border-destructive bg-destructive/5' 
            : 'border-border hover:border-primary/50 hover:bg-accent/50'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {isUploading ? (
            <div className="relative">
              <FileText className="w-16 h-16 text-muted-foreground" />
              <Loader2 className="w-8 h-8 text-primary absolute -top-2 -right-2 bg-background rounded-full p-1 shadow-custom-sm animate-spin" />
            </div>
          ) : isDragReject ? (
            <AlertCircle className="w-16 h-16 text-destructive" />
          ) : (
            <div className="relative">
              <FileText className="w-16 h-16 text-muted-foreground" />
              <Upload className="w-8 h-8 text-primary absolute -top-2 -right-2 bg-background rounded-full p-1 shadow-custom-sm" />
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {isUploading
                ? 'Uploading PDF...'
                : isDragActive && !isDragReject
                ? 'Drop your PDF here'
                : isDragReject
                ? 'Invalid file type'
                : 'Upload your PDF document'
              }
            </h3>
            
            <p className="text-muted-foreground">
              {isUploading
                ? 'Please wait while we upload your file'
                : isDragReject 
                ? 'Only PDF files are supported'
                : 'Drag and drop a PDF file here, or click to browse'
              }
            </p>
            
            <p className="text-sm text-muted-foreground">
              Maximum file size: 10MB
            </p>
          </div>
          
          {!isDragActive && !isUploading && (
            <Button 
              type="button" 
              className="mt-4 bg-gradient-primary hover:shadow-custom-glow transition-all"
            >
              Choose File
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <Card className="p-4 bg-gradient-secondary border-0">
          <Eye className="w-8 h-8 text-primary mx-auto mb-2" />
          <h4 className="font-medium text-foreground">Preview</h4>
          <p className="text-sm text-muted-foreground">View your PDF with page navigation</p>
        </Card>
        
        <Card className="p-4 bg-gradient-secondary border-0">
          <Edit className="w-8 h-8 text-primary mx-auto mb-2" />
          <h4 className="font-medium text-foreground">Edit</h4>
          <p className="text-sm text-muted-foreground">Add text overlays and update metadata</p>
        </Card>
        
        <Card className="p-4 bg-gradient-secondary border-0">
          <Download className="w-8 h-8 text-primary mx-auto mb-2" />
          <h4 className="font-medium text-foreground">Export</h4>
          <p className="text-sm text-muted-foreground">Save as PDF, Word, or images</p>
        </Card>
      </div>
    </div>
  );
};