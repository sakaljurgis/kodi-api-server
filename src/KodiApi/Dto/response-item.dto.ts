import ContextMenu from './context-menu.dto';

export default class ResponseItem {
  isFolder = false;
  isPlayable = true;
  mediatype: string;
  action: 'query' | 'search';
  label: string;
  path: string;
  size: number;
  plot: string;
  duration: number;
  thumb: string;
  contextMenus: Array<ContextMenu>;

  constructor() {
    this.setToPlayable();
  }

  setToFolder() {
    this.isFolder = true;
    delete this.isPlayable;
    delete this.mediatype;
    delete this.action;

    return this;
  }

  setToPlayable(withQueryAction = false) {
    this.isFolder = false;
    this.isPlayable = true;
    this.mediatype = 'video';

    // if path provided is not to a video, but additional api request is needed
    // for video url
    if (withQueryAction) {
      this.action = 'query';
    }

    return this;
  }

  setActionSearch() {
    this.action = 'search';
    delete this.isPlayable;
    delete this.mediatype;
    this.isFolder = false;

    return this;
  }

  setLabel(label) {
    this.label = label;
    return this;
  }

  setPath(path) {
    this.path = path;

    return this;
  }

  setSize(size) {
    this.size = size;

    return this;
  }

  setPlot(plot) {
    this.plot = plot;

    return this;
  }

  setDuration(duration: number) {
    this.duration = duration;

    return this;
  }

  setThumb(thumb) {
    this.thumb = thumb;

    return this;
  }

  addContextMenu(name, path) {
    if (!this.contextMenus) {
      this.contextMenus = [];
    }
    const cm = new ContextMenu(name, path);
    this.contextMenus.push(cm);

    return this;
  }
}
