import "dotenv/config";

interface MigrationOptions {
  dryRun: boolean;
  eventId?: string;
}

const printUsage = () => {
  console.log(`
RSVP kayitlarini davetli planina aktarir.

Kullanim:
  npm run migrate:rsvps-to-guest-list -- [--dry-run] [--event-id=<uuid>]

Secenekler:
  --dry-run          Veritabanini degistirmeden aktarim sayisini gosterir.
  --event-id=<uuid>  Yalnizca belirtilen etkinligin RSVP kayitlarini aktarir.
  --help             Bu aciklamayi gosterir.
`);
};

const parseOptions = (args: string[]): MigrationOptions => {
  if (args.includes("--help")) {
    printUsage();
    process.exit(0);
  }

  const eventArgument = args.find((argument) => argument.startsWith("--event-id="));
  const eventId = eventArgument?.slice("--event-id=".length).trim();

  if (eventArgument && !eventId) {
    throw new Error("--event-id degeri bos olamaz");
  }

  return {
    dryRun: args.includes("--dry-run"),
    eventId,
  };
};

const main = async () => {
  const options = parseOptions(process.argv.slice(2));
  const { migrateRsvpsToGuestList } = await import(
    "../modules/guest-list/guest-list.service.js"
  );
  const { prisma } = await import("../modules/prisma.js");

  try {
    if (options.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: options.eventId },
        select: { id: true, title: true },
      });

      if (!event) {
        throw new Error(`Etkinlik bulunamadi: ${options.eventId}`);
      }

      console.log(`Etkinlik: ${event.title} (${event.id})`);
    }

    const result = await migrateRsvpsToGuestList(options);

    if (!result.totalRsvps) {
      console.log("Aktarilacak RSVP kaydi bulunamadi.");
      return;
    }

    console.log(`Toplam RSVP: ${result.totalRsvps}`);
    console.log(`Daha once aktarilmis: ${result.alreadyMigrated}`);
    console.log(`Aktarilmayi bekleyen: ${result.pending}`);

    if (options.dryRun) {
      console.log("Dry-run tamamlandi; veritabaninda degisiklik yapilmadi.");
      return;
    }

    if (!result.pending) {
      console.log("Tum RSVP kayitlari daha once aktarilmis.");
      return;
    }

    console.log(`Yeni olusturulan davetli kaydi: ${result.created}`);
    console.log(`Atlanan mevcut kayit: ${result.skippedExisting}`);
  } finally {
    await prisma.$disconnect();
  }
};

main()
  .catch((error) => {
    console.error("RSVP aktarimi basarisiz:", error);
    process.exitCode = 1;
  });
