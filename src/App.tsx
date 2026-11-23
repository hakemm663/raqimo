/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { ReportsTab } from "./components/tabs/ReportsTab";
import { ExistingSectionViews } from "./components/tabs/ExistingSectionViews";
import { CRMOverview } from "./components/crm/CRMOverview";
import { LeadsPage } from "./components/crm/LeadsPage";
import { ContactsPage } from "./components/crm/ContactsPage";
import { CompaniesPage } from "./components/crm/CompaniesPage";
import { DealsPage } from "./components/crm/DealsPage";
import { ActivitiesPage } from "./components/crm/ActivitiesPage";
import { FollowUpsPage } from "./components/crm/FollowUpsPage";
import { TasksOverview } from "./components/tasks/TasksOverview";
import { MyTasksPage } from "./components/tasks/MyTasksPage";
import { ProjectsPage } from "./components/tasks/ProjectsPage";
import { BoardsPage } from "./components/tasks/BoardsPage";
import { CalendarPage } from "./components/tasks/CalendarPage";
import { TimelinePage } from "./components/tasks/TimelinePage";
import { WorkloadPage } from "./components/tasks/WorkloadPage";
import { GlobalCommandPalette } from "./components/shared/GlobalCommandPalette";
import { GlobalQuickCreate } from "./components/shared/GlobalQuickCreate";
import { ToastHost } from "./components/shared/ToastHost";
import { WorkspaceProvider, useWorkspace } from "./context/WorkspaceContext";
import { authenticateTestUser } from "./lib/api";
import { NavSectionId } from "./types/shared";

interface ShellProps {
  isDark: boolean;
  onToggleTheme: () => void;
  language: "en" | "ar";
  onToggleLanguage: () => void;
  activeSection: NavSectionId;
  setActiveSection: (s: NavSectionId) => void;
}

const AppShell: React.FC<ShellProps> = ({
  isDark,
  onToggleTheme,
  language,
  onToggleLanguage,
  activeSection,
  setActiveSection,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { setCommandPaletteOpen, openQuickCreate, data } = useWorkspace();

  const renderSection = () => {
    switch (activeSection) {
      case "reports":
        return <ReportsTab isDark={isDark} language={language} />;
      case "crm-overview":
        return <CRMOverview />;
      case "crm-leads":
        return <LeadsPage />;
      case "crm-contacts":
        return <ContactsPage />;
      case "crm-companies":
        return <CompaniesPage />;
      case "crm-deals":
        return <DealsPage />;
      case "crm-activities":
        return <ActivitiesPage />;
      case "crm-followups":
        return <FollowUpsPage />;
      case "tasks-overview":
        return <TasksOverview />;
      case "tasks-my":
        return <MyTasksPage />;
      case "tasks-work":
        return <MyTasksPage myWorkOnly />;
      case "tasks-projects":
        return <ProjectsPage />;
      case "tasks-boards":
        return <BoardsPage />;
      case "tasks-calendar":
        return <CalendarPage />;
      case "tasks-timeline":
        return <TimelinePage />;
      case "tasks-workload":
        return <WorkloadPage />;
      default:
        return <ExistingSectionViews section={activeSection} />;
    }
  };

  return (
    <div
      className={`min-h-screen flex ${
        isDark ? "bg-[#050505] text-[#F0F0F0]" : "bg-[#F4F6F8] text-[#0B1220]"
      } transition-colors duration-200`}
    >
      <Sidebar
        language={language}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeSection={activeSection}
        invoiceCount={data.invoices.length}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          setMobileMenuOpen(false);
        }}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          isDark={isDark}
          onToggleTheme={onToggleTheme}
          language={language}
          onToggleLanguage={onToggleLanguage}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          netCashAmount={11600}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenQuickCreate={() => openQuickCreate({ mode: "task" })}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderSection()}
        </main>
      </div>

      <GlobalCommandPalette />
      <GlobalQuickCreate />
      <ToastHost />
    </div>
  );
};

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem("raqimo_theme") !== "light";
    } catch {
      return true;
    }
  });

  const [language, setLanguage] = useState<"en" | "ar">(() => {
    try {
      return (localStorage.getItem("raqimo_lang") as "en" | "ar") || "en";
    } catch {
      return "en";
    }
  });

  const [activeSection, setActiveSection] = useState<NavSectionId>("reports");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    try {
      localStorage.setItem("raqimo_theme", isDark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [isDark]);

  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
    try {
      localStorage.setItem("raqimo_lang", language);
    } catch {
      // ignore
    }
  }, [language]);

  // Attempt real live authentication on mount
  useEffect(() => {
    authenticateTestUser().catch((err) => {
      console.warn("[App] Initial auth attempt", err);
    });
  }, []);

  return (
    <WorkspaceProvider
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      language={language}
      isDark={isDark}
    >
      <AppShell
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === "en" ? "ar" : "en"))}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
    </WorkspaceProvider>
  );
}
