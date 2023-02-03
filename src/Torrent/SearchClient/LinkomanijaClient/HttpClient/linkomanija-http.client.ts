import { Agent, RequestOptions, request, get } from 'https';
import {
  configService,
  ConfigService,
} from '../../../../config/config.service';
import { IncomingMessage } from 'http';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LinkomanijaHttpClient {
  private readonly configService: ConfigService;
  private readonly requestOptions: RequestOptions;
  private consecutiveLoginFails: number;
  private lastLoginFailTimeStamp = 0;

  constructor() {
    this.requestOptions = {
      headers: {},
      agent: new Agent({ keepAlive: true }),
      rejectUnauthorized: false,
      hostname: 'www.linkomanija.net',
      port: 443,
    };

    this.configService = configService;
  }

  public async search(query: string): Promise<string> {
    const c = ['c29', 'c52', 'c30', 'c60', 'c53', 'c61', 'c28', 'c62'];
    const path = `/browse.php?${c.join('=1&')}=1&incldead=0&search=${query}`;

    return this.getPage(path);
  }

  public async getTop(category: string, time: string): Promise<string> {
    const path = `/browse.php?top=${category}&time=${time}`;

    return this.getPage(path);
  }

  private async getPage(path: string): Promise<string> {
    const options = {
      ...this.requestOptions,
      path: encodeURI(path),
      method: 'POST',
    };

    const response: IncomingMessage | false = await this.httpGet(options).catch(
      () => false,
    );

    if (response === false) {
      return Promise.reject();
    }

    this.parseAndSetCookie(response);

    if (
      response.statusCode === 302 &&
      response.headers.location.includes('login.php')
    ) {
      //need to log in
      const loggedIn = await this.login().catch(() => false);
      if (loggedIn || this.checkLoginSafeToAttempt()) {
        return this.getPage(path);
      }
      return Promise.reject();
    }

    return new Promise((resolve) => {
      let rawData = '';
      response.on('data', (chunk) => (rawData += chunk));
      response.on('end', () => {
        resolve(rawData);
      });
    });
  }

  private httpGet(options: RequestOptions): Promise<IncomingMessage> {
    return new Promise((resolve, reject) => {
      const req = get(options, (res) => {
        resolve(res);
      });
      req.on('error', (err) => {
        reject(err);
      });
    });
  }

  private login(): Promise<boolean> {
    if (!this.checkLoginSafeToAttempt()) {
      console.log('LM too many login attempts reached');
      return Promise.reject();
    }

    const options = {
      ...this.requestOptions,
      path: '/takelogin.php',
      method: 'POST',
    };

    const userName = process.env['LINKOMANIJA_USERNAME'];
    const password = process.env['LINKOMANIJA_PASSWORD'];
    const postData = `username=${userName}&password=${password}&commit=Prisijungti`;

    options.headers = JSON.parse(JSON.stringify(options.headers));
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.headers['Content-Length'] = Buffer.byteLength(postData);

    return new Promise((resolve, reject) => {
      const req = request(options, (res) => {
        this.parseAndSetCookie(res);

        if (
          res.statusCode === 302 &&
          !res.headers.location.includes('login.php')
        ) {
          this.consecutiveLoginFails = 0;
          resolve(true);
          return;
        }

        this.increaseLoginFailures();
        reject();
      });

      req.on('error', (e) => {
        this.increaseLoginFailures();
        reject();
      });

      req.write(postData);
      req.end();
    });
  }

  private parseAndSetCookie(response: IncomingMessage): void {
    const cookieToSet = response.headers['set-cookie'];
    if (cookieToSet) {
      this.requestOptions.headers['cookie'] = cookieToSet[0].split(';')[0];
    }
  }

  private increaseLoginFailures(): void {
    this.consecutiveLoginFails++;
    this.lastLoginFailTimeStamp = Date.now();
  }

  private checkLoginSafeToAttempt(): boolean {
    return (
      this.consecutiveLoginFails <= 5 ||
      this.lastLoginFailTimeStamp < Date.now() - 1000 * 60 * 5
    );
  }
}
