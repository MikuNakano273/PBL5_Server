export default function StatusBadge({ value }: { value?: string }) {
  if (!value) return <>—</>;
  return <span className={`status-badge status-${value.toLowerCase()}`}>{value}</span>;
}
