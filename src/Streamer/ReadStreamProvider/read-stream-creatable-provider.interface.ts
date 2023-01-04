import { FileEntity } from '../../VideoFiles/Entity/file.entity';
import { ReadStreamCreatable } from '../Interface/read-stream-creatable.interface';

export interface ReadStreamCreatableProviderInterface {
  supports(fileEntity: FileEntity): boolean;
  getReadStreamCreatable(fileEntity: FileEntity): Promise<ReadStreamCreatable>;
}
