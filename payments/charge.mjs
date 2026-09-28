// The checkout can retry the same payment while its first request is waiting.
// Each event ID should charge once, even when two requests overlap.
export function createPaymentService(charge) {
  const receipts = new Map();
  const pending = new Map();

  return async function pay(eventId, amount) {
    if (receipts.has(eventId)) {
      return receipts.get(eventId);
    }

    if (pending.has(eventId)) {
      return pending.get(eventId);
    }

    const promise = charge(amount).then(receipt => {
      receipts.set(eventId, receipt);
      return receipt;
    }).catch(error => {
      pending.delete(eventId);
      throw error;
    });

    pending.set(eventId, promise);

    return promise;
  };
}
