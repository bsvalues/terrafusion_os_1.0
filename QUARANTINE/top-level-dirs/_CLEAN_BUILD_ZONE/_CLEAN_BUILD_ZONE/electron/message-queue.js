// Simple resilient FIFO message queue for OS bridge
class MessageQueue {
  constructor(maxSize = 1000) {
    this.queue = [];
    this.maxSize = maxSize;
  }

  enqueue(item) {
    if (this.queue.length >= this.maxSize) {
      // Drop oldest
      this.queue.shift();
    }
    this.queue.push(item);
  }

  drain() {
    const items = this.queue;
    this.queue = [];
    return items;
  }

  size() {
    return this.queue.length;
  }
}

module.exports = { MessageQueue };
