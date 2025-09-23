import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle, Eye, Edit, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const { toast } = useToast();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.type !== 'application/pdf') {
          toast({
            title: "Invalid file type",
            description: "Please upload a PDF file only.",
            variant: "destructive",
          });
          return;
        }

        if (file.size > 50 * 1024 * 1024) { // 50MB limit
          toast({
            title: "File too large",
            description: "Please upload a PDF file smaller than 50MB.",
            variant: "destructive",
          });
          return;
        }

        onFileUpload(file);
        toast({
          title: "File uploaded successfully",
          description: `${file.name} is ready for editing.`,
        });
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
    maxSize: 50 * 1024 * 1024, // 50MB
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
          {isDragReject ? (
            <AlertCircle className="w-16 h-16 text-destructive" />
          ) : (
            <div className="relative">
              <FileText className="w-16 h-16 text-muted-foreground" />
              <Upload className="w-8 h-8 text-primary absolute -top-2 -right-2 bg-background rounded-full p-1 shadow-custom-sm" />
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {isDragActive && !isDragReject
                ? 'Drop your PDF here'
                : isDragReject
                ? 'Invalid file type'
                : 'Upload your PDF document'
              }
            </h3>
            
            <p className="text-muted-foreground">
              {isDragReject 
                ? 'Only PDF files are supported'
                : 'Drag and drop a PDF file here, or click to browse'
              }
            </p>
            
            <p className="text-sm text-muted-foreground">
              Maximum file size: 50MB
            </p>
          </div>
          
          {!isDragActive && (
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