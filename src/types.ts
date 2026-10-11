export type Locale = 'zh' | 'en' | 'ja';
export type LocalizedText = Record<Locale, string>;
export type ShrineId = `Dungeon${string}`;
export type TowerId = `Tower${string}`;
export type VerificationStatus = 'verified' | 'unverified' | 'conflict';
export interface SourceRef {
  id: string; title: string; url: string; retrievedAt: string;
  hash?: string; locator?: string;
}
export interface FieldEvidence {
  status: VerificationStatus; sourceIds: string[]; note?: string;
  displayNote?: LocalizedText;
}
export interface Region { id: string; name: LocalizedText }
export interface TowerRecord {
  id: TowerId;
  name: LocalizedText;
  position: { x: number; y: number; z: number };
  regionId: string;
  sourceId: string;
  verification: Record<'name' | 'position' | 'region', FieldEvidence>;
}
export interface ShrineRecord {
  id: ShrineId;
  sourceId: string;
  name: LocalizedText;
  trial: LocalizedText;
  regionId: string;
  dlc: boolean;
  position: { x: number; y: number; z: number };
  safe: { summary: LocalizedText; prerequisite: LocalizedText };
  detail: {
    intro: LocalizedText;
    prerequisites: LocalizedText[];
    supplies: LocalizedText[];
    walkthrough: LocalizedText[];
  };
  verification: Record<
    'name' | 'position' | 'region' | 'safe' | 'intro' |
    'prerequisites' | 'supplies' | 'walkthrough', FieldEvidence
  >;
}
export interface ShrineDataset {
  schemaVersion: 1;
  dataVersion: string;
  game: 'botw';
  generatedAt: string;
  regions: Region[];
  sources: SourceRef[];
  shrines: ShrineRecord[];
  towers: TowerRecord[];
}
