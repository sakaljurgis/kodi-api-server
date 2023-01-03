import { StaticService } from './static.service';

describe('StaticService', () => {
  let staticService: StaticService;

  beforeEach(() => {
    staticService = new StaticService();
  });

  describe('provideDirIndex', () => {
    it('should return file/dir list of dir', async () => {
      jest.spyOn(staticService, 'provideDirIndex');
      process.env.STATIC_SERVE_FOLDER = 'test/Static/_test-data/StaticServe';

      const result = await staticService.provideDirIndex('');
      expect(result).toHaveLength(2);
    });
  });
});
