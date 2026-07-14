const {PrismaClient} = require("@prisma/client");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const outputPath = path.join(__dirname, "../../public/static/data/sign-names.json");
const prisma = new PrismaClient();

async function main() {
  const signs = await prisma.signs.findMany({
    select: {
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });
  const signNames = signs.map((sign) => sign.name);

  fs.mkdirSync(path.dirname(outputPath), {recursive: true});
  fs.writeFileSync(outputPath, `${JSON.stringify(signNames, null, 2)}\n`);
  console.log(`Exported ${signNames.length} sign names to ${outputPath}`);
}

main()
  .catch((error) => {
    console.error("Failed to export sign names:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
