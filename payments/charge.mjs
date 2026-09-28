export function createPaymentService(charge) {
  const receipts = new Map();

  return async function pay(eventId, amount) {
    if (receipts.has(eventId)) {
      return receipts.get(eventId);
    }
    const receipt = await charge(amount);
    receipts.set(eventId, receipt);
    return receipt;
  };
}
