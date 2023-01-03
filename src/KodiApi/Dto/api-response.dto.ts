import ResponseItem from './response-item.dto';

export default class ApiResponse {
  items: Array<ResponseItem> = [];
  content = 'videos';
  updateList = true;
  category: string | undefined;
  play: string | undefined;
  msgBoxOK: string | undefined;
  nosort: boolean | undefined;

  setTitle(title) {
    this.category = title;

    return this;
  }

  setToPlayable(path) {
    this.updateList = false;
    this.play = path;

    return this;
  }

  createItem() {
    const item = new ResponseItem();
    this.items.push(item);

    return item;
  }

  addMessage(message) {
    this.msgBoxOK = message;

    return this;
  }

  setNoSort(value = true) {
    this.nosort = value;

    return this;
  }
}
