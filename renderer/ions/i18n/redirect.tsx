import { useEffect } from "react";
import { useRouter } from "next/router";
import languageDetector from "./languageDetector";

export function useRedirect(to?: string) {
  const router = useRouter();
  const to_ = to || router.asPath;

  // language detection
  useEffect(() => {
    async function detectLanguage() {
      const detectedLocale = languageDetector.detect();
      const storedLocale = await window.ipc.getLocale();
      const appLocale = storedLocale || detectedLocale;
      if (to_.startsWith("/" + appLocale) && router.route === "/404") {
        // prevent endless loop
        await router.replace("/" + appLocale + router.route);
        return;
      }

      languageDetector.cache(appLocale);
      await router.replace("/" + appLocale + to_);
    }
    void detectLanguage();
  }, [to_]);
}

export function Redirect({ to }: { to?: string }) {
  useRedirect(to);
  return null;
}
