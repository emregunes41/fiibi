const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst({
    where: { email: "hello@pinowed.com" },
    include: { 
        reservations: { include: { packages: true, payments: true } }
    }
  });

  try {
    const unifiedTotalNumeric = user.reservations.reduce((sum, r) => sum + parseFloat(r.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0'), 0);
    const unifiedPayments = user.reservations.flatMap(r => r.payments || []);
    const allPackages = user.reservations.flatMap(r => r.packages || []);
    const firstUnpaidRes = user.reservations.find(r => {
      const rt = parseFloat(r.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
      const rp = (r.payments || []).reduce((s, p) => s + p.amount, 0);
      return rt - rp > 0;
    });
    const primaryRes = firstUnpaidRes || user.reservations[0];
    const hasCash = user.reservations.some(r => r.paymentPreference === "CASH");
    
    const reservation = {
        id: primaryRes.id,
        totalAmount: unifiedTotalNumeric.toString(),
        payments: unifiedPayments,
        paymentPreference: hasCash ? "CASH" : primaryRes.paymentPreference,
        packages: allPackages,
        brideEmail: primaryRes.brideEmail,
        brideName: primaryRes.brideName,
        bridePhone: primaryRes.bridePhone
    };

    // Simulate PaymentSection
    const isCashOnly = reservation.paymentPreference === "CASH";
    const originalTotalAmount = parseFloat(reservation.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
    const payments = reservation.payments || [];
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    
    const baseRemaining = Math.max(0, originalTotalAmount - totalPaid);
    const cardRemaining = isCashOnly ? Math.round(baseRemaining * 1.15) : baseRemaining;
    
    const currentRemaining = baseRemaining;
    const currentTotalAmount = originalTotalAmount;
    
    const pct = currentTotalAmount > 0 ? Math.min(100, (totalPaid / currentTotalAmount) * 100) : 0;
    const isPaid = totalPaid >= currentTotalAmount && currentTotalAmount > 0;

    console.log("PAYMENT SUCCESS!");
  } catch(e) {
    console.error("PAYMENT CRASH", e);
  }
}
run();
