import fs from "fs";

const text = fs.readFileSync("lib/meal/seedMeals.ts", "utf8");
const meals = [];

for (const line of text.split("\n")) {
  const nameMatch = line.match(/name: "([^"]+)"/);
  if (nameMatch) meals.push({ name: nameMatch[1], url: null, source: null });
  const unsplashMatch = line.match(/UNSPLASH\("([^"]+)"\)/);
  if (unsplashMatch && meals.length) {
    meals[meals.length - 1].url =
      `https://images.unsplash.com/${unsplashMatch[1]}?w=800&q=80&auto=format`;
    meals[meals.length - 1].source = "unsplash";
  }
  const foodishMatch = line.match(/FOODISH\("([^"]+)", (\d+)\)/);
  if (foodishMatch && meals.length) {
    const cat = foodishMatch[1];
    const n = foodishMatch[2];
    meals[meals.length - 1].url = `https://foodish-api.com/images/${cat}/${cat}${n}.jpg`;
    meals[meals.length - 1].source = "foodish";
  }
}

let ok = 0;
let fail = 0;
const failed = [];

for (const meal of meals) {
  try {
    const res = await fetch(meal.url, { redirect: "follow" });
    if (res.ok) {
      ok++;
      console.log("OK", meal.name);
    } else {
      fail++;
      failed.push(meal);
      console.log("FAIL", res.status, meal.source, meal.name);
    }
  } catch (err) {
    fail++;
    failed.push(meal);
    console.log("ERR", meal.name, String(err));
  }
}

console.log(`\n${ok} ok, ${fail} failed of ${meals.length}`);
if (failed.length) {
  console.log("\nFailed URLs:");
  for (const m of failed) console.log("-", m.name, m.url);
}
