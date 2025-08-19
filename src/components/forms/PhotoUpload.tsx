"use client"

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Camera, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/utils';

interface UploadedFile extends File {
  id: string;
  preview: string;
  url?: string; // For imported images from URLs
}

interface PhotoUploadProps {
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  acceptedTypes?: string[];
  existingPhotos?: string[];
  className?: string;
}

export function PhotoUpload({
  onFilesChange,
  maxFiles = 20,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  existingPhotos = [],
  className = ''
}: PhotoUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `${file.name}: File type not supported. Please use JPEG, PNG, or WebP.`;
    }
    if (file.size > maxFileSize) {
      return `${file.name}: File too large. Maximum size is ${formatFileSize(maxFileSize)}.`;
    }
    return null;
  }, [acceptedTypes, maxFileSize]);

  const processFiles = useCallback(async (fileList: FileList) => {
    const newErrors: string[] = [];
    const validFiles: UploadedFile[] = [];

    const totalFiles = files.length + existingPhotos.length + fileList.length;
    if (totalFiles > maxFiles) {
      newErrors.push(`Maximum ${maxFiles} photos allowed. You're trying to add ${fileList.length} files but only have ${maxFiles - files.length - existingPhotos.length} slots remaining.`);
      setErrors(newErrors);
      return;
    }

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const error = validateFile(file);
      
      if (error) {
        newErrors.push(error);
        continue;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);
      const uploadedFile: UploadedFile = Object.assign(file, {
        id: `${Date.now()}-${i}`,
        preview
      });

      validFiles.push(uploadedFile);
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
    } else {
      setErrors([]);
    }

    if (validFiles.length > 0) {
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);
    }
  }, [files, existingPhotos.length, maxFiles, validateFile, onFilesChange]);

  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = files.filter(file => {
      if (file.id === fileId) {
        URL.revokeObjectURL(file.preview);
        return false;
      }
      return true;
    });
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
    setErrors([]);
  }, [files, onFilesChange]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset input value to allow re-uploading the same file
      e.target.value = '';
    }
  }, [processFiles]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const remainingSlots = maxFiles - files.length - existingPhotos.length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-colors
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${remainingSlots <= 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={remainingSlots > 0 ? openFileDialog : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={remainingSlots <= 0}
        />

        <div className="text-center">
          <div className="flex justify-center mb-4">
            {dragActive ? (
              <Upload className="h-10 w-10 text-blue-500" />
            ) : (
              <Camera className="h-10 w-10 text-gray-400" />
            )}
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              {dragActive ? 'Drop photos here' : 'Upload Photos'}
            </p>
            <p className="text-sm text-gray-500">
              Drag and drop photos here, or click to browse
            </p>
            <p className="text-xs text-gray-400">
              {acceptedTypes.includes('image/jpeg') && 'JPEG'}{acceptedTypes.includes('image/png') && ', PNG'}{acceptedTypes.includes('image/webp') && ', WebP'} • 
              Max {formatFileSize(maxFileSize)} each • 
              {remainingSlots} of {maxFiles} slots remaining
            </p>
          </div>

          {remainingSlots <= 0 && (
            <p className="text-sm text-red-500 mt-2">
              Maximum number of photos reached
            </p>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <h4 className="text-sm font-medium text-red-800 mb-2">Upload Errors:</h4>
          <ul className="text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Existing Photos */}
      {existingPhotos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Existing Photos</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {existingPhotos.map((photo, index) => (
              <div key={`existing-${index}`} className="relative group">
                <div className="aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                  <img
                    src={photo}
                    alt={`Existing photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-1 left-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Photos Preview */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">
            New Photos ({files.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {files.map((file, index) => (
              <div key={file.id} className="relative group">
                <div className="aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                  <img
                    src={file.preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Photo Number */}
                <div className="absolute top-1 left-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded">
                  {existingPhotos.length + index + 1}
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  type="button"
                >
                  <X className="h-3 w-3" />
                </button>

                {/* File Info */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="truncate">{file.name}</p>
                  <p>{formatFileSize(file.size)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Instructions */}
      {files.length === 0 && existingPhotos.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-start">
            <ImageIcon className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-800 mb-1">Photo Tips</h4>
              <ul className="text-blue-700 space-y-1">
                <li>• Take photos in good lighting for best results</li>
                <li>• Include multiple angles: front, back, sides, interior</li>
                <li>• Show any damage, wear, or unique features</li>
                <li>• First photo will be used as the primary image</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button for Manual Selection */}
      {remainingSlots > 0 && (
        <div className="flex justify-center">
          <Button 
            type="button" 
            variant="outline" 
            onClick={openFileDialog}
            className="flex items-center space-x-2"
          >
            <FileImage className="h-4 w-4" />
            <span>Choose Files</span>
          </Button>
        </div>
      )}
    </div>
  );
}