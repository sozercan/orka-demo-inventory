// The checkout can retry the same payment while its first request is waiting.
// Each event ID should charge once, even when two requests overlap.
export function createPaymentService(charge) {
  const receipts = new Map();

  return async function pay(eventId, amount) {
    if (receipts.has(eventId)) {
      return receipts.get(eventId);
    }

    const receiptPromise = Promise.resolve()
      .then(() => charge(amount))
      .then(receipt => {
        receipts.set(eventId, receipt);
        return receipt;
      }, error => {
        receipts.delete(eventId);
        throw error;
      });

    receipts.set(eventId, receiptPromise);
    return receiptPromise;
  };
}
