import { useState, type CSSProperties, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import "./welcome.css";

export default function Welcome({ onLogin }: { onLogin: () => void }) {
  const login = trpc.auth.passwordLogin.useMutation({ onSuccess: onLogin });
  const address = trpc.auth.ministryAddress.useQuery();
  const [visible, setVisible] = useState(false);
  type Mode = "login" | "register" | "confirm" | "forgot" | "reset";
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const register = trpc.auth.register.useMutation();
  const resend = trpc.auth.resendConfirmation.useMutation();
  const confirm = trpc.auth.confirmRegistration.useMutation();
  const requestReset = trpc.auth.requestReset.useMutation();
  const reset = trpc.auth.resetPassword.useMutation();
  const busy = [login, register, resend, confirm, requestReset, reset].some(
    action => action.isPending
  );
  const titles = {
    login: "Sign in",
    register: "Register",
    confirm: "Confirm your email",
    forgot: "Forgot password?",
    reset: "Set a new password",
  };
  const actions = {
    login: "Sign in",
    register: "Create account",
    confirm: "Confirm email",
    forgot: "Send reset code",
    reset: "Save new password",
  };
  const hints = {
    login: "Enter your details to open your workspace.",
    register: "Create a member account with your email address.",
    confirm: "Enter the confirmation code from your email.",
    forgot: "Enter your account email to request a reset code.",
    reset: "Enter the code from your email and choose a new password.",
  };
  function change(next: Mode, notice = "") {
    setVisible(false);
    setMode(next);
    setError("");
    setMessage(notice);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") ?? ""),
      code = String(values.get("code") ?? "");
    setError("");
    setMessage("");
    try {
      switch (mode) {
        case "login":
          await login.mutateAsync({ email, password });
          break;
        case "register":
          await register.mutateAsync({ email, password });
          change(
            "confirm",
            "If this is a new account, check your inbox. Already registered? Sign in below."
          );
          break;
        case "confirm":
          await confirm.mutateAsync({ email, code });
          change(
            "login",
            "Email confirmed. Sign in to complete your member profile."
          );
          break;
        case "forgot":
          await requestReset.mutateAsync({ email });
          change(
            "reset",
            "If the email belongs to a member account, a reset code is on its way."
          );
          break;
        case "reset":
          await reset.mutateAsync({ email, code, password });
          change("login", "Password updated. Sign in with your new password.");
          break;
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    }
  }
  return (
    <main className="welcome">
      <section className="ministry-welcome">
        <div className="halo" aria-hidden="true" />
        <div className="gold-dust" aria-hidden="true">
          {Array.from({ length: 38 }, (_, i) => (
            <i
              key={i}
              style={
                {
                  left: ((i * 47) % 99) + "%",
                  top: ((i * 31) % 97) + "%",
                  "--delay": -(i % 11) + "s",
                  "--speed": 8 + (i % 6) + "s",
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className="ministry-intro">
          <img
            className="ministry-seal"
            src="/ghop-emblem.png"
            alt="God’s House of Prayer Ministries emblem"
          />
          <p className="welcome-kicker">Welcome to</p>
          <h1>
            God’s House of
            <br />
            <em>Prayer</em> Ministry
          </h1>
          <p className="pastor-greeting">
            Pastor Daniel and Pastor Phiwe welcome you.
          </p>
        </div>
        <footer>
          <blockquote>
            “For My house shall be called a house of prayer for all nations.”
          </blockquote>
          <cite>Isaiah 56:7</cite>
          {address.data && <address>{address.data}</address>}
        </footer>
      </section>
      <section className="login-panel">
        <form key={mode} onSubmit={submit}>
          <p className="welcome-kicker">Ministry workspace</p>
          <h2>{titles[mode]}</h2>
          <p className="login-intro">{hints[mode]}</p>
          <label htmlFor="email">Email address</label>
          <div className="login-input">
            <Mail size={18} />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              maxLength={254}
            />
          </div>
          {(mode === "confirm" || mode === "reset") && (
            <>
              <label htmlFor="code">Email code</label>
              <div className="login-input">
                <input
                  id="code"
                  name="code"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]{6,10}"
                  required
                />
              </div>
            </>
          )}
          {(mode === "login" || mode === "reset" || mode === "register") && (
            <>
              <label htmlFor="password">
                {mode === "reset" ? "New password" : "Password"}
              </label>
              <div className="login-input">
                <KeyRound size={18} />
                <input
                  id="password"
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  minLength={mode === "login" ? 1 : 8}
                  required
                  maxLength={1024}
                />
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  aria-pressed={visible}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {mode !== "login" && <small>Use at least 8 characters.</small>}
            </>
          )}
          {message && <p role="status">{message}</p>}
          {error && <p role="alert">{error}</p>}
          <button className="login-submit" disabled={busy}>
            {busy ? "Please wait…" : actions[mode]}
            <ArrowRight size={18} />
          </button>
          <div className="account-links">
            {mode === "login" ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => change("register")}
                >
                  Register
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => change("forgot")}
                >
                  Forgot password?
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => change("login")}
              >
                Back to sign in
              </button>
            )}
            {mode === "reset" && (
              <button
                type="button"
                disabled={busy}
                onClick={() => change("forgot")}
              >
                Request another code
              </button>
            )}
            {mode === "confirm" && (
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setMessage("");
                  setError("");
                  try {
                    await resend.mutateAsync({ email });
                    setMessage(
                      "If confirmation is pending, a fresh code is on its way."
                    );
                  } catch (e) {
                    setError(
                      e instanceof Error ? e.message : "Please try again."
                    );
                  }
                }}
              >
                Resend code
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  );
}
