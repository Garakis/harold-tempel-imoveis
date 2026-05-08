import { load } from "cheerio";

const url =
  process.argv[2] ??
  "https://www.haroldtempelimoveis.com.br/imovel/casa-mococa-4-quartos-244-m/CA0034-HAR5";

(async () => {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });
  const html = await res.text();
  const $ = load(html);

  // Find an element containing the word "Características" then list its children
  const featuresHeading = $("*")
    .filter((_, el) => $(el).children().length === 0 && $(el).text().trim() === "Características")
    .first();
  console.log(`Features heading found: ${featuresHeading.length > 0}`);
  if (featuresHeading.length) {
    const parent = featuresHeading.parent();
    console.log(`Parent tag: ${parent[0]?.type === "tag" ? (parent[0] as any).name : "?"}`);
    console.log(`Parent siblings + children:`);
    parent.find("*").each((i, el) => {
      const t = $(el).clone().children().remove().end().text().trim();
      if (t && t.length > 0 && t.length < 80) {
        console.log(`  [${i}] <${(el as any).name}> "${t}"`);
      }
    });
  }
})();
