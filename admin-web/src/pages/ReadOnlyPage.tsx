import { useCallback } from "react";
import type { Document } from "../api/types";
import Pagination from "../components/Pagination";
import ResourceTable from "../components/ResourceTable";
import { usePagedResource } from "../hooks/usePagedResource";

export default function ReadOnlyPage({ title, loader, fields }: { title: string; loader: (page: number, limit: number) => Promise<Document[]>; fields: string[] }) {
  const resource = usePagedResource<Document>(useCallback(loader, [loader]));
  return <><h1>{title}</h1><ResourceTable<Document> items={resource.items} loading={resource.loading} error={resource.error} columns={fields.map((field) => ({ label: field, render: (item: Document) => item[field] }))} /><Pagination {...resource} /></>;
}
