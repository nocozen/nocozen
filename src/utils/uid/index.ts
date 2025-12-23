import { snowflakeIdv1 } from './snowflakeIdv1';

// const WorkerId = process.env.WorkerId == undefined ? 1 : process.env.WorkerId
class Uidv1 {
  private static instance: snowflakeIdv1;

  constructor() {}

  public static getInstance() {
    if (!this.instance) {
      this.instance = new snowflakeIdv1({ workerId: 1 });
    }
    return this.instance;
  }
}

export default Uidv1.getInstance();