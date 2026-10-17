import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { User } from "../api/types";
import { switchUser } from "../lib/session";

type Mode = "login" | "register";

export function AuthPage() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<Mode>("login");
  const [login, setLogin] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = useMutation({
    mutationFn: () => (mode === "login" ? api.login(login, password) : api.register({ email, username, password })),
    onSuccess: (user: User) => switchUser(qc, user),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit.mutate();
  }

  function switchMode(next: Mode) {
    setMode(next);
    submit.reset();
  }

  const isLogin = mode === "login";

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5 font-display text-2xl font-extrabold">
          <img src="/favicon.svg" alt="" className="size-8" />
          Backlog
        </div>

        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          {isLogin ? "Entra a tu lista" : "Crea tu cuenta"}
        </h1>
        <p className="mt-2 text-muted">
          {isLogin ? "Tus juegos, notas y horas te esperan." : "Lleva la cuenta de todo lo que juegas."}
        </p>

        <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
          {isLogin ? (
            <Field label="Correo o usuario">
              <input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                className={inputCls}
              />
            </Field>
          ) : (
            <>
              <Field label="Usuario" hint="3-20 letras, números o _">
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  pattern="[A-Za-z0-9_]{3,20}"
                  autoFocus
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Correo">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className={inputCls}
                />
              </Field>
            </>
          )}

          <Field label="Contraseña" hint={isLogin ? undefined : "Mínimo 8 caracteres"}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={isLogin ? undefined : 8}
              required
              className={inputCls}
            />
          </Field>

          {submit.isError && (
            <p role="alert" className="rounded bg-st-dropped/15 px-4 py-3 text-st-dropped">
              {submit.error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={submit.isPending}
            className="mt-2 rounded-md bg-text py-3 font-bold text-ink hover:bg-white disabled:opacity-60"
          >
            {submit.isPending ? "Un momento…" : isLogin ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-muted">
          {isLogin ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
          <button
            type="button"
            onClick={() => switchMode(isLogin ? "register" : "login")}
            className="font-bold text-score hover:underline"
          >
            {isLogin ? "Regístrate" : "Entra"}
          </button>
        </p>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between font-bold">
        {label}
        {hint && <span className="text-sm font-normal text-muted">{hint}</span>}
      </span>
      {children}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border-2 border-line bg-panel px-3 py-2.5 text-text placeholder:text-muted/60 focus:border-score focus:outline-none";
