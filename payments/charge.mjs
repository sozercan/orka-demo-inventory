// The checkout can retry the same payment while its first request is waiting.
// Each event ID should charge once, even when two requests overlap.
export function createPaymentService(charge) {
  const receipts = new Map();
  const locks = new Map();

  return async function pay(eventId, amount) {
    if (receipts.has(eventId)) {
      return receipts.get(eventId);
    }

    if (locks.has(eventId)) {
      return locks.get(eventId);
    }

    const promise = (async () => {
      try {
        const receipt = await charge(amount);
        receipts.set(eventId, receipt);
        return receipt;
      } finally {
        locks.delete(eventId);
      }
    })();

    locks.set(eventId, promise);
    return promise;
  };
}
