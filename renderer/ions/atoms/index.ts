import { atom } from "jotai";

export interface Project {
  id: string;
  name: string;
  files: string;
  cover: string;
  source: string;
}

export const projectsAtom = atom<Project[]>([]);
export const projectAtom = atom<Project | false>(false);
export const selectedImageAtom = atom<
  | {
      caption: string;
      image: string;
      captionFile: string;
    }
  | false
>(false);
export const imagesAtom = atom<
  {
    caption: string;
    image: string;
    captionFile: string;
  }[]
>([]);
export const directoryAtom = atom("");
export const userFlowAtom = atom("none");
