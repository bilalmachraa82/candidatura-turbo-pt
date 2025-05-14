
// Upload Form Props
export interface UploadFormProps {
  title: string;
  description: string;
  projectId: string;
  acceptedFileTypes?: string;
  onFileUploaded: (file: { name: string; url: string; type: string }) => void;
}
