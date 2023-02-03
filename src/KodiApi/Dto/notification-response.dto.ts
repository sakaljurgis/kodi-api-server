export default class NotificationResponse {
  readonly notification: string;
  readonly refreshContainer: boolean;
  readonly updateList = false;

  constructor(message: string, refreshContainer = true) {
    this.notification = message;
    this.refreshContainer = refreshContainer;
  }
}
