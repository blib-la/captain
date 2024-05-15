import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

import { APP_ID } from "@/client/apps/text-to-image/constants";

export const imageAtom = atom("");
export const selectedLoraAtom = atomWithStorage(`${APP_ID}_selectedLora`, "none");
