
export interface Destination {
  id: string;
  name: string;
  interestedPeople: string[];
  createdAt: number;
  preferredMonths: string[]; // e.g. ["Mar", "Apr", "Aug"]
  year: number;
}

export interface DayAvailability {
  id: string; // YYYY-MM-DD
  users: string[];
}

export interface AppState {
  userName: string | null;
  destinations: Destination[];
  availability: Record<string, string[]>;
}
