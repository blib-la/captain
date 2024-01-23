import {
  Box,
  IconButton,
  Sheet,
  Stack,
  Step,
  StepIndicator,
  Stepper,
} from "@mui/joy";
import React, { ComponentType } from "react";
import { useAtom } from "jotai";
import { userFlowAtom } from "@/ions/atoms";
import { useLocalSteps } from "@/ions/hooks";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";

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
      <Stack
        sx={{
          flex: step > 0 ? 1 : undefined,
          width: step > 0 ? "100%" : undefined,
          minWidth: 300,
          overflow: "hidden",
        }}
      >
        {step > 0 && step < steps.length - 1 && (
          <Sheet
            color="secondary"
            sx={{ p: 1, display: "flex", gap: 1, overflow: "hidden" }}
          >
            <IconButton
              sx={{ visibility: step > 0 ? "visible" : "hidden" }}
              onClick={() => {
                if (step === 1) {
                  setUserFlow("none");
                }
                decrement();
              }}
            >
              <ArrowBackIcon />
            </IconButton>

            <Stepper
              size="sm"
              sx={{ flex: 1, display: "flex", justifyContent: "center", pr: 4 }}
            >
              {steps.slice(0, steps.length - 1).map((_, index) => (
                <Step
                  key={index}
                  indicator={
                    <StepIndicator
                      variant="solid"
                      color={step === index ? "primary" : "neutral"}
                    >
                      {step > index ? <CheckIcon /> : index + 1}
                    </StepIndicator>
                  }
                >
                  Step {index + 1}
                </Step>
              ))}
            </Stepper>
          </Sheet>
        )}
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
    )
  );
}
