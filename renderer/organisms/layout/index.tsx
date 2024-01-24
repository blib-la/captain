import React, { ReactNode, useState } from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  FormLabel,
  IconButton,
  Link,
  Sheet,
  Table,
  Textarea,
  Typography,
} from "@mui/joy";
import { ColorModeSelector } from "@/organisms/color-mode-selector";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";
import FeedbackIcon from "@mui/icons-material/Feedback";
import GitHubIcon from "@mui/icons-material/GitHub";
import { useForm } from "react-hook-form";
import KeyboardCommandKeyIcon from "@mui/icons-material/KeyboardCommandKey";
function FeedbackForm({ onSubmit }: { onSubmit(): void }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: { body: "" },
  });

  return (
    <Box
      component="form"
      sx={{ width: "100%" }}
      onSubmit={handleSubmit(async (data) => {
        await window.ipc.sendFeedback(data);
        onSubmit();
      })}
    >
      <FormControl sx={{ width: "100%" }}>
        <FormLabel>Give Feedback</FormLabel>
        <Textarea
          name="body"
          minRows={6}
          error={Boolean(errors?.body)}
          sx={{ width: "100%" }}
          {...register("body", { required: true })}
        />
      </FormControl>
      <Box sx={{ pt: 2 }}>
        <Button type="submit">Send</Button>
      </Box>
    </Box>
  );
}

function Kbd({ children }: { children?: ReactNode }) {
  return (
    <Chip variant="outlined" component="kbd" sx={{ borderRadius: 1 }}>
      {children}
    </Chip>
  );
}
export function Layout({ children }: { children?: ReactNode }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [keyboardControlOpen, setKeyboardControlOpen] = useState(false);
  return (
    <Box sx={{ height: "100dvh", overflow: "hidden", display: "flex" }}>
      <Box sx={{ flex: 1 }}>{children}</Box>
      <Sheet
        color={settingsOpen ? "primary" : undefined}
        variant={settingsOpen ? "solid" : undefined}
        sx={{
          zIndex: 2,
          height: 32,
          display: "flex",
          flexDirection: "column",
          flexWrap: "wrap",
          alignItems: "flex-start",
          position: "absolute",
          width: settingsOpen ? "100%" : "min-content",
          bottom: 0,
          right: 0,
          bgcolor: settingsOpen ? undefined : "transparent",
        }}
      >
        {settingsOpen && (
          <Box sx={{ px: 2 }}>
            <ColorModeSelector />
          </Box>
        )}
        <IconButton
          size="sm"
          color={settingsOpen ? "primary" : undefined}
          variant={settingsOpen ? "plain" : undefined}
          sx={{ alignSelf: "flex-end" }}
          aria-label={`${settingsOpen ? "close" : "open"} settings`}
          onClick={() => {
            setSettingsOpen(!settingsOpen);
          }}
        >
          {settingsOpen ? <CloseIcon /> : <SettingsIcon />}
        </IconButton>
      </Sheet>
      <Sheet
        color="neutral"
        variant="soft"
        sx={{
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          position: "absolute",
          width: feedbackOpen ? 400 : "min-content",
          height: "min-content",
          top: 0,
          right: 0,
          pt: 4,
          pr: 4,
        }}
      >
        {feedbackOpen && (
          <Box sx={{ pl: 2, pb: 2, width: "100%" }}>
            <FeedbackForm
              onSubmit={() => {
                setFeedbackOpen(false);
              }}
            />
          </Box>
        )}
        <IconButton
          size="sm"
          color="neutral"
          variant="soft"
          aria-label={`${feedbackOpen ? "close" : "open"} feedback`}
          sx={{ position: "absolute", top: 0, right: 0 }}
          onClick={() => {
            setFeedbackOpen(!feedbackOpen);
          }}
        >
          {feedbackOpen ? <CloseIcon /> : <FeedbackIcon />}
        </IconButton>
      </Sheet>
      <Sheet
        color="neutral"
        variant="soft"
        sx={{
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          position: "absolute",
          width: keyboardControlOpen ? 400 : "min-content",
          height: "min-content",
          top: 0,
          left: 0,
          pt: 4,
          pl: 4,
        }}
      >
        {keyboardControlOpen && (
          <Box sx={{ pr: 2, pb: 2, width: "100%" }}>
            <Typography level={"title-lg"}>Editor:</Typography>
            <Table>
              <tbody>
                <tr>
                  <td>Previous Image:</td>
                  <td>
                    <Kbd>Alt</Kbd> + <Kbd>←</Kbd>
                  </td>
                </tr>
                <tr>
                  <td>Next Image:</td>
                  <td>
                    <Kbd>Alt</Kbd> + <Kbd>→</Kbd>
                  </td>
                </tr>
              </tbody>
            </Table>
          </Box>
        )}
        <IconButton
          size="sm"
          color="neutral"
          variant="soft"
          aria-label={`${keyboardControlOpen ? "close" : "open"} hotkeys`}
          sx={{ position: "absolute", top: 0, left: 0 }}
          onClick={() => {
            setKeyboardControlOpen(!keyboardControlOpen);
          }}
        >
          {keyboardControlOpen ? <CloseIcon /> : <KeyboardCommandKeyIcon />}
        </IconButton>
      </Sheet>
      <IconButton
        component="a"
        target={"_blank"}
        href={"https://github.com/blib-la/captain"}
        aria-label={"github repository"}
        size="sm"
        sx={{ position: "absolute", top: 32, right: 0 }}
      >
        <GitHubIcon />
      </IconButton>
      <Box sx={{ position: "absolute", left: 0, bottom: 0, py: 0.5, px: 1 }}>
        Brought to you by{" "}
        <Link href="https://blib.la" target={"_blank"}>
          Blibla
        </Link>
      </Box>
    </Box>
  );
}
