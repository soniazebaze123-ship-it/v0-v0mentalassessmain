export type OdorId =
  | "rose"
  | "lemon"
  | "coffee"
  | "mint"
  | "orange"
  | "soap"
  | "vanilla"
  | "garlic"
  | "chocolate"
  | "pineapple"
  | "cinnamon"
  | "grass"

export interface OdofinStrip {
  number: number
  answer: OdorId
  options: OdorId[]
}

export const ODOFIN_RISK_CUTOFF = 8
export const ODOFIN_SECONDS_PER_STRIP = 45

export const ODOFIN_STRIPS: OdofinStrip[] = [
  { number: 1, answer: "rose", options: ["rose", "lemon", "soap", "mint"] },
  { number: 2, answer: "lemon", options: ["lemon", "orange", "pineapple", "vanilla"] },
  { number: 3, answer: "coffee", options: ["coffee", "chocolate", "cinnamon", "garlic"] },
  { number: 4, answer: "mint", options: ["mint", "grass", "soap", "rose"] },
  { number: 5, answer: "orange", options: ["orange", "lemon", "pineapple", "vanilla"] },
  { number: 6, answer: "soap", options: ["soap", "rose", "mint", "vanilla"] },
  { number: 7, answer: "vanilla", options: ["vanilla", "cinnamon", "chocolate", "coffee"] },
  { number: 8, answer: "garlic", options: ["garlic", "grass", "mint", "soap"] },
  { number: 9, answer: "chocolate", options: ["chocolate", "coffee", "vanilla", "cinnamon"] },
  { number: 10, answer: "pineapple", options: ["pineapple", "orange", "lemon", "rose"] },
  { number: 11, answer: "cinnamon", options: ["cinnamon", "coffee", "chocolate", "vanilla"] },
  { number: 12, answer: "grass", options: ["grass", "mint", "rose", "garlic"] },
]
