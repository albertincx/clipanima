import React, { useState, useRef } from 'react';

interface LoadFramesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadFrames: (frames: string[]) => void;
  currentFrameCount: number;
}

const LoadFramesModal: React.FC<LoadFramesModalProps> = ({ 
  isOpen, 
  onClose, 
  onLoadFrames,
  currentFrameCount
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoCreate, setAutoCreate] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const imageFiles = files.filter(file => 
        file.type.startsWith('image/') || 
        file.name.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/i)
      );
      
      setSelectedFiles(imageFiles);
      
      // Create preview URLs for selected images
      const urls = imageFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const handleLoad = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one image file.');
      return;
    }

    // Confirm before replacing current workspace
    if (currentFrameCount > 0) {
      const confirmed = window.confirm(
        `This will replace your current ${currentFrameCount} frame(s) with ${selectedFiles.length} new frame(s). Are you sure you want to continue?`
      );
      
      if (!confirmed) {
        return;
      }
    }

    setIsLoading(true);
    
    try {
      // Convert selected files to base64 data URLs
      const frameDataUrls = await Promise.all(
        selectedFiles.map(file => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
          });
        })
      );
      
      onLoadFrames(frameDataUrls);
      onClose();
    } catch (error) {
      console.error('Error loading frames:', error);
      alert('Error loading frames. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(file => 
        file.type.startsWith('image/') || 
        file.name.match(/\.(png|jpg|jpeg|gif|bmp|webp)$/i)
      );
      
      setSelectedFiles(imageFiles);
      
      // Create preview URLs for selected images
      const urls = imageFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div 
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Load Frames</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <p className="text-gray-300 mb-2">
              Select image files to load as animation frames. Supported formats: PNG, JPG, JPEG, GIF, BMP, WebP.
            </p>
            
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                id="autoCreate"
                checked={autoCreate}
                onChange={(e) => setAutoCreate(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="autoCreate" className="text-gray-300">
                Auto-create frames from selected files
              </label>
            </div>
          </div>

          <div 
            className={`border-2 border-dashed border-gray-600 rounded-lg p-6 text-center cursor-pointer mb-4 ${
              selectedFiles.length > 0 ? 'bg-gray-700' : 'bg-gray-900'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept="image/*"
            />
            {selectedFiles.length === 0 ? (
              <div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mt-2 text-gray-400">Click or drag and drop image files here</p>
                <p className="text-sm text-gray-500">Supports PNG, JPG, JPEG, GIF, BMP, WebP</p>
              </div>
            ) : (
              <div>
                <p className="text-white mb-2">
                  {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-sm text-gray-400">Click to select more files</p>
              </div>
            )}
          </div>

          {previewUrls.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">Preview</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-24 object-contain bg-gray-200 rounded"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs">{index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleLoad}
              disabled={isLoading || selectedFiles.length === 0}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isLoading || selectedFiles.length === 0
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoading ? 'Loading...' : `Load ${selectedFiles.length} Frame${selectedFiles.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadFramesModal;