import * as Dotenv from 'dotenv';
const dotenv: any = Dotenv.config().parsed;

class Config {
  public readonly port = dotenv.PORT;
  getPort() {
    return process.env.PORT;
  }
  //todo - check dotenv again if not loaded before emmiting err.
  //works globally, loaded once
}

export default new Config();
