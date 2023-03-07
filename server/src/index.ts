import Koa from 'koa';
import Router from 'koa-router';
import {JSONRPCErrorCode, JSONRPCErrorException, JSONRPCRequest, JSONRPCServer} from 'json-rpc-2.0';
import koaBodyParser from 'koa-bodyparser';
import {ParameterizedContext} from 'koa';
import WebSocket from 'ws';
import websocket from 'koa-easy-ws';
import {WebhookReceiver} from 'livekit-server-sdk';

import Handler from './handlers';
import {config} from './utils/config';
import {Context} from './common/context';

export interface AppState {}

export type AppContext = ParameterizedContext<AppState>;

export class ApiServer {
  app: Koa<any, any>;
  jsonRpc: JSONRPCServer<any>;
  context: Context;
  webhookReceiver: WebhookReceiver;

  constructor() {
    this.app = new Koa();
    this.jsonRpc = new JSONRPCServer<any>({
      errorListener: this.errorListener.bind(this),
    });
    this.context = new Context();
    this.webhookReceiver = new WebhookReceiver(config.apiKey, config.apiSecret);
  }

  errorListener = (message: string, data: unknown): void => {
    console.log(message);
    return;
  };

  init() {
    this.addMiddlewares();
    this.initJsonRpc();
    this.addRoutes();
  }

  initJsonRpc() {
    const rpcHandler = new Handler(this.context) as any;
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(rpcHandler)).filter(item => typeof rpcHandler[item] === 'function');
    for (const methodName of methodNames) {
      this.jsonRpc.addMethod(methodName, this.rpcMethod(rpcHandler[methodName].bind(rpcHandler)));
    }
  }

  rpcMethod(handler: any) {
    return async (...params: any[]) => {
      try {
        return await handler(...params);
      } catch (err) {
        if (err) {
          throw new JSONRPCErrorException(err.message, JSONRPCErrorCode.InvalidParams, err.details);
        } else if (!(err instanceof JSONRPCErrorException)) {
          console.error('error occurred: ', err.toString(), err.stack);
          throw new JSONRPCErrorException('internal server error', 500, {});
        } else {
          throw err;
        }
      }
    };
  }

  addMiddlewares() {
    this.addWebSocket();
    this.app.use(async (ctx, next) => {
      ctx.set('Access-Control-Allow-Origin', '*');
      ctx.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
      ctx.set('Access-Control-Allow-Headers', '*');
      await next();
    });
    this.app.use(koaBodyParser({}));
  }

  handleJsonRpcRequest = async (ctx: AppContext) => {
    const jsonRPCRequest = ctx.request.body as JSONRPCRequest;
    const jsonRPCResponse = await this.jsonRpc.receive(jsonRPCRequest);
    if (jsonRPCResponse) {
      ctx.body = jsonRPCResponse;
    } else {
      ctx.status = 204;
    }
  };

  addWebSocket() {
    this.app.use(websocket());
    this.app.use(async (ctx, next) => {
      if (ctx.ws) {
        const sock: WebSocket = await ctx.ws();
        console.log('new connection');

        sock.addEventListener('message', async event => {
          const data = event.data.toString();
          const result = await this.jsonRpc.receiveJSON(data);
          sock.send(JSON.stringify(result));
        });
      } else {
        await next();
      }
    });
  }

  webhookHandler({req, res}: any) {
    // event is a WebhookEvent object
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });

    req.on('end', () => {
      const event = this.webhookReceiver.receive(data, req.headers.authorization);

      console.log('received webhook event', event);

      // res.writeHead(200);
      res.end();
    });
  }

  addRoutes() {
    const router = new Router();
    router.post('/json-rpc', this.handleJsonRpcRequest.bind(this));
    router.get('/', ctx => {
      return (ctx.body = 'hello');
    });
    router.post('/webhook', this.webhookHandler.bind(this));
    router.get('/token', async ctx => {
      const handler = new Handler(this.context);
      const params = ctx.request.query as any;
      const result = await handler.joinOrCreateRoom({identity: params.identity || 'test', roomName: params.roomName || 'test'});
      return (ctx.body = result.token);
    });

    this.app.use(router.routes()).use(router.allowedMethods());
  }

  start() {
    this.init();

    const port = config.port;
    console.log(`starting apiserver on port ${port}`);
    this.app.listen(port);
  }
}
