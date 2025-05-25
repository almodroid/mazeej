import { format } from "date-fns";
import { Paperclip, Upload, Download, Trash, FileIcon, Loader2, X, Eye } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

// Project file type
export interface ProjectFile {
  id: number;
  projectId: number;
  userId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

interface ProjectFilesProps {
  files: ProjectFile[];
  canUploadFiles: boolean;
  isLoadingFiles: boolean;
  onUploadFiles: (files: File[]) => void;
  onDownloadFile: (file: ProjectFile) => void;
  onDeleteFile: (fileId: number) => void;
  isUploadingFile: boolean;
  onPreviewFile: (file: ProjectFile) => void;
  isPreviewableFile: (file: ProjectFile) => boolean;
}

export default function ProjectFiles({
  files,
  canUploadFiles,
  isLoadingFiles,
  onUploadFiles,
  onDownloadFile,
  onDeleteFile,
  isUploadingFile,
  onPreviewFile,
  isPreviewableFile
}: ProjectFilesProps) {
  const { t } = useTranslation();
  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFilesToUpload(prev => [...prev, ...newFiles]);
    }
  };

  // Handle file upload
  const handleFileUpload = () => {
    if (filesToUpload.length === 0) return;
    
    onUploadFiles(filesToUpload);
    setFilesToUpload([]);
    setShowFileUploadDialog(false);
  };

  return (
    <div className="mt-8 border-t pt-6">
      <div className="flex justify-between items-center mb-4 px-6">
        <h3 className="text-lg font-semibold">
          <div className="flex items-center">
            <Paperclip className="h-5 w-5 mr-2" />
            {t("projects.attachments", { defaultValue: "Attachments" })}
          </div>
        </h3>
        {canUploadFiles && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowFileUploadDialog(true)}
          >
            <Upload className="h-4 w-4 mx-2" />
            {t("projects.uploadFiles", { defaultValue: "Upload Files" })}
          </Button>
        )}
      </div>
      
      {isLoadingFiles ? (
        <div className="text-center py-6">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t("common.loading", { defaultValue: "Loading..." })}
          </p>
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-6 border rounded-md bg-muted/10">
          <Paperclip className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {t("projects.noAttachments", { defaultValue: "No attachments available" })}
          </p>
        </div>
      ) : (
        <div className="space-y-2 p-4">
          {files.map((file) => (
            <div 
              key={file.id} 
              className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/5"
            >
              <div className="flex items-center">
                <FileIcon className="h-5 w-5 text-primary mr-3" />
                <div>
                  <p className="font-medium text-sm">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)} • {file.mimeType} • {format(new Date(file.uploadedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isPreviewableFile(file) && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onPreviewFile(file)}
                    title={t("common.preview", { defaultValue: "Preview" })}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onDownloadFile(file)}
                  title={t("common.download", { defaultValue: "Download" })}
                >
                  <Download className="h-4 w-4" />
                </Button>
                {canUploadFiles && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive"
                    onClick={() => onDeleteFile(file.id)}
                    title={t("common.delete", { defaultValue: "Delete" })}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* File upload dialog */}
      {showFileUploadDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                {t("projects.uploadFiles", { defaultValue: "Upload Files" })}
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowFileUploadDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                />
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium">
                  {t("projects.dragAndDrop", { defaultValue: "Drag and drop files, or click to select" })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("projects.supportedFormats", { defaultValue: "PDF, Word, Excel, Images, etc." })}
                </p>
              </div>
              
              {filesToUpload.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-medium">
                    {t("projects.selectedFiles", { defaultValue: "Selected Files" })} ({filesToUpload.length})
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {filesToUpload.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center overflow-hidden">
                          <FileIcon className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                          <p className="text-sm truncate">{file.name}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilesToUpload(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowFileUploadDialog(false)}
              >
                {t("common.cancel", { defaultValue: "Cancel" })}
              </Button>
              <Button 
                onClick={handleFileUpload}
                disabled={filesToUpload.length === 0 || isUploadingFile}
              >
                {isUploadingFile ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("common.uploading", { defaultValue: "Uploading..." })}</>
                ) : (
                  t("common.upload", { defaultValue: "Upload" })
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 