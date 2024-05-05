export function tw([style]: TemplateStringsArray) {
	return style.replaceAll(/\s+/g, " ").trim();
}
