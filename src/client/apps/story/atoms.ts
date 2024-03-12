import { atom } from "jotai/index";

export const storyImagesAtom = atom<{ filePath: string; id: string }[]>([]);
export const selectedStoryImagesAtom = atom<{ filePath: string; id: string }[]>([]);
