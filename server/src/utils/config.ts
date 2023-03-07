require('dotenv-flow').config();
const apiKey = process.env.LIVEKIT_API_KEY as string;
const apiSecret = process.env.LIVEKIT_API_SECRET as string;
const host = process.env.HOST as string;
const port = parseInt(process.env.PORT || '3000');
const livekitHost = process.env.LIVEKIT_HOST as string;

export interface Config {
  host: string;
  port: number;
  apiKey: string;
  apiSecret: string;
  livekitHost: string;
}

export const config: Config = {
  apiKey,
  apiSecret,
  host,
  port,
  livekitHost,
};
