import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import { openapi } from '@elysiajs/openapi';
import { PrismaClient, LiturgicalSeason, MassSuitability } from '@prisma/client';
import { extractBearerUser, signToken } from './auth';

const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 4000);

const SeasonEnumSchema = t.Union([
  t.Literal('ORDINARIO'),
  t.Literal('CUARESMA'),
  t.Literal('PASCUA'),
  t.Literal('ADVIENTO'),
  t.Literal('NAVIDAD'),
]);

const SuitabilityEnumSchema = t.Union([
  t.Literal('LITURGICO'),
  t.Literal('NO_LITURGICO'),
]);

const app = new Elysia()
  .use(cors())
  .use(
    openapi({
      path: '/swagger',
      documentation: {
        info: {
          title: 'API Sistema de Gestión de Cantos Litúrgicos (V1)',
          version: '1.0.0',
          description:
            'API REST cerrada bajo autenticación para gestión y búsqueda libre de cantos por coros.',
        },
      },
    })
  )
  .get('/api/health', () => ({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  }))

  // ==========================================================================
  // MÓDULO 1: AUTENTICACIÓN Y SESIÓN CERRADA
  // ==========================================================================
  .post(
    '/api/auth/login',
    async ({ body, set }) => {
      const user = await prisma.user.findUnique({
        where: { email: body.email.toLowerCase().trim() },
        include: {
          memberships: {
            include: { choir: true },
          },
        },
      });

      if (!user || user.memberships.length === 0) {
        set.status = 401;
        return { error: 'Credenciales inválidas o usuario sin coro asignado.' };
      }

      const validPassword = await Bun.password.verify(
        body.password,
        user.passwordHash
      );

      if (!validPassword) {
        set.status = 401;
        return { error: 'Credenciales inválidas.' };
      }

      const primaryMembership = user.memberships[0];
      const payload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        choirId: primaryMembership.choir.id,
        choirName: primaryMembership.choir.name,
        parish: primaryMembership.choir.parish,
        role: primaryMembership.role,
      };

      const token = signToken(payload);
      return {
        token,
        user: payload,
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )

  .post(
    '/api/auth/register',
    async ({ body, set }) => {
      const email = body.email.toLowerCase().trim();
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        set.status = 400;
        return { error: 'Ya existe una cuenta con este correo electrónico.' };
      }

      const passwordHash = await Bun.password.hash(body.password, {
        algorithm: 'bcrypt',
        cost: 10,
      });

      let choirId = '';
      const role = body.mode === 'CREATE_CHOIR' ? 'DIRECTOR' : 'MEMBER';

      if (body.mode === 'CREATE_CHOIR') {
        if (!body.choirName?.trim()) {
          set.status = 400;
          return { error: 'Debes indicar el nombre de tu nuevo coro.' };
        }
        const inviteCode = `${body.choirName
          .trim()
          .slice(0, 6)
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, 'X')}-${Math.floor(1000 + Math.random() * 9000)}`;

        const newChoir = await prisma.choir.create({
          data: {
            name: body.choirName.trim(),
            parish: body.parish?.trim() || 'Comunidad Parroquial',
            inviteCode,
          },
        });
        choirId = newChoir.id;
      } else {
        const code = body.inviteCode?.trim().toUpperCase();
        if (!code) {
          set.status = 400;
          return { error: 'Debes ingresar el código de invitación de tu coro.' };
        }
        const targetChoir = await prisma.choir.findUnique({
          where: { inviteCode: code },
        });
        if (!targetChoir) {
          set.status = 404;
          return { error: 'Código de coro no encontrado. Verifica con tu director.' };
        }
        choirId = targetChoir.id;
      }

      const createdUser = await prisma.user.create({
        data: {
          email,
          name: body.name.trim(),
          passwordHash,
          memberships: {
            create: {
              choirId,
              role,
            },
          },
        },
        include: {
          memberships: {
            include: { choir: true },
          },
        },
      });

      const membership = createdUser.memberships[0];
      const payload = {
        userId: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        choirId: membership.choir.id,
        choirName: membership.choir.name,
        parish: membership.choir.parish,
        role: membership.role,
      };

      return {
        token: signToken(payload),
        user: payload,
      };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
        mode: t.Union([t.Literal('CREATE_CHOIR'), t.Literal('JOIN_CHOIR')]),
        choirName: t.Optional(t.String()),
        parish: t.Optional(t.String()),
        inviteCode: t.Optional(t.String()),
      }),
    }
  )

  .get('/api/auth/me', async ({ headers, set }) => {
    const authUser = extractBearerUser(headers.authorization);
    if (!authUser) {
      set.status = 401;
      return { error: 'No autenticado. Inicie sesión para acceder al sistema.' };
    }
    const choir = await prisma.choir.findUnique({
      where: { id: authUser.choirId },
    });
    return {
      user: {
        ...authUser,
        inviteCode: choir?.inviteCode || '',
      },
    };
  })

  // ==========================================================================
  // MÓDULO 2: GESTIÓN Y BUSCADOR LIBRE DE CANTOS (PROTEGIDO POR SESIÓN)
  // ==========================================================================
  .get(
    '/api/songs',
    async ({ headers, query, set }) => {
      const authUser = extractBearerUser(headers.authorization);
      if (!authUser) {
        set.status = 401;
        return { error: 'Acceso denegado. Sistema cerrado bajo autenticación.' };
      }

      const search = query.q?.trim();
      const season = query.season as LiturgicalSeason | undefined;
      const suitability = query.suitability as MassSuitability | undefined;
      const scope = query.scope || 'ALL'; // ALL | MY_CHOIR | PUBLIC_OTHER

      // Regla de visibilidad:
      // El usuario autenticado solo puede ver los cantos de su propio coro
      // O los cantos que directores de otros coros marcaron como públicos (isPublic: true)
      const visibilityWhere =
        scope === 'MY_CHOIR'
          ? { choirId: authUser.choirId }
          : scope === 'PUBLIC_OTHER'
          ? { isPublic: true, NOT: { choirId: authUser.choirId } }
          : {
              OR: [{ choirId: authUser.choirId }, { isPublic: true }],
            };

      const songs = await prisma.song.findMany({
        where: {
          AND: [
            visibilityWhere,
            season
              ? {
                  liturgicalSeasons: {
                    has: season,
                  },
                }
              : {},
            suitability
              ? {
                  massSuitability: suitability,
                }
              : {},
            search
              ? {
                  OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { author: { contains: search, mode: 'insensitive' } },
                    { lyricsAndChords: { contains: search, mode: 'insensitive' } },
                  ],
                }
              : {},
          ],
        },
        include: {
          choir: {
            select: { id: true, name: true, parish: true },
          },
          createdBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: [{ title: 'asc' }],
      });

      return { songs };
    },
    {
      query: t.Object({
        q: t.Optional(t.String()),
        season: t.Optional(t.String()),
        suitability: t.Optional(t.String()),
        scope: t.Optional(t.String()),
      }),
    }
  )

  .get('/api/songs/:id', async ({ headers, params, set }) => {
    const authUser = extractBearerUser(headers.authorization);
    if (!authUser) {
      set.status = 401;
      return { error: 'Acceso denegado.' };
    }

    const song = await prisma.song.findUnique({
      where: { id: params.id },
      include: {
        choir: { select: { id: true, name: true, parish: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!song) {
      set.status = 404;
      return { error: 'Canto no encontrado.' };
    }

    if (song.choirId !== authUser.choirId && !song.isPublic) {
      set.status = 403;
      return { error: 'Este canto es privado de otro coro.' };
    }

    return { song };
  })

  .post(
    '/api/songs',
    async ({ headers, body, set }) => {
      const authUser = extractBearerUser(headers.authorization);
      if (!authUser) {
        set.status = 401;
        return { error: 'No autenticado.' };
      }

      if (authUser.role !== 'DIRECTOR') {
        set.status = 403;
        return {
          error: 'Permiso denegado. Solo el Director del coro puede subir cantos.',
        };
      }

      if (body.liturgicalSeasons.length === 0) {
        set.status = 400;
        return { error: 'Debe seleccionar al menos un Tiempo en el Año.' };
      }

      const song = await prisma.song.create({
        data: {
          choirId: authUser.choirId,
          createdById: authUser.userId,
          title: body.title.trim(),
          author: body.author.trim() || 'Tradicional',
          baseKey: body.baseKey.trim() || 'Do',
          lyricsAndChords: body.lyricsAndChords,
          liturgicalSeasons: body.liturgicalSeasons,
          massSuitability: body.massSuitability,
          massMoments: body.massMoments || [],
          youtubeUrl: body.youtubeUrl?.trim() || null,
          sheetMusicUrl: body.sheetMusicUrl?.trim() || null,
          audioUrl: body.audioUrl?.trim() || null,
          isPublic: body.isPublic,
        },
        include: {
          choir: { select: { id: true, name: true, parish: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      set.status = 201;
      return { song };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        author: t.String(),
        baseKey: t.String(),
        lyricsAndChords: t.String({ minLength: 1 }),
        liturgicalSeasons: t.Array(SeasonEnumSchema),
        massSuitability: SuitabilityEnumSchema,
        massMoments: t.Optional(t.Array(t.String())),
        youtubeUrl: t.Optional(t.String()),
        sheetMusicUrl: t.Optional(t.String()),
        audioUrl: t.Optional(t.String()),
        isPublic: t.Boolean(),
      }),
    }
  )

  .put(
    '/api/songs/:id',
    async ({ headers, params, body, set }) => {
      const authUser = extractBearerUser(headers.authorization);
      if (!authUser) {
        set.status = 401;
        return { error: 'No autenticado.' };
      }

      if (authUser.role !== 'DIRECTOR') {
        set.status = 403;
        return {
          error: 'Solo el Director puede editar cantos.',
        };
      }

      const existing = await prisma.song.findUnique({
        where: { id: params.id },
      });

      if (!existing) {
        set.status = 404;
        return { error: 'Canto no encontrado.' };
      }

      if (existing.choirId !== authUser.choirId) {
        set.status = 403;
        return { error: 'Solo puedes editar cantos que pertenecen a tu propio coro.' };
      }

      const updated = await prisma.song.update({
        where: { id: params.id },
        data: {
          title: body.title.trim(),
          author: body.author.trim() || 'Tradicional',
          baseKey: body.baseKey.trim() || 'Do',
          lyricsAndChords: body.lyricsAndChords,
          liturgicalSeasons: body.liturgicalSeasons,
          massSuitability: body.massSuitability,
          massMoments: body.massMoments ?? existing.massMoments,
          youtubeUrl:
            body.youtubeUrl !== undefined
              ? body.youtubeUrl.trim() || null
              : existing.youtubeUrl,
          sheetMusicUrl:
            body.sheetMusicUrl !== undefined
              ? body.sheetMusicUrl.trim() || null
              : existing.sheetMusicUrl,
          audioUrl:
            body.audioUrl !== undefined
              ? body.audioUrl.trim() || null
              : existing.audioUrl,
          isPublic: body.isPublic,
        },
        include: {
          choir: { select: { id: true, name: true, parish: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });

      return { song: updated };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        author: t.String(),
        baseKey: t.String(),
        lyricsAndChords: t.String({ minLength: 1 }),
        liturgicalSeasons: t.Array(SeasonEnumSchema),
        massSuitability: SuitabilityEnumSchema,
        massMoments: t.Optional(t.Array(t.String())),
        youtubeUrl: t.Optional(t.String()),
        sheetMusicUrl: t.Optional(t.String()),
        audioUrl: t.Optional(t.String()),
        isPublic: t.Boolean(),
      }),
    }
  )

  .delete('/api/songs/:id', async ({ headers, params, set }) => {
    const authUser = extractBearerUser(headers.authorization);
    if (!authUser) {
      set.status = 401;
      return { error: 'No autenticado.' };
    }

    if (authUser.role !== 'DIRECTOR') {
      set.status = 403;
      return { error: 'Solo el Director puede eliminar cantos.' };
    }

    const existing = await prisma.song.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.choirId !== authUser.choirId) {
      set.status = 403;
      return { error: 'No tienes permiso para eliminar este canto.' };
    }

    await prisma.song.delete({ where: { id: params.id } });
    return { success: true };
  })

  // ==========================================================================
  // MÓDULO 3: CALENDARIO MANIPULABLE DEL CORO
  // ==========================================================================
  .get('/api/calendar', async ({ headers, set }) => {
    const authUser = extractBearerUser(headers.authorization);
    if (!authUser) {
      set.status = 401;
      return { error: 'No autenticado.' };
    }

    const events = await prisma.calendarEvent.findMany({
      where: { choirId: authUser.choirId },
      include: {
        massSchedule: {
          select: { id: true, title: true, liturgicalSeason: true },
        },
        rehearsalSchedule: {
          select: { id: true, title: true, generalObjective: true },
        },
      },
      orderBy: { startAt: 'asc' },
    });

    return { events };
  })

  .post(
    '/api/calendar',
    async ({ headers, body, set }) => {
      const authUser = extractBearerUser(headers.authorization);
      if (!authUser) {
        set.status = 401;
        return { error: 'No autenticado.' };
      }
      if (authUser.role !== 'DIRECTOR') {
        set.status = 403;
        return {
          error: 'Solo el Director puede agregar eventos en el calendario.',
        };
      }

      const event = await prisma.calendarEvent.create({
        data: {
          choirId: authUser.choirId,
          title: body.title.trim(),
          description: body.description?.trim() || null,
          location: body.location?.trim() || null,
          startAt: new Date(body.startAt),
          endAt: body.endAt ? new Date(body.endAt) : null,
          type: body.type,
          massScheduleId: body.massScheduleId || null,
          rehearsalScheduleId: body.rehearsalScheduleId || null,
        },
        include: {
          massSchedule: {
            select: { id: true, title: true, liturgicalSeason: true },
          },
          rehearsalSchedule: {
            select: { id: true, title: true, generalObjective: true },
          },
        },
      });

      set.status = 201;
      return { event };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        location: t.Optional(t.String()),
        startAt: t.String(),
        endAt: t.Optional(t.String()),
        type: t.Union([
          t.Literal('MASS'),
          t.Literal('REHEARSAL'),
          t.Literal('IMPORTANT_EVENT'),
        ]),
        massScheduleId: t.Optional(t.String()),
        rehearsalScheduleId: t.Optional(t.String()),
      }),
    }
  )

  .patch(
    '/api/calendar/:id/move',
    async ({ headers, params, body, set }) => {
      const authUser = extractBearerUser(headers.authorization);
      if (!authUser) {
        set.status = 401;
        return { error: 'No autenticado.' };
      }
      if (authUser.role !== 'DIRECTOR') {
        set.status = 403;
        return { error: 'Solo el Director puede reprogramar eventos.' };
      }

      const existing = await prisma.calendarEvent.findUnique({
        where: { id: params.id },
      });
      if (!existing || existing.choirId !== authUser.choirId) {
        set.status = 404;
        return { error: 'Evento no encontrado.' };
      }

      const newStart = new Date(body.startAt);
      let newEnd: Date | null = null;
      if (existing.endAt) {
        const durationMs =
          existing.endAt.getTime() - existing.startAt.getTime();
        newEnd = new Date(newStart.getTime() + durationMs);
      }

      const updated = await prisma.calendarEvent.update({
        where: { id: params.id },
        data: {
          startAt: newStart,
          endAt: newEnd,
        },
        include: {
          massSchedule: {
            select: { id: true, title: true, liturgicalSeason: true },
          },
          rehearsalSchedule: {
            select: { id: true, title: true, generalObjective: true },
          },
        },
      });

      return { event: updated };
    },
    {
      body: t.Object({
        startAt: t.String(),
      }),
    }
  )

  .delete('/api/calendar/:id', async ({ headers, params, set }) => {
    const authUser = extractBearerUser(headers.authorization);
    if (!authUser) {
      set.status = 401;
      return { error: 'No autenticado.' };
    }
    if (authUser.role !== 'DIRECTOR') {
      set.status = 403;
      return { error: 'Solo el Director puede eliminar eventos.' };
    }

    const existing = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.choirId !== authUser.choirId) {
      set.status = 404;
      return { error: 'Evento no encontrado.' };
    }

    await prisma.calendarEvent.delete({ where: { id: params.id } });
    return { success: true };
  })

  // ==========================================================================
  // MÓDULO 4: CRONOGRAMA DE MISA (ORDEN LITÚRGICO + LETRA Y ACORDES)
  // ==========================================================================
  .get('/api/mass-schedules', async ({ headers, set }) => {
    const authUser = extractBearerUser(headers.authorization);
    if (!authUser) {
      set.status = 401;
      return { error: 'No autenticado.' };
    }

    const schedules = await prisma.massSchedule.findMany({
      where: { choirId: authUser.choirId },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            song: {
              include: {
                choir: { select: { id: true, name: true, parish: true } },
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return { schedules };
  })

  .post(
    '/api/mass-schedules',
    async ({ headers, body, set }) => {
      const authUser = extractBearerUser(headers.authorization);
      if (!authUser) {
        set.status = 401;
        return { error: 'No autenticado.' };
      }
      if (authUser.role !== 'DIRECTOR') {
        set.status = 403;
        return {
          error: 'Solo el Director puede crear cronogramas de misa.',
        };
      }

      const schedule = await prisma.massSchedule.create({
        data: {
          choirId: authUser.choirId,
          title: body.title.trim(),
          date: new Date(body.date),
          liturgicalSeason: body.liturgicalSeason,
          celebrantNotes: body.celebrantNotes?.trim() || null,
          items: {
            create: body.items.map((item, idx) => ({
              sortOrder: idx + 1,
              momentName: item.momentName,
              songId: item.songId || null,
              targetKey: item.targetKey || null,
              directorNotes: item.directorNotes || null,
            })),
          },
        },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              song: {
                include: {
                  choir: { select: { id: true, name: true, parish: true } },
                },
              },
            },
          },
        },
      });

      // Registrar automáticamente en el Calendario del Coro
      await prisma.calendarEvent.create({
        data: {
          choirId: authUser.choirId,
          title: schedule.title,
          description: schedule.celebrantNotes || 'Celebración Eucarística programada',
          location: authUser.parish,
          startAt: schedule.date,
          type: 'MASS',
          massScheduleId: schedule.id,
        },
      });

      set.status = 201;
      return { schedule };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        date: t.String(),
        liturgicalSeason: SeasonEnumSchema,
        celebrantNotes: t.Optional(t.String()),
        items: t.Array(
          t.Object({
            momentName: t.String(),
            songId: t.Optional(t.Nullable(t.String())),
            targetKey: t.Optional(t.Nullable(t.String())),
            directorNotes: t.Optional(t.Nullable(t.String())),
          })
        ),
      }),
    }
  )

  .put(
    '/api/mass-schedules/:id',
    async ({ headers, params, body, set }) => {
      const authUser = extractBearerUser(headers.authorization);
      if (!authUser) {
        set.status = 401;
        return { error: 'No autenticado.' };
      }
      if (authUser.role !== 'DIRECTOR') {
        set.status = 403;
        return {
          error: 'Solo el Director puede actualizar el cronograma de misa.',
        };
      }

      const existing = await prisma.massSchedule.findUnique({
        where: { id: params.id },
      });
      if (!existing || existing.choirId !== authUser.choirId) {
        set.status = 404;
        return { error: 'Cronograma de misa no encontrado.' };
      }

      await prisma.massScheduleItem.deleteMany({
        where: { massScheduleId: params.id },
      });

      const updated = await prisma.massSchedule.update({
        where: { id: params.id },
        data: {
          title: body.title.trim(),
          date: new Date(body.date),
          liturgicalSeason: body.liturgicalSeason,
          celebrantNotes: body.celebrantNotes?.trim() || null,
          items: {
            create: body.items.map((item, idx) => ({
              sortOrder: idx + 1,
              momentName: item.momentName,
              songId: item.songId || null,
              targetKey: item.targetKey || null,
              directorNotes: item.directorNotes || null,
            })),
          },
        },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              song: {
                include: {
                  choir: { select: { id: true, name: true, parish: true } },
                },
              },
            },
          },
        },
      });

      return { schedule: updated };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        date: t.String(),
        liturgicalSeason: SeasonEnumSchema,
        celebrantNotes: t.Optional(t.String()),
        items: t.Array(
          t.Object({
            momentName: t.String(),
            songId: t.Optional(t.Nullable(t.String())),
            targetKey: t.Optional(t.Nullable(t.String())),
            directorNotes: t.Optional(t.Nullable(t.String())),
          })
        ),
      }),
    }
  )

  .delete('/api/mass-schedules/:id', async ({ headers, params, set }) => {
    const authUser = extractBearerUser(headers.authorization);
    if (!authUser) {
      set.status = 401;
      return { error: 'No autenticado.' };
    }
    if (authUser.role !== 'DIRECTOR') {
      set.status = 403;
      return { error: 'Solo el Director puede eliminar cronogramas de misa.' };
    }

    const existing = await prisma.massSchedule.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.choirId !== authUser.choirId) {
      set.status = 404;
      return { error: 'Cronograma no encontrado.' };
    }

    await prisma.massSchedule.delete({ where: { id: params.id } });
    return { success: true };
  })

  // ==========================================================================
  // MÓDULO 5: CRONOGRAMA DE ENSAYOS ("SABER QUÉ SE HARÁ A CABALIDAD")
  // ==========================================================================
  .get('/api/rehearsal-schedules', async ({ headers, set }) => {
    const authUser = extractBearerUser(headers.authorization);
    if (!authUser) {
      set.status = 401;
      return { error: 'No autenticado.' };
    }

    const rehearsals = await prisma.rehearsalSchedule.findMany({
      where: { choirId: authUser.choirId },
      include: {
        blocks: {
          orderBy: { sortOrder: 'asc' },
          include: {
            songs: {
              include: {
                song: {
                  include: {
                    choir: { select: { id: true, name: true, parish: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return { rehearsals };
  })

  .post(
    '/api/rehearsal-schedules',
    async ({ headers, body, set }) => {
      const authUser = extractBearerUser(headers.authorization);
      if (!authUser) {
        set.status = 401;
        return { error: 'No autenticado.' };
      }
      if (authUser.role !== 'DIRECTOR') {
        set.status = 403;
        return {
          error: 'Solo el Director puede crear cronogramas de ensayo.',
        };
      }

      const rehearsal = await prisma.rehearsalSchedule.create({
        data: {
          choirId: authUser.choirId,
          title: body.title.trim(),
          date: new Date(body.date),
          location: body.location.trim() || 'Salón Parroquial',
          generalObjective: body.generalObjective.trim(),
          blocks: {
            create: body.blocks.map((b, idx) => ({
              sortOrder: idx + 1,
              title: b.title.trim(),
              blockType: b.blockType,
              durationMinutes: b.durationMinutes,
              detailedNotes: b.detailedNotes.trim(),
              isCompleted: Boolean(b.isCompleted),
              songs: {
                create: (b.songIds || []).map((sid) => ({
                  songId: sid,
                })),
              },
            })),
          },
        },
        include: {
          blocks: {
            orderBy: { sortOrder: 'asc' },
            include: {
              songs: {
                include: {
                  song: {
                    include: {
                      choir: { select: { id: true, name: true, parish: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Agregar automáticamente al Calendario del Coro
      await prisma.calendarEvent.create({
        data: {
          choirId: authUser.choirId,
          title: rehearsal.title,
          description: rehearsal.generalObjective,
          location: rehearsal.location,
          startAt: rehearsal.date,
          type: 'REHEARSAL',
          rehearsalScheduleId: rehearsal.id,
        },
      });

      set.status = 201;
      return { rehearsal };
    },
    {
      body: t.Object({
        title: t.String({ minLength: 1 }),
        date: t.String(),
        location: t.String(),
        generalObjective: t.String({ minLength: 1 }),
        blocks: t.Array(
          t.Object({
            title: t.String({ minLength: 1 }),
            blockType: t.Union([
              t.Literal('ORACION'),
              t.Literal('VOCALIZACION'),
              t.Literal('PRACTICA_CANTO'),
              t.Literal('REPASO_MISA'),
              t.Literal('AVISOS'),
            ]),
            durationMinutes: t.Number(),
            detailedNotes: t.String(),
            isCompleted: t.Optional(t.Boolean()),
            songIds: t.Optional(t.Array(t.String())),
          })
        ),
      }),
    }
  )

  .patch(
    '/api/rehearsal-schedules/:id/blocks/:blockId/toggle',
    async ({ headers, params, set }) => {
      const authUser = extractBearerUser(headers.authorization);
      if (!authUser) {
        set.status = 401;
        return { error: 'No autenticado.' };
      }
      if (authUser.role !== 'DIRECTOR') {
        set.status = 403;
        return {
          error: 'Solo el Director puede marcar el avance oficial del ensayo.',
        };
      }

      const block = await prisma.rehearsalBlock.findUnique({
        where: { id: params.blockId },
        include: { rehearsalSchedule: true },
      });

      if (!block || block.rehearsalSchedule.choirId !== authUser.choirId) {
        set.status = 404;
        return { error: 'Bloque de ensayo no encontrado.' };
      }

      await prisma.rehearsalBlock.update({
        where: { id: params.blockId },
        data: { isCompleted: !block.isCompleted },
      });

      return { success: true, isCompleted: !block.isCompleted };
    }
  )

  .delete('/api/rehearsal-schedules/:id', async ({ headers, params, set }) => {
    const authUser = extractBearerUser(headers.authorization);
    if (!authUser) {
      set.status = 401;
      return { error: 'No autenticado.' };
    }
    if (authUser.role !== 'DIRECTOR') {
      set.status = 403;
      return { error: 'Solo el Director puede eliminar cronogramas de ensayo.' };
    }

    const existing = await prisma.rehearsalSchedule.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.choirId !== authUser.choirId) {
      set.status = 404;
      return { error: 'Cronograma de ensayo no encontrado.' };
    }

    await prisma.rehearsalSchedule.delete({ where: { id: params.id } });
    return { success: true };
  })

  // ==========================================================================
  // MÓDULO 6: MIEMBROS DEL CORO E INVITACIONES
  // ==========================================================================
  .get('/api/choir/members', async ({ headers, set }) => {
    const authUser = extractBearerUser(headers.authorization);
    if (!authUser) {
      set.status = 401;
      return { error: 'No autenticado.' };
    }

    const choir = await prisma.choir.findUnique({
      where: { id: authUser.choirId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { role: 'asc' },
        },
      },
    });

    return { choir };
  })

  .listen(PORT);

console.log(
  `🎵 API de Cantos Litúrgicos (V2 Sistema Completo) ejecutándose en http://localhost:${app.server?.port}`
);
