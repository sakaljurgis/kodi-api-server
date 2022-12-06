export default class ContextMenu {
  name: string;
  urlParams: { action: string; path: string };

  constructor(name, path) {
    this.name = name;
    this.urlParams = {
      action: 'query',
      path: path,
    };
  }
}
