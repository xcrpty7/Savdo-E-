import { useState } from "react";
import { Link } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useI18n } from "../../i18n/index.jsx";
import { forgotPassword } from "../../api/auth.api";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

export function ForgotPasswordPage() {
  const { t } = useI18n();
  usePageTitle(t("auth.forgotPasswordTitle"));

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError(t("auth.emailRequired"));
      return;
    }
    setError("");
    setLoading(true);
    try {
      await forgotPassword({ email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || t("auth.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <section className="auth-shell">
        <div className="auth-card auth-card-single">
          <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
            <CheckCircle size={48} color="#22c55e" style={{ margin: "0 auto 16px" }} />
            <h1 style={{ marginBottom: 8 }}>{t("auth.checkYourEmail")}</h1>
            <p className="muted-text" style={{ marginBottom: 24 }}>
              {t("auth.resetLinkSent")} <strong>{email}</strong>
            </p>
            <p className="muted-text" style={{ fontSize: 13 }}>
              {t("auth.resetLinkExpiry")}
            </p>
          </div>
          <Link className="text-link" to="/login">
            <ArrowLeft size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
            {t("common.backToLogin")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-shell">
      <div className="auth-card auth-card-single">
        <p className="eyebrow">{t("auth.forgotPasswordEyebrow")}</p>
        <h1>{t("auth.forgotPasswordTitle")}</h1>
        <p className="muted-text">{t("auth.forgotPasswordDescription")}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            {t("auth.workEmail")}
            <div style={{ position: "relative" }}>
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#9ca3af",
                  pointerEvents: "none",
                }}
              />
              <input
                type="email"
                placeholder="email@savdo.uz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: 36 }}
                autoFocus
                disabled={loading}
              />
            </div>
          </label>

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, margin: "-4px 0 0" }}>{error}</p>
          )}

          <button type="submit" disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                {t("auth.sending")}
              </>
            ) : (
              t("auth.sendResetLink")
            )}
          </button>
        </form>

        <Link className="text-link" to="/login">
          <ArrowLeft size={14} style={{ marginRight: 4, verticalAlign: "middle" }} />
          {t("common.backToLogin")}
        </Link>
      </div>
    </section>
  );
}
