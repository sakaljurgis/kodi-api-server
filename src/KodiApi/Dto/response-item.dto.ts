import ContextMenu from './context-menu.dto';

export default class ResponseItem {
  isFolder = false;
  isPlayable = true;
  IsPlayable = true; //backwards compatability
  mediatype: string;
  action: 'query' | 'search';
  label: string;
  path: string;
  size: number;
  plot: string;
  duration: number;
  thumb: string;
  contextMenus: Array<ContextMenu>;
  date: string;
  searchFor: string;

  constructor() {
    this.setToPlayable();
  }

  setToFolder() {
    this.isFolder = true;
    delete this.isPlayable;
    delete this.IsPlayable;
    delete this.mediatype;
    delete this.action;

    return this;
  }

  setToPlayable(withQueryAction = false) {
    this.isFolder = false;
    this.isPlayable = true;
    this.IsPlayable = true;
    this.mediatype = 'video';

    // if path provided is not to a video, but additional api request is needed
    // for video url
    if (withQueryAction) {
      this.action = 'query';
    }

    return this;
  }

  setActionSearch(searchFor: string | null = null) {
    this.action = 'search';
    delete this.isPlayable;
    delete this.IsPlayable;
    delete this.mediatype;
    this.isFolder = false;

    if (searchFor) {
      this.searchFor = searchFor;
    }

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

  setSize(size: number) {
    this.size = size;

    return this;
  }

  setPlot(plot: string) {
    this.plot = plot;

    return this;
  }

  setDuration(duration: number) {
    this.duration = duration;

    return this;
  }

  setThumb(thumb: string) {
    this.thumb = thumb;

    return this;
  }

  setDate(date: string) {
    this.date = date;

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
