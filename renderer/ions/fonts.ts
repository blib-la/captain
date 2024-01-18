import {
	Inter as createBody,
	Montserrat as createDisplay,
	Fira_Code as createCode,
} from "next/font/google";

export const body = createBody({ subsets: ["latin"] });
export const display = createDisplay({ subsets: ["latin"] });
export const code = createCode({ subsets: ["latin"] });
