import { useI18n } from "../i18n/I18nProvider";

export default function Pagination({ page, hasNext, previous, next, refresh }: { page: number; hasNext: boolean; previous: () => void; next: () => void; refresh: () => void }) {
  const { t } = useI18n();
  return <div className="pagination"><button onClick={previous} disabled={page === 1}>{t("previous")}</button><span>{page}</span><button onClick={next} disabled={!hasNext}>{t("next")}</button><button onClick={refresh}>{t("refresh")}</button></div>;
}
