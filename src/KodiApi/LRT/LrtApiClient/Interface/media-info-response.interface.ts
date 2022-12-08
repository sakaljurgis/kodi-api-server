export class MediaInfoResponseInterface {
  id: number;
  title: string;
  type: number;
  content: string;
  category_id: number;
  heritage: any;
  date: string;
  offset: number;
  tags: Array<{
    slug: string;
    first: 1;
    last: number;
    name: string;
  }>;
  url: string;
  full_url: string;
  playlist_item: {
    file: string;
    title: string;
    image: string;
    mediaid: number;
  };
}
