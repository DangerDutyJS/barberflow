import DashboardShell from "@/components/DashboardShell";
import InstallTutorial from "@/components/InstallTutorial";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      {children}
      <InstallTutorial />
    </DashboardShell>
  );
}
