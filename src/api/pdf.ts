import { api } from './client';

// Types for PDF operations
export interface PDFUploadResponse {
  fileId: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
}

export interface PDFPreviewResponse {
  fileId: string;
  fileName: string;
  previewUrl: string;
  pageCount: number;
}

export interface PDFEditRequest {
  fileId: string;
  edits: {
    pageNumber: number;
    x: number;
    y: number;
    width: number;
    height: number;
    text?: string;
    action: 'add_text' | 'add_image' | 'add_annotation' | 'remove_element';
  }[];
}

export interface PDFEditResponse {
  fileId: string;
  editId: string;
  success: boolean;
  message: string;
}

export interface PDFExportRequest {
  fileId: string;
  format: 'pdf' | 'png' | 'jpg' | 'docx';
  quality?: 'low' | 'medium' | 'high';
  pages?: number[];
}

export interface PDFExportResponse {
  fileId: string;
  exportId: string;
  downloadUrl: string;
  format: string;
  fileSize: number;
}

// PDF API functions
export const pdfApi = {
  /**
   * Upload a PDF file
   * @param file - The PDF file to upload
   * @returns Promise with upload response
   */
  upload: async (file: File): Promise<PDFUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  /**
   * Get PDF preview
   * @param fileId - The ID of the file to preview
   * @returns Promise with preview response
   */
  preview: async (fileId: string): Promise<PDFPreviewResponse> => {
    const response = await api.get(`/preview/${fileId}`);
    return response.data;
  },

  /**
   * Edit PDF file
   * @param fileId - The ID of the file to edit
   * @param edits - Array of edit operations
   * @returns Promise with edit response
   */
  edit: async (fileId: string, edits: PDFEditRequest['edits']): Promise<PDFEditResponse> => {
    const response = await api.post(`/edit/${fileId}`, { edits });
    return response.data;
  },

  /**
   * Export PDF file
   * @param fileId - The ID of the file to export
   * @param exportOptions - Export configuration
   * @returns Promise with export response
   */
  export: async (fileId: string, exportOptions: Omit<PDFExportRequest, 'fileId'>): Promise<PDFExportResponse> => {
    const response = await api.post(`/export/${fileId}`, exportOptions);
    return response.data;
  },

  /**
   * Delete PDF file
   * @param fileId - The ID of the file to delete
   * @returns Promise with deletion confirmation
   */
  delete: async (fileId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/${fileId}`);
    return response.data;
  },
};

// Error handling wrapper
export const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    return {
      message: error.response.data?.message || 'An error occurred',
      status: error.response.status,
      statusText: error.response.statusText,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: 'Network error - please check your connection',
      status: 0,
      statusText: 'No Response',
    };
  } else {
    // Something else happened
    return {
      message: error.message || 'An unexpected error occurred',
      status: 0,
      statusText: 'Unknown Error',
    };
  }
};

// Utility functions for common operations
export const pdfUtils = {
  /**
   * Validate file before upload
   */
  validateFile: (file: File): { isValid: boolean; error?: string } => {
    if (!file) {
      return { isValid: false, error: 'No file selected' };
    }
    
    if (file.type !== 'application/pdf') {
      return { isValid: false, error: 'Please select a PDF file' };
    }
    
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 10MB' };
    }
    
    return { isValid: true };
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Generate download URL for exported files
   */
  getDownloadUrl: (fileId: string, exportId: string): string => {
    return `${api.defaults.baseURL}/download/${fileId}/${exportId}`;
  },
};
