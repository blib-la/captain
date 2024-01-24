import { Box, IconButton, Sheet, Stack } from "@mui/joy";
import React, { ComponentType } from "react";
import { useAtom } from "jotai";
import { userFlowAtom } from "@/ions/atoms";
import { useLocalSteps } from "@/ions/hooks";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
export function UserFlow({
  steps,
  id,
}: {
  steps: ComponentType<{
    onDone(): void;
  }>[];
  id: string;
}) {
  const { step, increment, decrement, set } = useLocalSteps();
  const [userFlow, setUserFlow] = useAtom(userFlowAtom);

  const ActiveStep = steps[step];
  return (
    (userFlow === id || userFlow === "none") && (
      <>
        {step > 0 && step < steps.length - 1 && (
          <IconButton
            sx={{ position: "absolute", top: 0, left: 0 }}
            onClick={() => {
              if (step === 1) {
                setUserFlow("none");
              }
              decrement();
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <Stack
          sx={{
            flex: step > 0 ? 1 : undefined,
            width: step > 0 ? "100%" : undefined,
            minWidth: 300,
          }}
        >
          <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
            {
              <ActiveStep
                onDone={() => {
                  if (step < steps.length - 1) {
                    increment();
                  } else {
                    set(0);
                    setUserFlow("none");
                  }
                  if (step === 0) {
                    setUserFlow(id);
                  }
                }}
              />
            }
          </Box>
        </Stack>
      </>
    )
  );
}
