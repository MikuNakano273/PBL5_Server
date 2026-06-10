import { useCallback, useState, type FormEvent } from "react";
import { assignDevice, listDevices, listUsers } from "../api/admin";
import type { Device } from "../api/types";
import Dialog from "../components/Dialog";
import Pagination from "../components/Pagination";
import ResourceTable from "../components/ResourceTable";
import StatusBadge from "../components/StatusBadge";
import { usePagedResource } from "../hooks/usePagedResource";
import { useI18n } from "../i18n/I18nProvider";

export default function DevicesPage() {
  const { t } = useI18n();
  const devices = usePagedResource(useCallback(listDevices, []));
  const users = usePagedResource(useCallback(listUsers, []));
  const [selected, setSelected] = useState<Device | null>(null);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [mutationError, setMutationError] = useState(false);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMutationError(false);
    try {
      const updated = await assignDevice(selected!.id, String(new FormData(event.currentTarget).get("user_id")));
      devices.setItems((items) => items.map((item) => item.id === updated.id ? updated : item));
      setFeedback(t("success"));
      setSelected(null);
    } catch {
      setMutationError(true);
    } finally { setPending(false); }
  }
  return <><h1>{t("devices")}</h1>{feedback && <p className="success">{feedback}</p>}<ResourceTable items={devices.items} loading={devices.loading} error={devices.error} columns={[
    { label: "ID", render: (item) => item.id }, { label: "Code", render: (item) => item.device_code },
    { label: t("user"), render: (item) => item.user_id }, { label: t("status"), render: (item) => <StatusBadge value={item.status} /> },
    { label: "", render: (item) => <button onClick={() => setSelected(item)}>{t("assign")}</button> },
  ]} /><Pagination {...devices} />
  {selected && <Dialog title={t("assign")} close={() => setSelected(null)}><form className="dialog-form" onSubmit={save}>
    {mutationError && <p role="alert" className="error">{t("error")}</p>}
    <label>{t("user")}<select name="user_id" required defaultValue=""><option value="" disabled>—</option>{users.items.map((user) => <option key={user.id} value={user.id}>{user.full_name ?? user.email ?? user.id}</option>)}</select></label>
    <div className="dialog-actions"><button type="button" onClick={() => setSelected(null)}>{t("cancel")}</button><button disabled={pending}>{t("save")}</button></div>
  </form></Dialog>}</>;
}
