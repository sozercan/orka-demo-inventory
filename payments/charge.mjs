// The checkout can retry the same payment while its first request is waiting.
// Each event ID should charge once, even when two requests overlap.
export function createPaymentService(charge) {
  const receipts = new Map();
  const locks = new Map();

  return async function pay(eventId, amount) {
    // Return cached receipt if available
    if (receipts.has(eventId)) {
      return receipts.get(eventId);
    }

    // If a charge is already in progress, return the promise
    if (locks.has(eventId)) {
      return locks.get(eventId);
    }

    // Create a new promise for the charge
    const promise = (async () => {
      try {
        const receipt = await charge(amount);
        receipts.set(eventId, receipt);
        return receipt;
      } finally {
        // Remove the lock after the charge is complete
        locks.delete(eventId);
      }
    })();

    // Store the promise in the locks map
    locks.set(eventId, promise);

    return promise;
  };
}
