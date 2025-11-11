import Dexie, { Table } from 'dexie';

/**
 * IndexedDB Database לשמירה מקומית של יצירות
 * מאפשר שמירת סיפורים, חוברות ותמונות ללא תלות ב-Supabase
 */

export interface SavedStory {
  id: string;
  title: string;
  content: any;
  coverImage?: string;
  createdAt: number;
  updatedAt: number;
  childProfileId: string;
  childName: string;
  tags?: string[];
}

export interface SavedWorkbook {
  id: string;
  title: string;
  content: any;
  createdAt: number;
  updatedAt: number;
  childProfileId: string;
  childName: string;
  subject?: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  age?: number;
  avatar?: string; // Base64 או URL
  interests?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface ProfileImage {
  id: string;
  childProfileId: string;
  imageData: string; // Base64
  imageType: string; // image/jpeg, image/png
  createdAt: number;
}

class LocalStorageDatabase extends Dexie {
  stories!: Table<SavedStory, string>;
  workbooks!: Table<SavedWorkbook, string>;
  profiles!: Table<ChildProfile, string>;
  images!: Table<ProfileImage, string>;

  constructor() {
    super('ChildApp2LocalDB');

    this.version(1).stores({
      stories: 'id, childProfileId, createdAt, updatedAt',
      workbooks: 'id, childProfileId, createdAt, updatedAt',
      profiles: 'id, createdAt',
      images: 'id, childProfileId, createdAt',
    });
  }
}

export const localDB = new LocalStorageDatabase();

// Helper functions

export async function saveStoryLocally(story: Omit<SavedStory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  await localDB.stories.add({
    id,
    ...story,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function getStoriesByChild(childProfileId: string): Promise<SavedStory[]> {
  return await localDB.stories
    .where('childProfileId')
    .equals(childProfileId)
    .reverse()
    .sortBy('createdAt');
}

export async function saveWorkbookLocally(workbook: Omit<SavedWorkbook, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const id = `workbook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = Date.now();

  await localDB.workbooks.add({
    id,
    ...workbook,
    createdAt: now,
    updatedAt: now,
  });

  return id;
}

export async function getWorkbooksByChild(childProfileId: string): Promise<SavedWorkbook[]> {
  return await localDB.workbooks
    .where('childProfileId')
    .equals(childProfileId)
    .reverse()
    .sortBy('createdAt');
}

export async function saveProfileImage(childProfileId: string, imageData: string, imageType: string): Promise<string> {
  // מחק תמונות קודמות של אותו ילד
  await localDB.images
    .where('childProfileId')
    .equals(childProfileId)
    .delete();

  const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await localDB.images.add({
    id,
    childProfileId,
    imageData,
    imageType,
    createdAt: Date.now(),
  });

  return id;
}

export async function getProfileImage(childProfileId: string): Promise<ProfileImage | undefined> {
  return await localDB.images
    .where('childProfileId')
    .equals(childProfileId)
    .first();
}

export async function deleteStory(id: string): Promise<void> {
  await localDB.stories.delete(id);
}

export async function deleteWorkbook(id: string): Promise<void> {
  await localDB.workbooks.delete(id);
}

export async function getAllStories(): Promise<SavedStory[]> {
  return await localDB.stories.reverse().sortBy('createdAt');
}

export async function getAllWorkbooks(): Promise<SavedWorkbook[]> {
  return await localDB.workbooks.reverse().sortBy('createdAt');
}

// ניקוי כל הנתונים (שימושי לבדיקות)
export async function clearAllLocalData(): Promise<void> {
  await localDB.stories.clear();
  await localDB.workbooks.clear();
  await localDB.images.clear();
}

// קבלת סטטיסטיקות
export async function getLocalStats() {
  const [storiesCount, workbooksCount, imagesCount] = await Promise.all([
    localDB.stories.count(),
    localDB.workbooks.count(),
    localDB.images.count(),
  ]);

  return {
    stories: storiesCount,
    workbooks: workbooksCount,
    images: imagesCount,
    totalSize: await estimateStorageSize(),
  };
}

async function estimateStorageSize(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}
