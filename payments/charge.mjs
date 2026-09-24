// The checkout can retry the same payment while its first request is waiting.
// Each event ID should charge once, even when two requests overlap.
export function createPaymentService(charge) {
  const receipts = new Map();
  const inFlight = new Map();

  return async function pay(eventId, amount) {
    if (receipts.has(eventId)) {
      return receipts.get(eventId);
    }
    if (inFlight.has(eventId)) {
      return inFlight.get(eventId);
    }

    const attempt = (async () => charge(amount))()
      .then(receipt => {
        receipts.set(eventId, receipt);
        inFlight.delete(eventId);
        return receipt;
      }, error => {
        inFlight.delete(eventId);
        throw error;
      });

    inFlight.set(eventId, attempt);
    return attempt;
  };
}
