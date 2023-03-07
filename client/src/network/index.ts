import {JSONRPCClient, JSONRPCParams} from 'json-rpc-2.0';

import EventListenerBase from './eventListenerBase';
import {Socket} from './websocket';

export class Client extends EventListenerBase<{
  open: () => any;
  reconnect: () => any;
  close: () => any;
}> {
  private socket: Socket;
  private initialized = false;

  client: JSONRPCClient;
  retryTimeout?: NodeJS.Timeout;

  get isInitialized() {
    return this.initialized;
  }

  get isUp() {
    return this.socket.isUp;
  }

  constructor() {
    super();
    this.socket = new Socket('ws://localhost:3000');
    this.socket.addEventListener('message', this.handleMessage.bind(this));
    this.socket.addEventListener('open', this.handleOpen.bind(this));
    this.socket.addEventListener('error', this.handleError.bind(this));
    this.socket.addEventListener('close', this.handleClose.bind(this));

    this.client = new JSONRPCClient(request => {
      try {
        this.socket.send(JSON.stringify(request));
        return Promise.resolve();
      } catch (error) {
        console.log({error});

        return Promise.reject(error);
      }
    });
  }

  private handleMessage(data: string) {
    const json = JSON.parse(data);
    if (json.jsonrpc) {
      this.client.receive(json);
    }
  }

  private handleOpen() {
    console.log('open');
    this.clearRetry();

    if (!this.initialized) {
      this.initialized = true;
      this.dispatchEvent('open');
    } else {
      this.dispatchEvent('reconnect');
    }
  }

  private handleError() {
    this.dispatchEvent('close');

    this.retryTimeout = setTimeout(() => {
      this.socket.connect();
    }, 2000);
  }

  private handleClose() {
    this.dispatchEvent('close');
    this.retryTimeout = setTimeout(() => {
      this.socket.connect();
    }, 2000);
  }

  request(
    method: string,
    params?: JSONRPCParams,
    clientParams?: void,
  ): PromiseLike<any> {
    if (!this.socket.isUp) {
      // throw Error('Socket is not established');
    }

    return this.client.request(method, params, clientParams);
  }

  getSocket(): Socket {
    return this.socket;
  }

  clearRetry() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      delete this.retryTimeout;
    }
  }
}

export const client = new Client();
