import PageShell from "../_components/PageShell";

export default function VillkorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageShell>{children}</PageShell>;
}
