import EventListenerBase from './eventListenerBase';

export class Socket extends EventListenerBase<{
  open: () => void;
  message: (data: string) => any;
  close: () => void;
  error: () => void;
}> {
  private ws!: WebSocket;
  constructor(protected url: string) {
    super();
  }

  private removeListeners() {
    if (!this.ws) {
      return;
    }

    this.ws.removeEventListener('open', this.handleOpen);
    this.ws.removeEventListener('close', this.handleClose);
    this.ws.removeEventListener('error', this.handleError);
    this.ws.removeEventListener('message', this.handleMessage);
  }

  public connect() {
    console.log('connect', this.url);
    this.ws = new WebSocket(this.url, 'string');
    this.ws.addEventListener('open', this.handleOpen);
    this.ws.addEventListener('close', this.handleClose);
    this.ws.addEventListener('error', this.handleError);
    this.ws.addEventListener('message', this.handleMessage);
  }

  public close() {
    if (!this.ws) {
      return;
    }

    try {
      this.ws.close();
    } catch (err) {}

    this.dispatchEvent('close');
    this.removeListeners();
  }

  private handleOpen = () => {
    this.dispatchEvent('open');
  };

  private handleError = (error: WebSocketErrorEvent) => {
    console.log(error);
    if (!this.ws) {
      return;
    }

    if (this.ws.readyState > 1) {
      this.ws.close();
    }

    this.dispatchEvent('error');
    this.removeListeners();
  };

  private handleClose = (e?: WebSocketCloseEvent) => {
    console.log(e);
    this.ws.close();
    this.dispatchEvent('close');
    this.removeListeners();
  };

  private handleMessage = (event: WebSocketMessageEvent) => {
    this.dispatchEvent('message', event.data.toString());
  };

  public send = (body: string) => {
    this.ws.send(body);
  };

  get isUp() {
    return this.ws.readyState === 1;
  }
}
