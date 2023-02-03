import { FileEntity } from '../../../Shared/Entity/file.entity';

export interface FileEntityExpanderInterface {
  expand(fileEntity: FileEntity): Promise<FileEntity>;
}
