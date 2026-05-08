/**
 * Smoke test the parser on a single property URL.
 *
 * Run with: npx tsx scripts/scrape-kenlo/test-one.ts
 */
import { fetchProperty } from "./parse";

const url =
  process.argv[2] ??
  "https://www.haroldtempelimoveis.com.br/imovel/casa-mococa-4-quartos-244-m/CA0034-HAR5";

(async () => {
  console.log(`Fetching ${url} …`);
  const property = await fetchProperty(url, "venda");
  console.log(JSON.stringify(property, null, 2));
  console.log(`\n=== summary ===`);
  console.log(`code: ${property.code}`);
  console.log(`title: ${property.title}`);
  console.log(`location: ${property.neighborhood_name} - ${property.city_name}/${property.city_uf}`);
  console.log(
    `metrics: ${property.bedrooms}q ${property.suites}st ${property.bathrooms}b ${property.parking_spaces}v`
  );
  console.log(`area: ${property.built_area_m2}m² built, ${property.total_area_m2}m² terreno`);
  console.log(`price: venda ${property.sale_price} | aluguel ${property.rental_price}`);
  console.log(`features (${Object.keys(property.features).length}): ${Object.keys(property.features).join(", ")}`);
  console.log(`photos: ${property.photo_urls.length}`);
})();
