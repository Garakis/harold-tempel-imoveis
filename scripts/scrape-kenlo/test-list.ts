import { listAllPropertyUrls } from "./list";

(async () => {
  const urls = await listAllPropertyUrls();
  console.log(`Found ${urls.length} property URLs:\n`);
  for (const u of urls) {
    console.log(`  [${u.modality}] ${u.url}`);
  }
})();
