import InstallTutorial from "@/components/InstallTutorial";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <InstallTutorial />
    </>
  );
}
