// The checkout can retry the same payment while its first request is waiting.
// Each event ID should charge once, even when two requests overlap.
export function createPaymentService(charge) {
  const receipts = new Map();

  return async function pay(eventId, amount) {
    if (receipts.has(eventId)) {
      return receipts.get(eventId);
    }

    const receipt = charge(amount);
    receipts.set(eventId, receipt);

    try {
      return await receipt;
    } catch (error) {
      if (receipts.get(eventId) === receipt) {
        receipts.delete(eventId);
      }
      throw error;
    }
  };
}
