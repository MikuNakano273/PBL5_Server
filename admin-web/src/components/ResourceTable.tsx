import { isValidElement, type ReactNode } from "react";
import { useI18n } from "../i18n/I18nProvider";

export type Column<T> = { label: string; render: (item: T) => unknown };
const display = (value: unknown): ReactNode => isValidElement(value) ? value : value === undefined || value === null || value === "" ? "—" : String(value);

export default function ResourceTable<T>({ items, columns, loading, error }: { items: T[]; columns: Column<T>[]; loading: boolean; error: boolean }) {
  const { t } = useI18n();
  if (loading) return <p>{t("loading")}</p>;
  if (error) return <p role="alert" className="error">{t("error")}</p>;
  if (!items.length) return <p className="empty">{t("empty")}</p>;
  return <div className="table-wrap"><table><thead><tr>{columns.map((column) => <th key={column.label}>{column.label}</th>)}</tr></thead><tbody>{items.map((item, index) => <tr key={(item as { id?: string }).id ?? index}>{columns.map((column) => <td key={column.label}>{display(column.render(item))}</td>)}</tr>)}</tbody></table></div>;
}
