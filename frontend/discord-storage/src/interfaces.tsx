export interface Folder {
  id: string;
  folderName: string;
  folderSize: number;
  files: File[];
}

export interface File {
  fileID: string;
  fileName: string;
  fileSize: number;
  dateCreated: string;
}
