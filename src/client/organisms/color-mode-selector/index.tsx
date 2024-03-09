import Option from "@mui/joy/Option";
import Select from "@mui/joy/Select";
import { useTranslation } from "next-i18next";

import { useSsrColorScheme } from "@/ions/hooks/color-scheme";

const colorModes = ["light", "dark", "system"];

export function ColorModeSelector() {
	const { t } = useTranslation(["common"]);
	const { mode, setMode } = useSsrColorScheme();
	return (
		<Select
			data-testid="color-mode-selector"
			data-captainid="color-mode-settings"
			value={mode}
			name="mode"
			variant="soft"
			color="neutral"
			component="label"
			sx={{ width: { xs: "100%" } }}
			aria-label={t("common:pages.settings.colorMode")}
			slotProps={{
				listbox: {
					"data-testid": "color-mode-selector-listbox",
				},
				button: {
					"data-testid": "color-mode-selector-button",
					"aria-label": t(`common:colorMode.${mode}`),
					sx: {
						lineHeight: "inherit",
					},
				},
			}}
			onChange={(event, newValue) => {
				setMode(newValue ?? "system");
			}}
		>
			{colorModes.map(key => (
				<Option key={key} value={key}>
					{t(`common:colorMode.${key}`)}
				</Option>
			))}
		</Select>
	);
}
