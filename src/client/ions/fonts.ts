import {
	Fira_Code as createCode,
	Inter as createBody,
	Montserrat as createDisplay,
} from "next/font/google";

export const body = createBody({ subsets: ["latin"] });
export const display = createDisplay({ subsets: ["latin"] });
export const code = createCode({ subsets: ["latin"] });
