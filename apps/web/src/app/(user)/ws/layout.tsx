export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ fontFamily: "var(--font-jakarta-sans), sans-serif" }}>
      {children}
    </div>
  );
}
