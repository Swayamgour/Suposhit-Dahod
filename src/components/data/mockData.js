// Sector-wise Anganwadi centre summary — mirrors the original dashboard table
export const sectorSummary = [
  { sector: "Abhalod", total: 32, open: 1, closed: 31, fed: 0, photoYes: 0, photoNo: 1, kidsPhoto: 0 },
  { sector: "Afva", total: 20, open: 18, closed: 2, fed: 177, photoYes: 17, photoNo: 1, kidsPhoto: 17 },
  { sector: "Agavada", total: 27, open: 7, closed: 20, fed: 108, photoYes: 6, photoNo: 1, kidsPhoto: 5 },
  { sector: "Antela", total: 18, open: 12, closed: 6, fed: 67, photoYes: 7, photoNo: 5, kidsPhoto: 7 },
  { sector: "Bajarwada", total: 19, open: 15, closed: 4, fed: 106, photoYes: 9, photoNo: 6, kidsPhoto: 8 },
  { sector: "Balaiya", total: 26, open: 22, closed: 4, fed: 168, photoYes: 15, photoNo: 7, kidsPhoto: 14 },
  { sector: "Bandibar", total: 28, open: 11, closed: 17, fed: 68, photoYes: 6, photoNo: 5, kidsPhoto: 6 },
  { sector: "Bavaka", total: 33, open: 6, closed: 27, fed: 24, photoYes: 2, photoNo: 4, kidsPhoto: 2 },
  { sector: "Bhathiwada", total: 32, open: 18, closed: 14, fed: 0, photoYes: 0, photoNo: 18, kidsPhoto: 0 },
  { sector: "Bhathvada", total: 24, open: 9, closed: 15, fed: 12, photoYes: 2, photoNo: 7, kidsPhoto: 2 },
  { sector: "Bhuval", total: 26, open: 2, closed: 24, fed: 0, photoYes: 2, photoNo: 0, kidsPhoto: 2 },
  { sector: "Bilvani", total: 32, open: 14, closed: 18, fed: 91, photoYes: 10, photoNo: 4, kidsPhoto: 9 },
];


export const breakfastMenuChart = [
  { name: "ખીચડી", value: 2 },
  { name: "શીરો", value: 3 },
  { name: "ઉપમા", value: 4 },
  { name: "મગ દાળ", value: 3 },
  { name: "પૌંઆ", value: 15 },
  { name: "ખિચડી/ખજૂર", value: 2 },
];

export const noonSnackChart = [
  { name: "રોટલી અને શાક", value: 5 },
  { name: "પુડલા, ઢોસા અથવા હાંડવો", value: 8 },
  { name: "ખાખરા, ચણા અને ફળ", value: 6 },
  { name: "ખાખરો અને ફળ", value: 8 },
  { name: "ખીચડી અને ફળ", value: 5 },
  { name: "ખાખરો, ચણા અને ફળ", value: 4 },
];

export const nutritionMenuChart = [
  { name: "શાક, દાળ અને રોટલી", value: 4 },
  { name: "ખીચડી", value: 6 },
  { name: "ખાખરો, ચણા અને ફળ", value: 5 },
  { name: "ખાખરો અને ફળ", value: 6 },
  { name: "શાક, દાળ અને ભાત", value: 7 },
  { name: "ફળ અને દૂધ", value: 4 },
];

// Info / field-definition table for Worker Details
export const workerFields = [
  { label: "તારીખ", code: "date", type: "date", required: true, unique: false, version: "v103", extra: "Default: current date" },
  { label: "ઘટકનું નામ", code: "blockDetailsId", type: "long", required: true, unique: false, version: "v6", extra: "No change after initial · Depends on blockDetailsBlockname" },
  { label: "સેજાનું નામ", code: "sectorDetailsId", type: "long", required: true, unique: false, version: "v10", extra: "No change after initial · Depends on sectorDetailsSectorname" },
  { label: "આંગણવાડી કેન્દ્રનું નામ", code: "anganwadiDetailsId", type: "long", required: true, unique: false, version: "v14", extra: "No change after initial · Depends on anganwadiDetailsAwcname" },
  { label: "રજીસ્ટર બાળકોની સંખ્યા (૩ થી ૬ વર્ષ)", code: "numberOfRegisteredChildrenAgedThreeToSix", type: "number", required: false, unique: false, version: "v8", extra: "—" },
  { label: "આંગણવાડી કેન્દ્ર ખુલ્લું છે?", code: "isAnganwadiCenterOpen", type: "list", required: false, unique: false, version: "v94", extra: "—" },
  { label: "આંગણવાડી કાર્યકરનું નામ", code: "anganwadiWorkerName", type: "text", required: false, unique: false, version: "v108", extra: "—" },
  { label: "આંગણવાડી તેડાગરનું નામ", code: "anganwadiHelperName", type: "text", required: false, unique: false, version: "v101", extra: "—" },
  { label: "આંગણવાડી કેન્દ્રનું સ્થાન", code: "locationOfWorker", type: "location", required: true, unique: false, version: "v8", extra: "—" },
  { label: "સવારનો નાસ્તો આપેલ છે?", code: "morningSnackProvided", type: "list", required: false, unique: false, version: "v99", extra: "—" },
  { label: "સવારના નાસ્તાનું મેનુ", code: "breakfastMenu", type: "list", required: false, unique: false, version: "v94", extra: "—" },
  { label: "સવારના નાસ્તાની થાળીનો ફોટો-૧", code: "morningSnackPhoto", type: "attributeslabel.file", required: false, unique: false, version: "v102", extra: "—" },
  { label: "સવારના નાસ્તા માટે હાજર બાળકોનો ફોટો", code: "photoOfChildrenPresentForTheMorningSnack", type: "attributeslabel.file", required: false, unique: false, version: "v94", extra: "—" },
];

export const kpis = (rows) => {
  const totalCentres = rows.reduce((s, r) => s + r.total, 0);
  const totalOpen = rows.reduce((s, r) => s + r.open, 0);
  const totalFed = rows.reduce((s, r) => s + r.fed, 0);
  const photoCompliance = Math.round(
    (rows.reduce((s, r) => s + r.photoYes, 0) / Math.max(totalOpen, 1)) * 100
  );
  return { totalCentres, totalOpen, totalFed, photoCompliance };
};
