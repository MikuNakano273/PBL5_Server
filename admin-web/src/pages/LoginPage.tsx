import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { login } from "../api/admin";
import { getToken, setToken } from "../auth/session";
import { useI18n } from "../i18n/I18nProvider";

export default function LoginPage() {
  const { language, setLanguage, t } = useI18n();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  if (getToken()) return <Navigate to="/" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const response = await login(String(data.get("email")), String(data.get("password")));
      setToken(response.access_token);
      navigate("/");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t("error"));
    } finally {
      setPending(false);
    }
  }

  return <main className="login-page">
    <form className="login-card" onSubmit={submit}>
      <div className="language-actions">
        <button type="button" onClick={() => setLanguage(language === "vi" ? "en" : "vi")}>{language === "vi" ? "EN" : "VI"}</button>
      </div>
      <h1>{t("loginTitle")}</h1>
      {error && <p role="alert" className="error">{error}</p>}
      <label>Email<input name="email" type="email" required /></label>
      <label>{t("password")}<input name="password" type="password" minLength={8} required /></label>
      <button disabled={pending}>{t("login")}</button>
    </form>
  </main>;
}
