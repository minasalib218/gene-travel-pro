export type ChecklistItem = {
  id: string;
  label: string;
  group: string;
  done: boolean;
  custom?: boolean;
};

export const starterChecklistItems: ChecklistItem[] = [
  { id: "passport", label: "Passport", group: "Travel Documents", done: false },
  { id: "visa-documents", label: "Visa / Travel Documents", group: "Travel Documents", done: false },
  { id: "travel-insurance", label: "Travel Insurance", group: "Travel Documents", done: false },
  { id: "t-shirts", label: "T-shirts", group: "Clothing", done: false },
  { id: "jacket", label: "Jacket", group: "Clothing", done: false },
  { id: "swimwear", label: "Swimwear", group: "Clothing", done: false },
  { id: "toothbrush", label: "Toothbrush", group: "Toiletries & Health", done: false },
  { id: "sunscreen", label: "Sunscreen", group: "Toiletries & Health", done: false },
  { id: "medicine", label: "Personal Medicine", group: "Toiletries & Health", done: false },
  { id: "charger", label: "Phone Charger", group: "Electronics", done: false },
  { id: "power-bank", label: "Power Bank", group: "Electronics", done: false },
  { id: "adapter", label: "Travel Adapter", group: "Electronics", done: false },
];
