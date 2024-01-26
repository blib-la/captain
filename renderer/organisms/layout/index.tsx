import React, { ReactNode } from "react";
import {
  Box,
  Button,
  ButtonProps,
  Dropdown,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  Sheet,
  Stack,
  Tooltip,
} from "@mui/joy";
import SettingsIcon from "@mui/icons-material/Settings";
import CollectionsIcon from "@mui/icons-material/Collections";
import RateReviewIcon from "@mui/icons-material/RateReview";
import GitHubIcon from "@mui/icons-material/GitHub";
import { useTranslation } from "next-i18next";
import Link from "next/link";
import { Except } from "type-fest";
import { APP } from "../../../main/helpers/constants";
import CloseIcon from "@mui/icons-material/Close";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import RemoveIcon from "@mui/icons-material/Remove";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import StorefrontIcon from "@mui/icons-material/Storefront";
import InventoryIcon from "@mui/icons-material/Inventory";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Logo } from "@/atoms/logo";

function SidebarButton({
  children,
  href,
  target,
  ...properties
}: Except<ButtonProps<"a">, "component">) {
  return (
    <Tooltip
      placement="right"
      title={children}
      sx={{ display: { xl: "none" } }}
    >
      <Box sx={{ width: "100%", display: "flex" }}>
        {href && !target ? (
          <Link legacyBehavior passHref href={href} target={target}>
            <Button
              {...properties}
              size="lg"
              component="a"
              sx={{
                justifyContent: "flex-start",
                pl: 1.5,
                flex: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              {children}
            </Button>
          </Link>
        ) : (
          <Button
            {...properties}
            size="lg"
            component={href ? "a" : "button"}
            href={href}
            target={target}
            sx={{
              justifyContent: "flex-start",
              pl: 1.5,
              flex: 1,
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {children}
          </Button>
        )}
      </Box>
    </Tooltip>
  );
}

const WindowControls = () => {
  const minimize = () => {
    console.log("foo");
    window.ipc.send(`${APP}:minimize`);
  };

  const maximize = () => {
    window.ipc.send(`${APP}:maximize`);
  };

  const close = () => {
    window.ipc.send(`${APP}:close`);
  };

  return (
    <Box sx={{ WebkitAppRegion: "no-drag" }}>
      <IconButton sx={{ cursor: "default" }} onClick={minimize}>
        <RemoveIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <IconButton sx={{ cursor: "default" }} onClick={maximize}>
        <CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <IconButton
        color="danger"
        variant="solid"
        sx={{
          cursor: "default",
          bgcolor: "transparent",
          color: "text.primary",
          "&:hover": {
            color: "common.white",
          },
        }}
        onClick={close}
      >
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
};
export function Layout({ children }: { children?: ReactNode }) {
  const { t } = useTranslation(["common"]);

  return (
    <Box
      sx={{
        height: "100dvh",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: {
          xs: "36px 1fr",
          xl: "228px 1fr",
        },
        gridTemplateRows: "36px 1fr",
      }}
    >
      <Sheet
        sx={{
          display: "flex",
          gridColumnStart: 1,
          gridColumnEnd: 3,
          WebkitAppRegion: "drag",
        }}
      >
        <Box
          sx={{
            WebkitAppRegion: "no-drag",
            display: "flex",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              p: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Logo sx={{ height: 20, width: 20 }} />
          </Box>
          <Dropdown>
            <MenuButton
              slots={{ root: IconButton }}
              slotProps={{ root: { variant: "plain", color: "neutral" } }}
            >
              <MoreVertIcon />
            </MenuButton>
            <Menu placement="bottom-start" size="sm">
              <MenuItem sx={{ winWidth: 200 }}>About</MenuItem>
              <MenuItem>Help</MenuItem>
            </Menu>
          </Dropdown>
        </Box>
        <Box sx={{ flex: 1 }} />
        <WindowControls />
      </Sheet>
      <Stack sx={{ overflow: "hidden" }}>
        <SidebarButton href="/home" startDecorator={<CollectionsIcon />}>
          {t("common:datasets")}
        </SidebarButton>
        <SidebarButton
          disabled
          href="/marketplace"
          startDecorator={<StorefrontIcon />}
        >
          {t("common:marketplace")}
        </SidebarButton>
        <SidebarButton
          disabled
          href="/inventory"
          startDecorator={<InventoryIcon />}
        >
          {t("common:inventory")}
        </SidebarButton>
        <SidebarButton
          disabled
          href="/training"
          startDecorator={<FitnessCenterIcon />}
        >
          {t("common:training")}
        </SidebarButton>
        <Box sx={{ flex: 1 }} />
        <SidebarButton
          href="https://github.com/blib-la/captain"
          target="_blank"
          startDecorator={<GitHubIcon />}
        >
          {t("common:github")}
        </SidebarButton>
        <SidebarButton href="/feedback" startDecorator={<RateReviewIcon />}>
          {t("common:feedback")}
        </SidebarButton>
        <SidebarButton href="/settings" startDecorator={<SettingsIcon />}>
          {t("common:settings")}
        </SidebarButton>
      </Stack>
      <Sheet variant="plain" sx={{ position: "relative", overflow: "hidden" }}>
        {children}
      </Sheet>
    </Box>
  );
}
