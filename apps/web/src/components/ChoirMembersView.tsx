import React, { useEffect, useState } from 'react';
import { api, type ChoirDetailsDTO } from '../lib/api';
import {
  Users,
  ShieldCheck,
  UserCheck,
  KeyRound,
  Building2,
  Mail,
  Music,
} from 'lucide-react';

export const ChoirMembersView: React.FC = () => {
  const [choir, setChoir] = useState<ChoirDetailsDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getChoirMembers()
      .then((res) => setChoir(res.choir))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-3xl border border-stone-200 bg-white p-10 text-center text-sm text-stone-500">
        Cargando integrantes del coro...
      </div>
    );
  }

  if (!choir) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">{choir.name}</h2>
            <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
              <Building2 className="h-3.5 w-3.5" />
              {choir.parish} • {choir.members.length} integrantes registrados
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 flex items-center gap-3">
          <KeyRound className="h-5 w-5 text-amber-700" />
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Código de Invitación para Nuevos Miembros
            </div>
            <div className="font-mono text-base font-bold text-stone-900">
              {choir.inviteCode}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {choir.members.map((m) => {
          const isDir = m.role === 'DIRECTOR';
          return (
            <div
              key={m.id}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    {m.user.name}
                  </h3>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                    <Mail className="h-3 w-3" /> {m.user.email}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                    isDir
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {isDir ? (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" /> Director
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-3.5 w-3.5" /> Miembro
                    </>
                  )}
                </span>
              </div>

              {m.instrument && (
                <div className="rounded-xl bg-stone-50 border border-stone-200/80 px-3 py-2 text-xs text-stone-700 flex items-center gap-2">
                  <Music className="h-3.5 w-3.5 text-amber-600" />
                  <span>
                    <strong>Cuerda / Instrumento:</strong> {m.instrument}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
