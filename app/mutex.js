class Mutex {
    constructor() {
      this.locked = false;
      this.queue = [];
    }
  
    async lock() {
      return new Promise((resolve) => {
        if (!this.locked) {
          this.locked = true;
          resolve();
        } else {
          this.queue.push(resolve);
        }
      });
    }
  
    unlock() {
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        next();
      } else {
        this.locked = false;
      }
    }
  }
  
  export const exchangeMutex = new Mutex();