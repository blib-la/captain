import IconButton from "@mui/joy/IconButton";
import ToggleButtonGroup from "@mui/joy/ToggleButtonGroup";
import { useTranslation } from "next-i18next";

import { useSsrColorScheme } from "@/ions/hooks/color-scheme";
import { icons } from "@/organisms/color-mode-selector/icons";

export function ColorModeSelector() {
  const { t } = useTranslation(["button"]);
  const { mode, setMode } = useSsrColorScheme();
  return (
    <ToggleButtonGroup
      value={mode}
      variant="soft"
      color="primary"
      size="sm"
      sx={{ flex: { xs: 1, md: "initial" } }}
      onChange={(event, newValue) => {
        setMode(newValue ?? "system");
      }}
    >
      {Object.entries(icons).map(([key, icon]) => (
        <IconButton
          key={key}
          value={key}
          data-testid={`color-mode-${key}`}
          aria-label={t(`button:colorMode.${key}`)}
          sx={{ flex: 1 }}
        >
          {icon}
        </IconButton>
      ))}
    </ToggleButtonGroup>
  );
}
