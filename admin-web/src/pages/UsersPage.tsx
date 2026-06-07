import { useCallback, useState, type FormEvent } from "react";
import { getUser, listUsers, updateUser } from "../api/admin";
import type { User } from "../api/types";
import Dialog from "../components/Dialog";
import Pagination from "../components/Pagination";
import ResourceTable from "../components/ResourceTable";
import StatusBadge from "../components/StatusBadge";
import { usePagedResource } from "../hooks/usePagedResource";
import { useI18n } from "../i18n/I18nProvider";

export default function UsersPage() {
  const { t } = useI18n();
  const loader = useCallback(listUsers, []);
  const resource = usePagedResource(loader);
  const [selected, setSelected] = useState<User | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [mutationError, setMutationError] = useState(false);
  const open = async (user: User) => setSelected(await getUser(user.id));
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setMutationError(false);
    try {
      const updated = await updateUser(selected!.id, { full_name: String(data.get("full_name")), phone: String(data.get("phone")), status: String(data.get("status")) });
      resource.setItems((items) => items.map((item) => item.id === updated.id ? updated : item));
      setFeedback(t("success"));
      setSelected(null);
    } catch {
      setMutationError(true);
    } finally { setPending(false); }
  }
  return <><h1>{t("users")}</h1>{feedback && <p className="success">{feedback}</p>}<ResourceTable items={resource.items} loading={resource.loading} error={resource.error} columns={[
    { label: "Email", render: (item) => item.email }, { label: t("fullName"), render: (item) => item.full_name },
    { label: t("phone"), render: (item) => item.phone }, { label: t("status"), render: (item) => <StatusBadge value={item.status} /> },
    { label: "", render: (item) => <button onClick={() => void open(item)}>{t("edit")}</button> },
  ]} /><Pagination {...resource} />
  {selected && <Dialog title={t("edit")} close={() => setSelected(null)}><form className="dialog-form" onSubmit={save}>
    {mutationError && <p role="alert" className="error">{t("error")}</p>}
    <label>{t("fullName")}<input name="full_name" defaultValue={selected.full_name ?? ""} required /></label>
    <label>{t("phone")}<input name="phone" defaultValue={selected.phone ?? ""} required /></label>
    <label>{t("status")}<input name="status" defaultValue={selected.status ?? ""} required /></label>
    <div className="dialog-actions"><button type="button" onClick={() => setSelected(null)}>{t("cancel")}</button><button disabled={pending}>{t("save")}</button></div>
  </form></Dialog>}</>;
}
