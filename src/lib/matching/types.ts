export type MedicalLevel = "none" | "low" | "medium" | "high";
export type Language = "עברית" | "ערבית" | "אנגלית" | "רוסית" | "צרפתית";

export interface Child {
  id: string;
  name: string;
  age: number;
  city: string;
  language: Language;
  medicalLevel: MedicalLevel;
  notes: string;
  preferredGender?: "male" | "female" | "any";
}

export interface Volunteer {
  id: string;
  name: string;
  age: number;
  city: string;
  languages: Language[];
  medicalExperience: MedicalLevel;
  gender: "male" | "female";
  experienceYears: number;
}

export interface Priorities {
  medical: number;     // 0..100
  language: number;
  geography: number;
  age: number;
}

export interface Assignment {
  childId: string;
  volunteerId: string;
  score: number;
}