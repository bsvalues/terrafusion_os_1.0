export const metadata = { title: "TerraFusion Command Portal" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <nav style={{ padding: 12, borderBottom: "1px solid #eee", display:"flex", gap:12 }}>
          <a href="/dashboard">Dashboard</a>
          <a href="/workspaces">Workspaces</a>
          <a href="/copilot">Co‑Pilot</a>
          <a href="/approvals">Approvals</a>
          <a href="/onboarding">Onboarding</a>
        </nav>
        <main style={{ padding: 16 }}>{children}</main>
      </body>
    </html>
  );
}
