
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileInput } from '@/components/ui/file-input';
import { useToast } from '@/components/ui/use-toast';
import { indexDocument } from '@/api/indexDocuments';

export interface UploadFormProps {
  title: string;
  description: string;
  projectId: string;
  acceptedFileTypes?: string;
  onFileUploaded: (file: { name: string; url: string; type: string }) => void;
}

export default function UploadForm({
  title,
  description,
  projectId,
  acceptedFileTypes,
  onFileUploaded
}: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor selecione um ficheiro."
      });
      return;
    }

    setIsUploading(true);

    try {
      const result = await indexDocument(projectId, file);

      if (result.success) {
        toast({
          title: "Ficheiro carregado",
          description: result.message
        });

        if (result.file) {
          onFileUploaded({
            name: result.file.name,
            url: result.file.url,
            type: result.file.type
          });
        }
        
        // Reset the selected file
        setFile(null);
        // Reset the file input value
        const fileInput = document.getElementById('file') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao carregar",
          description: result.message
        });
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Erro ao carregar",
        description: error.message || "Ocorreu um erro ao carregar o ficheiro."
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-gray-50">
      <h3 className="text-lg font-medium text-pt-blue mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="file">Selecione o ficheiro</Label>
          <FileInput
            id="file"
            accept={acceptedFileTypes}
            onChange={handleFileChange}
          />
          {file && (
            <p className="mt-2 text-sm text-gray-500">
              Ficheiro selecionado: {file.name}
            </p>
          )}
        </div>
        
        <Button type="submit" className="w-full bg-pt-green hover:bg-pt-green/90" disabled={isUploading}>
          {isUploading ? "A carregar..." : "Carregar"}
        </Button>
      </form>
    </div>
  );
}
