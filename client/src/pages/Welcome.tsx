import { useState, type CSSProperties, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import { trpc } from "@/lib/trpc";
import "./welcome.css";

export default function Welcome({ onLogin }: { onLogin: () => void }) {
  const login = trpc.auth.passwordLogin.useMutation({ onSuccess: onLogin });
  const address = trpc.auth.ministryAddress.useQuery();
  const [visible, setVisible] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    login.mutate({ email: String(values.get("email")), password: String(values.get("password")) });
  }
  return <main className="welcome">
    <section className="ministry-welcome">
      <div className="halo" aria-hidden="true" />
      <div className="gold-dust" aria-hidden="true">{Array.from({ length: 38 }, (_, i) =>
        <i key={i} style={{left: (i*47%99)+"%", top:(i*31%97)+"%", "--delay": -(i%11)+"s", "--speed": (8+i%6)+"s"} as CSSProperties} />)}</div>
      <div className="ministry-intro">
        <img className="ministry-seal" src="/ghop-emblem.png" alt="God’s House of Prayer Ministries emblem" />
        <p className="welcome-kicker">Welcome to</p>
        <h1>God’s House of<br/><em>Prayer</em> Ministry</h1>
        <p className="pastor-greeting">Pastor Daniel and Pastor Phiwe welcome you.</p>
      </div>
      <footer><blockquote>“For My house shall be called a house of prayer for all nations.”</blockquote><cite>Isaiah 56:7</cite>{address.data && <address>{address.data}</address>}</footer>
    </section>
    <section className="login-panel"><form onSubmit={submit}>
      <p className="welcome-kicker">Ministry workspace</p>
      <h2>Sign in</h2><p className="login-intro">Enter your details to open your workspace.</p>
      <label htmlFor="email">Email address</label><div className="login-input"><Mail size={18}/><input id="email" name="email" type="email" autoComplete="username" required maxLength={254}/></div>
      <label htmlFor="password">Password</label><div className="login-input"><KeyRound size={18}/><input id="password" name="password" type={visible?"text":"password"} autoComplete="current-password" required maxLength={1024}/><button type="button" aria-label={visible?"Hide password":"Show password"} aria-pressed={visible} onClick={()=>setVisible(!visible)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div>
      {login.error && <p role="alert">{login.error.message}</p>}
      <button className="login-submit" disabled={login.isPending}>{login.isPending?"Signing in…":"Sign in"}<ArrowRight size={18}/></button>
    </form></section>
  </main>;
}
