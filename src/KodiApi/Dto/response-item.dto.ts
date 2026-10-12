import ContextMenu from './context-menu.dto';
import { WatchStateEntity } from '../../Shared/Entity/watch-state.entity';

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
  /** files: watch state like Kodi's, resume point in seconds */
  playcount: number;
  resume: { position: number; total: number };
  lastplayed: string;
  /** folders: watched episodes out of the total */
  watchedCount: number;
  totalCount: number;
  /** files listed outside their folder (Continue watching): where they are */
  folder: string;
  folderTitle: string;

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

  /** call after setDuration, it's the fallback for the resume total */
  setWatchState(state: WatchStateEntity | undefined) {
    this.playcount = state?.playCount ?? 0;
    if (state?.position > 0) {
      this.resume = {
        position: state.position,
        total: state.duration ?? this.duration ?? 0,
      };
    }
    if (state?.lastPlayed) {
      // Kodi's format
      this.lastplayed = new Date(state.lastPlayed)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);
    }

    return this;
  }

  setWatchedCount(watched: number, total: number) {
    this.watchedCount = watched;
    this.totalCount = total;

    return this;
  }

  setFolder(path: string, title: string) {
    this.folder = path;
    this.folderTitle = title;

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
