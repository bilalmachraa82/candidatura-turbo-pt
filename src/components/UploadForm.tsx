
import React, { useState } from 'react';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface UploadFormProps {
  title: string;
  description: string;
  acceptedFileTypes?: string;
  projectId: string;
  onFileUploaded?: (file: {name: string, url: string, type: string}) => void;
}

const UploadForm: React.FC<UploadFormProps> = ({
  title,
  description,
  acceptedFileTypes = "application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  projectId,
  onFileUploaded
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const fileType = file.type;
    const acceptedTypes = acceptedFileTypes.split(',');
    
    if (!acceptedTypes.includes(fileType)) {
      toast({
        variant: "destructive",
        title: "Formato de ficheiro não suportado",
        description: "Por favor, carregue um ficheiro PDF ou Excel."
      });
      return;
    }
    
    setUploadedFile(file);
  };

  const handleUpload = async () => {
    if (!uploadedFile) return;
    
    setIsLoading(true);

    // Simulate file upload delay
    try {
      // Here we would actually upload to Supabase storage
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockFileUrl = `https://storage.turismoportugal.pt/${projectId}/${uploadedFile.name}`;
      
      // After successful upload
      toast({
        title: "Ficheiro carregado com sucesso",
        description: `${uploadedFile.name} foi carregado e será indexado automaticamente.`
      });
      
      // Call the callback with file info
      if (onFileUploaded) {
        onFileUploaded({
          name: uploadedFile.name,
          url: mockFileUrl,
          type: uploadedFile.type
        });
      }

      // Reset the form state
      setUploadedFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Erro no carregamento",
        description: "Não foi possível carregar o ficheiro. Por favor tente novamente."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium text-pt-blue mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      {!uploadedFile ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging ? "border-pt-green bg-pt-green/5" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center">
            <Upload className="h-10 w-10 text-gray-400 mb-3" />
            <p className="text-sm font-medium mb-1">
              Arraste e solte um ficheiro aqui, ou
            </p>
            <label className="cursor-pointer">
              <span className="text-sm text-pt-green font-medium hover:underline">
                selecione no seu computador
              </span>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={acceptedFileTypes}
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              PDF, Excel (.xlsx) até 10MB
            </p>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <File className="h-8 w-8 text-pt-blue mr-3" />
              <div>
                <p className="text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                className="bg-pt-green hover:bg-pt-green/90"
                onClick={handleUpload}
                disabled={isLoading}
              >
                {isLoading ? "A carregar..." : "Carregar"}
              </Button>
              <Button 
                size="icon" 
                variant="ghost"
                onClick={removeFile}
                disabled={isLoading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadForm;
