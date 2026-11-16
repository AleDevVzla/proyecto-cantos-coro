import React, { useState } from "react";
import { api, type AuthUser } from "../lib/api";
import {
  Lock,
  Mail,
  UserCheck,
  ShieldCheck,
  Building2,
  KeyRound,
  Moon,
  Music2,
  Sun,
} from "lucide-react";

interface LoginViewProps {
  onSuccess: (token: string, user: AuthUser) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onSuccess,
  isDarkMode,
  onToggleTheme,
}) => {
  const [tab, setTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [email, setEmail] = useState("director@santacecilia.org");
  const [password, setPassword] = useState("123456");

  // Registro
  const [name, setName] = useState("");
  const [registerMode, setRegisterMode] = useState<
    "CREATE_CHOIR" | "JOIN_CHOIR"
  >("JOIN_CHOIR");
  const [choirName, setChoirName] = useState("");
  const [parish, setParish] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(email, password);
      onSuccess(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("123456");
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(demoEmail, "123456");
      onSuccess(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.register({
        name,
        email,
        password,
        mode: registerMode,
        choirName,
        parish,
        inviteCode,
      });
      onSuccess(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100svh] overflow-x-hidden bg-stone-100 text-stone-900">
      <div className="grid min-h-[100svh] grid-rows-[minmax(160px,24svh)_1fr] lg:h-[100svh] lg:grid-cols-[1.05fr_0.95fr] lg:grid-rows-1">
        <section className="relative isolate min-h-0 overflow-hidden bg-[#eee8d8]">
          <img
            src="/logo-full-background.webp"
            alt="Corasis"
            className="absolute inset-0 z-0 h-full w-full object-cover object-center"
          />
          <div className="login-brand-panel absolute inset-x-4 bottom-4 z-10 max-w-sm rounded-xl border border-white/80 bg-white/90 p-3 shadow-sm backdrop-blur-sm sm:bottom-6 sm:left-6 sm:right-auto sm:p-4 lg:bottom-10 lg:left-10">
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Comunidad coral
            </p>
            <h1 className="mt-1 text-base font-semibold leading-snug text-stone-900 sm:text-lg">
              La música que reúne a tu comunidad.
            </h1>
          </div>
        </section>

        <section className="relative flex min-h-0 flex-col justify-center bg-white px-5 py-6 sm:px-10 lg:px-12">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
            aria-pressed={isDarkMode}
            title={isDarkMode ? "Activar modo claro" : "Activar modo oscuro"}
            className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-300 bg-white text-stone-700 transition hover:bg-stone-100 sm:right-8 sm:top-8"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="mx-auto w-full max-w-lg space-y-4 sm:space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-stone-950">
                <Music2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                  Corasis
                </p>
                <p className="text-sm text-stone-500">Cantoral para tu coro</p>
              </div>
            </div>

            {/* Selector de pestaña */}
            <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1 border border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setTab("LOGIN");
                  setError(null);
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  tab === "LOGIN"
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("REGISTER");
                  setError(null);
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  tab === "REGISTER"
                    ? "bg-white text-stone-900 shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Crear Cuenta / Unirse
              </button>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 font-medium">
                {error}
              </div>
            )}

            {tab === "LOGIN" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">
                    Bienvenido al Cantoral
                  </h3>
                  <p className="text-sm text-stone-500 mt-0.5">
                    Ingresa tus credenciales para acceder al repertorio de tu
                    coro.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail className="h-4 w-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="correo@tucoro.org"
                      className="w-full rounded-xl border border-stone-300 pl-10 pr-4 py-2.5 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="h-4 w-4 text-stone-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-stone-300 pl-10 pr-4 py-2.5 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-3 text-sm shadow-md shadow-amber-600/20 transition"
                >
                  {loading ? "Verificando acceso..." : "Iniciar Sesión"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">
                    Registro en la Comunidad Coral
                  </h3>
                  <p className="text-sm text-stone-500 mt-0.5">
                    Únete a tu coro existente como Miembro o registra un nuevo
                    coro como Director.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRegisterMode("JOIN_CHOIR")}
                    className={`p-3 rounded-xl border text-left transition ${
                      registerMode === "JOIN_CHOIR"
                        ? "border-amber-600 bg-amber-50/70 text-amber-950"
                        : "border-stone-200 hover:bg-stone-50 text-stone-600"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-amber-600" />
                      Soy Miembro
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Tengo código de invitación
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRegisterMode("CREATE_CHOIR")}
                    className={`p-3 rounded-xl border text-left transition ${
                      registerMode === "CREATE_CHOIR"
                        ? "border-amber-600 bg-amber-50/70 text-amber-950"
                        : "border-stone-200 hover:bg-stone-50 text-stone-600"
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-amber-600" />
                      Soy Director
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5">
                      Crear espacio para mi coro
                    </div>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Correo
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-amber-600 focus:outline-none"
                    />
                  </div>
                </div>

                {registerMode === "JOIN_CHOIR" ? (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                      Código de Invitación del Coro
                    </label>
                    <div className="relative">
                      <KeyRound className="h-4 w-4 text-stone-400 absolute left-3.5 top-2.5" />
                      <input
                        type="text"
                        required
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Ej. CECILIA-2026"
                        className="w-full rounded-xl border border-stone-300 pl-10 pr-4 py-2 text-sm font-mono uppercase focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                        Nombre del Coro
                      </label>
                      <div className="relative">
                        <Building2 className="h-4 w-4 text-stone-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          value={choirName}
                          onChange={(e) => setChoirName(e.target.value)}
                          placeholder="Ej. Coro San Pedro"
                          className="w-full rounded-xl border border-stone-300 pl-9 pr-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                        Parroquia / Comunidad
                      </label>
                      <input
                        type="text"
                        value={parish}
                        onChange={(e) => setParish(e.target.value)}
                        placeholder="Ej. Parroquia San Pedro"
                        className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold py-2.5 text-sm shadow-md transition"
                >
                  {loading ? "Procesando..." : "Completar Registro"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
