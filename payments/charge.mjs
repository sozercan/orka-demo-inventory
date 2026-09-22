// The checkout can retry the same payment while its first request is waiting.
// Each event ID should charge once, even when two requests overlap.
export function createPaymentService(charge) {
  const receipts = new Map();

  return async function pay(eventId, amount) {
    if (!receipts.has(eventId)) {
      const receipt = Promise.resolve()
        .then(() => charge(amount))
        .catch(error => {
          receipts.delete(eventId);
          throw error;
        });
      receipts.set(eventId, receipt);
    }
    return receipts.get(eventId);
  };
}
