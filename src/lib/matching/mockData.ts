import type { Child, Volunteer, Language, MedicalLevel } from "./types";

const cities = ["Tel Aviv", "Jerusalem", "Haifa", "Be'er Sheva", "Netanya", "Rishon LeZion", "Petah Tikva", "Ashdod"];
const languages: Language[] = ["Hebrew", "Arabic", "English", "Russian", "French"];
const medical: MedicalLevel[] = ["none", "low", "medium", "high"];

const childNames = [
  "Noam Levi", "Adam Cohen", "Yael Mizrahi", "Itai Bar", "Maya Peretz",
  "Roni Azulay", "Tomer Friedman", "Shira Ben-David", "Eitan Gold", "Liam Sasson",
  "Talia Katz", "Daniel Ohana", "Avigail Stern", "Yonatan Rubin", "Hila Vaknin",
  "Omer Tal", "Lior Shapira", "Naomi Ziv", "Ariel Dahan", "Eden Halevi",
];

const volunteerNames = [
  "Sarah Klein", "David Mor", "Rebecca Adler", "Yossi Hadad", "Michal Eshel",
  "Avi Barak", "Tamar Lev", "Nadav Ron", "Efrat Dayan", "Gilad Amit",
  "Or Rotem", "Maya Ovadia", "Tal Shemesh", "Ronen Carmi", "Hadar Bitton",
  "Yael Segal", "Eyal Nir", "Dana Peled", "Itamar Bloch", "Noa Erez",
];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export function generateMockChildren(): Child[] {
  return childNames.map((name, i) => ({
    id: `c${i + 1}`,
    name,
    age: 6 + (i % 12),
    city: pick(cities, i * 3),
    language: pick(languages, i * 2),
    medicalLevel: pick(medical, i + 1),
    notes: i % 4 === 0 ? "Needs calm environment" : i % 3 === 0 ? "Loves music" : "Sensory friendly",
    preferredGender: i % 5 === 0 ? "female" : i % 7 === 0 ? "male" : "any",
  }));
}

export function generateMockVolunteers(): Volunteer[] {
  return volunteerNames.map((name, i) => ({
    id: `v${i + 1}`,
    name,
    age: 18 + (i % 25),
    city: pick(cities, i * 2 + 1),
    languages: i % 3 === 0
      ? [pick(languages, i), pick(languages, i + 1)]
      : [pick(languages, i)],
    medicalExperience: pick(medical, i),
    gender: i % 2 === 0 ? "female" : "male",
    experienceYears: i % 6,
  }));
}