import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useI18n } from "../../i18n/index.jsx";
import { resetPassword } from "../../api/auth.api";
import { Eye, EyeOff, Lock, CheckCircle, Loader2, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export function ResetPasswordPage() {
  const { t } = useI18n();
  usePageTitle(t("auth.resetPasswordTitle"));

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Token yo'q bo'lsa — xato ko'rsat
  if (!token) {
    return (
      <section className="auth-shell">
        <div className="auth-card auth-card-single" style={{ textAlign: "center" }}>
          <AlertTriangle size={48} color="#f59e0b" style={{ margin: "0 auto 16px" }} />
          <h1 style={{ marginBottom: 8 }}>{t("auth.invalidResetLink")}</h1>
          <p className="muted-text" style={{ marginBottom: 24 }}>
            {t("auth.invalidResetLinkDesc")}
          </p>
          <Link className="text-link" to="/forgot-password">
            {t("auth.requestNewLink")}
          </Link>
        </div>
      </section>
    );
  }

  const validate = () => {
    if (password.length < 8) return t("auth.passwordMin");
    if (!/[A-Z]/.test(password)) return t("auth.passwordUppercase");
    if (!/[a-z]/.test(password)) return t("auth.passwordLowercase");
    if (!/\d/.test(password)) return t("auth.passwordNumber");
    if (password !== confirm) return t("auth.passwordMismatch");
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword({ token, password });
      setDone(true);
      toast.success(t("auth.passwordUpdated"));
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err?.response?.data?.message || t("auth.somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <section className="auth-shell">
        <div className="auth-card auth-card-single" style={{ textAlign: "center" }}>
          <CheckCircle size={48} color="#22c55e" style={{ margin: "0 auto 16px" }} />
          <h1 style={{ marginBottom: 8 }}>{t("auth.passwordUpdated")}</h1>
          <p className="muted-text">{t("auth.redirectingToLogin")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-shell">
      <div className="auth-card auth-card-single">
        <p className="eyebrow">{t("auth.resetPasswordEyebrow")}</p>
        <h1>{t("auth.resetPasswordTitle")}</h1>
        <p className="muted-text">{t("auth.resetPasswordDescription")}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            {t("auth.newPassword")}
            <div style={{ position: "relative" }}>
              <Lock
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
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.enterNewPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: 36, paddingRight: 40 }}
                autoFocus
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "#9ca3af",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          <label>
            {t("auth.confirmPassword")}
            <div style={{ position: "relative" }}>
              <Lock
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
                type={showConfirm ? "text" : "password"}
                placeholder={t("auth.repeatPassword")}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={{ paddingLeft: 36, paddingRight: 40 }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: "#9ca3af",
                }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {/* Password strength hints */}
          {password.length > 0 && (
            <ul style={{ fontSize: 12, color: "#6b7280", margin: "-4px 0 0", paddingLeft: 16, lineHeight: 1.8 }}>
              <li style={{ color: password.length >= 8 ? "#22c55e" : "#ef4444" }}>
                {t("auth.passwordMin")}
              </li>
              <li style={{ color: /[A-Z]/.test(password) ? "#22c55e" : "#ef4444" }}>
                {t("auth.passwordUppercase")}
              </li>
              <li style={{ color: /[a-z]/.test(password) ? "#22c55e" : "#ef4444" }}>
                {t("auth.passwordLowercase")}
              </li>
              <li style={{ color: /\d/.test(password) ? "#22c55e" : "#ef4444" }}>
                {t("auth.passwordNumber")}
              </li>
            </ul>
          )}

          {error && (
            <p style={{ color: "#ef4444", fontSize: 13, margin: "-4px 0 0" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {loading ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                {t("auth.saving")}
              </>
            ) : (
              t("auth.saveNewPassword")
            )}
          </button>
        </form>

        <Link className="text-link" to="/login">
          {t("common.backToLogin")}
        </Link>
      </div>
    </section>
  );
}
