import React, { useState } from 'react';
import { api, type AuthUser } from '../lib/api';
import {
  Music2,
  Lock,
  Mail,
  UserCheck,
  Users,
  ShieldCheck,
  Sparkles,
  Building2,
  KeyRound,
} from 'lucide-react';

interface LoginViewProps {
  onSuccess: (token: string, user: AuthUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onSuccess }) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('director@santacecilia.org');
  const [password, setPassword] = useState('123456');

  // Registro
  const [name, setName] = useState('');
  const [registerMode, setRegisterMode] = useState<'CREATE_CHOIR' | 'JOIN_CHOIR'>(
    'JOIN_CHOIR'
  );
  const [choirName, setChoirName] = useState('');
  const [parish, setParish] = useState('');
  const [inviteCode, setInviteCode] = useState('');

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
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('123456');
    setError(null);
    setLoading(true);
    try {
      const res = await api.login(demoEmail, '123456');
      onSuccess(res.token, res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
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
      setError(err instanceof Error ? err.message : 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-stone-700/60 bg-white">
        {/* Columna Izquierda: Identidad y Accesos Rápidos de Demostración */}
        <div className="lg:col-span-5 bg-gradient-to-b from-stone-900 to-stone-950 text-white p-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 px-4 py-2.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-bold shadow">
                <Music2 className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight text-amber-100">
                  Cantoral Coral
                </h1>
                <p className="text-xs text-amber-300/80">
                  Sistema Cerrado de Repertorio Litúrgico
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-bold leading-snug text-stone-100">
                Repertorio organizado para directores y miembros de coros
              </h2>
              <p className="text-sm text-stone-300 leading-relaxed">
                Plataforma privada bajo autenticación donde cada director gestiona
                los cantos de su coro y decide cuáles compartir con la comunidad de
                coros registrados.
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
                <Sparkles className="h-4 w-4" />
                Acceso Rápido para Demostración de Roles
              </div>
              <p className="text-xs text-stone-400">
                Haz clic en un perfil para ingresar inmediatamente y probar los
                permisos:
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickDemoLogin('director@santacecilia.org')
                  }
                  className="w-full text-left rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 p-3 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      DIRECTOR — Coro Santa Cecilia
                    </div>
                    <div className="text-[11px] text-stone-300 mt-0.5">
                      Puede subir cantos y decidir si son Públicos o Privados
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-amber-400 group-hover:translate-x-0.5 transition">
                    Entrar →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickDemoLogin('miembro@santacecilia.org')
                  }
                  className="w-full text-left rounded-xl border border-stone-700 bg-stone-800/70 hover:bg-stone-800 p-3 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                      <UserCheck className="h-4 w-4 text-emerald-400" />
                      MIEMBRO — Coro Santa Cecilia
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Ve cantos privados de su coro + públicos de otros coros
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-stone-300 group-hover:translate-x-0.5 transition">
                    Entrar →
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoLogin('miembro@sanmiguel.org')}
                  className="w-full text-left rounded-xl border border-stone-700 bg-stone-800/70 hover:bg-stone-800 p-3 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-sky-400" />
                      MIEMBRO — Coro San Miguel (Otro Coro)
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      Ve los cantos que Santa Cecilia hizo Públicos (no sus privados)
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-stone-300 group-hover:translate-x-0.5 transition">
                    Entrar →
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-800 text-xs text-stone-400 flex items-center justify-between">
            <span>Acceso exclusivo con cuenta autenticada</span>
            <span className="font-mono text-amber-400/90">v1.0</span>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Login / Registro */}
        <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full space-y-6">
            {/* Selector de pestaña */}
            <div className="grid grid-cols-2 rounded-xl bg-stone-100 p-1 border border-stone-200">
              <button
                type="button"
                onClick={() => {
                  setTab('LOGIN');
                  setError(null);
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  tab === 'LOGIN'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('REGISTER');
                  setError(null);
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  tab === 'REGISTER'
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
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

            {tab === 'LOGIN' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">
                    Bienvenido al Cantoral
                  </h3>
                  <p className="text-sm text-stone-500 mt-0.5">
                    Ingresa tus credenciales para acceder al repertorio de tu coro.
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
                  {loading ? 'Verificando acceso...' : 'Iniciar Sesión'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-stone-900">
                    Registro en la Comunidad Coral
                  </h3>
                  <p className="text-sm text-stone-500 mt-0.5">
                    Únete a tu coro existente como Miembro o registra un nuevo coro
                    como Director.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRegisterMode('JOIN_CHOIR')}
                    className={`p-3 rounded-xl border text-left transition ${
                      registerMode === 'JOIN_CHOIR'
                        ? 'border-amber-600 bg-amber-50/70 text-amber-950'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-600'
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
                    onClick={() => setRegisterMode('CREATE_CHOIR')}
                    className={`p-3 rounded-xl border text-left transition ${
                      registerMode === 'CREATE_CHOIR'
                        ? 'border-amber-600 bg-amber-50/70 text-amber-950'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-600'
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

                {registerMode === 'JOIN_CHOIR' ? (
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
                  {loading ? 'Procesando...' : 'Completar Registro'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
