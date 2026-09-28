export function createPaymentService(charge) {
  const receipts = new Map();
  const locks = new Map();

  return async function pay(eventId, amount) {
    if (receipts.has(eventId)) {
      return receipts.get(eventId);
    }
    
    // Acquire lock
    let lock;
    try {
      lock = await acquireLock(eventId);
      
      if (receipts.has(eventId)) {
        return receipts.get(eventId);
      }
      const receipt = await charge(amount);
      receipts.set(eventId, receipt);
      return receipt;
    } finally {
      if (lock) {
        await releaseLock(lock);
      }
    }
  };

  async function acquireLock(eventId) {
    return new Promise((resolve) => {
      locks.set(eventId, {
        resolve,
        pending: 0,
        active: false
      });
    });
  }

  async function releaseLock(lock) {
    lock.pending++;
    if (!lock.active) {
      lock.active = true;
      lock.resolve();
    }
  }
}
