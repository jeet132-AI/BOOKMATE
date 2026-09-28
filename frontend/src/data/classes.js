// Class / exam levels used when selling a book
// and for filtering books on the Books page.
export const CLASS_OPTIONS = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
  "NEET",
  "JEE",
  "College",
  "Other",
];

// Short labels for the small class section buttons.
export const CLASS_SHORT_LABELS = {
  "Class 1": "1",
  "Class 2": "2",
  "Class 3": "3",
  "Class 4": "4",
  "Class 5": "5",
  "Class 6": "6",
  "Class 7": "7",
  "Class 8": "8",
  "Class 9": "9",
  "Class 10": "10",
  "Class 11": "11",
  "Class 12": "12",
  NEET: "NEET",
  JEE: "JEE",
  College: "College",
  Other: "Other",
};

export function classShortLabel(className) {
  return CLASS_SHORT_LABELS[className] || className;
}
