import { loadData } from "./jsonData.js";

export async function listOffices() {
  const { offices, hq } = await loadData("offices.json");
  return { hq, offices };
}

export async function officeStats() {
  const { offices } = await loadData("offices.json");
  return {
    offices: offices.length,
    countries: new Set(offices.map((o) => o.country)).size,
    people: offices.reduce((sum, o) => sum + o.team, 0),
  };
}
