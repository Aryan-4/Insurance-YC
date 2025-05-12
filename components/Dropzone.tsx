'use client';

import { useState, useCallback } from 'react';

interface DropzoneProps {
  onFiles: (files: File[]) => void;
}

export default function Dropzone({ onFiles }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    
    setSelectedFiles(prevFiles => [...prevFiles, ...files]);
    onFiles(files);
  }, [onFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prevFiles => [...prevFiles, ...files]);
      onFiles(files);
    }
  }, [onFiles]);

  return (
    <div>
      <div 
        className={`dropzone ${isDragging ? 'active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <input
          id="fileInput"
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <p>Drop files here or click to upload</p>
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="selected-files">
          <p>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</p>
        </div>
      )}
    </div>
  );
} 

