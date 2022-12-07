export default class NotificationResponse {
  notification: string;
  refreshContainer: boolean;

  constructor(message: string, refreshContainer = true) {
    this.notification = message;
    this.refreshContainer = refreshContainer;
  }
}
