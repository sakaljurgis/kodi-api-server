import { FileEntity } from '../../Entity/file.entity';

export interface FileEntityExpanderInterface {
  expand(fileEntity: FileEntity): Promise<FileEntity>;
}
