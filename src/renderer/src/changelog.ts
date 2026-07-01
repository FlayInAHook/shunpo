export interface ChangelogEntry {
  version: string;
  changes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.2.0",
    changes: [
      "Added custom display names for accounts (click the edit button in the account list to set a custom display name)",
      "Added Ranked 5s (Premade 5x5) to the rank overview and sort options",
    ]
  }
];
