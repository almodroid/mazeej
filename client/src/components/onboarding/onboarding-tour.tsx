import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useAuth } from "@/hooks/use-auth";

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingTour({ isOpen, onClose }: OnboardingTourProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [run, setRun] = useState(false);
  
  // Define the tour steps - these target the CSS classes we added
  const steps: Step[] = [
    {
      target: ".dashboard-welcome",
      content: t("onboarding.welcomeStep"),
      disableBeacon: true,
      placement: "bottom",
    },
    {
      target: ".dashboard-sidebar",
      content: t("onboarding.sidebarStep"),
      placement: "right",
    },
    {
      target: ".dashboard-stats",
      content: t("onboarding.statsStep"),
      placement: "bottom",
    },
    {
      target: ".projects-tab",
      content: t("onboarding.projectsStep"),
      placement: "bottom",
    },
    {
      target: ".proposals-tab",
      content: t("onboarding.proposalsStep"),
      placement: "bottom",
    },
    {
      target: ".notifications-dropdown",
      content: t("onboarding.notificationsStep"),
      placement: "left",
    },
    {
      target: ".chat-widget-trigger",
      content: t("onboarding.chatStep"),
      placement: "top",
    },
  ];
  
  // Start the tour when isOpen changes to true
  useEffect(() => {
    if (isOpen) {
      setRun(true);
    }
  }, [isOpen]);
  
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      onClose();
    }
  };
  
  if (!user || !isOpen) return null;
  
  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: "var(--primary)",
          textColor: "var(--foreground)",
          backgroundColor: "var(--background)",
          arrowColor: "var(--background)",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          beaconSize: 36,
        },
        buttonNext: {
          backgroundColor: "var(--primary)",
        },
        buttonBack: {
          color: "var(--primary)",
          marginRight: 10,
        },
        spotlight: {
          backgroundColor: "transparent",
        },
      }}
      locale={{
        back: t("common.previous"),
        close: t("common.finish"),
        last: t("common.finishTour"),
        next: t("common.next"),
        skip: t("common.skipTour")
      }}
      stepIndex={0}
    />
  );
}