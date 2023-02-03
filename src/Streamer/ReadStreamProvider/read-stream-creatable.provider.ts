import { ReadStreamCreatable } from '../Interface/read-stream-creatable.interface';
import { FileEntity } from '../../Shared/Entity/file.entity';
import { Inject, Injectable } from '@nestjs/common';
import { ReadStreamCreatableProviderInterface } from './read-stream-creatable-provider.interface';

export const ReadStreamCreatableProviders = 'ReadStreamCreatableProviders';

@Injectable()
export class ReadStreamCreatableProvider {
  constructor(
    @Inject(ReadStreamCreatableProviders)
    private providers: Array<ReadStreamCreatableProviderInterface>,
  ) {}
  getReadStreamCreatable(fileEntity: FileEntity): Promise<ReadStreamCreatable> {
    for (const provider of this.providers) {
      if (provider.supports(fileEntity)) {
        return provider.getReadStreamCreatable(fileEntity);
      }
    }
    return Promise.reject('no stream provider');
  }
}
