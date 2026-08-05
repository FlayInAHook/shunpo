export interface ChangelogEntry {
  version: string;
  changes: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    version: "1.3.0",
    changes: [
      "Fixed the champion count counting the classic champion variants League grants everyone, which inflated the number on every account",
      "Added a debug logging switch at the bottom of the window (off by default) that writes app logs to %USERPROFILE%\\.shunpo\\shunpo.log, for when something needs troubleshooting",
    ]
  },
  {
    version: "1.2.0",
    changes: [
      "Added custom display names for accounts (click the edit button in the account list to set a custom display name)",
      "Added Ranked 5s (Premade 5x5) to the rank overview and sort options",
    ]
  }
];
