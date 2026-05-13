import { V2Nav } from "@/components/v2/layout/v2-nav";

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <V2Nav />
      {/* pb-16 reserves space for the fixed mobile bottom bar; lg:pb-0 removes it on desktop */}
      <main className="flex-1 pb-16 lg:pb-0">{children}</main>
    </div>
  );
}
