const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const user = await prisma.user.findFirst({
    where: { email: "hello@pinowed.com" },
    include: { 
      reservations: { where: { status: { not: "DELETED" } }, include: { packages: true, payments: { orderBy: { createdAt: 'desc' } }, albumModel: true }, orderBy: { createdAt: 'desc' } },
      purchases: { orderBy: { purchaseDate: 'desc' } }
    }
  });

  const getEffectiveStatus = (res) => {
    if (res.selectedPhotos && !res.selectionLocked && res.workflowStatus === "SELECTION_PENDING") return "PREPARING";
    if (res.workflowStatus === "PENDING") {
      const eventDate = new Date(res.eventDate);
      if (eventDate < new Date()) return "EDITING";
    }
    if (res.workflowStatus === "SHOT_DONE") return "EDITING";
    if (res.workflowStatus === "ALBUM_PREPARING") return "PREPARING";
    return res.workflowStatus;
  };

  try {
    const allDeliveryDates = user.reservations.filter(r => r.deliveryDate).map(r => new Date(r.deliveryDate));
    const maxDeliveryDate = allDeliveryDates.length > 0 ? new Date(Math.max(...allDeliveryDates)) : null;

    user.reservations.map((res) => {
      const effectiveStatus = getEffectiveStatus(res);
      const pkgFields = (res.customFieldAnswers || []).filter(a => a.packageName === "Standart Paket");
      const pkgAddons = (res.selectedAddons || []).filter(a => a.packageName === "Standart Paket");
      
    });

    const unifiedTotalNumeric = user.reservations.reduce((sum, r) => {
      return sum + parseFloat(r.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
    }, 0);

    const firstUnpaidRes = user.reservations.find(r => {
      const rt = parseFloat(r.totalAmount?.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, '') || '0');
      const rp = (r.payments || []).reduce((s, p) => s + p.amount, 0);
      return rt - rp > 0;
    });

    console.log("SUCCESS!");
  } catch(e) {
    console.error("SERVER RENDER CRASH: ", e);
  }
}
run();
