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

  .listen(PORT);

console.log(
  `🎵 API de Cantos Litúrgicos ejecutándose en http://localhost:${app.server?.port}`
);
