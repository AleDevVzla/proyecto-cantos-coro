import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
}

async function main() {
  console.log('🌱 Iniciando seed de Base de Datos (Versión 2 - Sistema Completo)...');

  const defaultPass = await hashPassword('123456');

  let coroSantaCecilia = await prisma.choir.findUnique({
    where: { inviteCode: 'CECILIA-2026' },
  });

  if (!coroSantaCecilia) {
    coroSantaCecilia = await prisma.choir.create({
      data: {
        name: 'Coro Santa Cecilia',
        parish: 'Parroquia San José',
        inviteCode: 'CECILIA-2026',
      },
    });
  }

  let coroSanMiguel = await prisma.choir.findUnique({
    where: { inviteCode: 'MIGUEL-2026' },
  });

  if (!coroSanMiguel) {
    coroSanMiguel = await prisma.choir.create({
      data: {
        name: 'Coro San Miguel Arcángel',
        parish: 'Parroquia Cristo Rey',
        inviteCode: 'MIGUEL-2026',
      },
    });
  }

  const ensureUser = async (
    email: string,
    name: string,
    choirId: string,
    role: 'DIRECTOR' | 'MEMBER',
    instrument: string
  ) => {
    let u = await prisma.user.findUnique({ where: { email } });
    if (!u) {
      u = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: defaultPass,
          memberships: {
            create: { choirId, role, instrument },
          },
        },
      });
    }
    return u;
  };

  const directorAlejandro = await ensureUser(
    'director@santacecilia.org',
    'Alejandro Morales (Director)',
    coroSantaCecilia.id,
    'DIRECTOR',
    'Guitarra y Dirección'
  );

  await ensureUser(
    'miembro@santacecilia.org',
    'María Fernanda (Soprano)',
    coroSantaCecilia.id,
    'MEMBER',
    'Voz Soprano'
  );

  await ensureUser(
    'tenor@santacecilia.org',
    'Javier Rojas (Tenor)',
    coroSantaCecilia.id,
    'MEMBER',
    'Voz Tenor y Cajón'
  );

  const directorCarlos = await ensureUser(
    'director@sanmiguel.org',
    'Carlos Mendoza (Director)',
    coroSanMiguel.id,
    'DIRECTOR',
    'Teclado y Dirección'
  );

  await ensureUser(
    'miembro@sanmiguel.org',
    'Lucía Gómez (Contralto)',
    coroSanMiguel.id,
    'MEMBER',
    'Voz Contralto'
  );

  const existingSongCount = await prisma.song.count();
  if (existingSongCount === 0) {
  await prisma.song.createMany({
    data: [
      {
        choirId: coroSantaCecilia.id,
        createdById: directorAlejandro.id,
        title: 'Juntos como Hermanos',
        author: 'Cesáreo Gabaráin',
        baseKey: 'Re',
        liturgicalSeasons: ['ORDINARIO'],
        massSuitability: 'LITURGICO',
        isPublic: true,
        lyricsAndChords: `{CORO}
[Re]Juntos como her[La]manos,
[Sim]miembros de una I[Fa#m]glesia,
[Sol]vamos cami[Re]nando
al en[Mim]cuentro [La]del Se[Re]ñor.

{ESTROFA 1}
[Re]Un largo ca[La]minar
por el de[Sim]sierto bajo el [Fa#m]sol,
[Sol]no podemos a[Re]vanzar
sin la a[Mim]yuda [La]del Se[Re]ñor.

{ESTROFA 2}
[Re]Unidos al o[La]rar,
unidos [Sim]en una can[Fa#m]ción,
[Sol]viviremos nuestra [Re]fe
con la a[Mim]yuda [La]del Se[Re]ñor.`,
      },
      {
        choirId: coroSantaCecilia.id,
        createdById: directorAlejandro.id,
        title: 'Pueblo de Reyes',
        author: 'Lucien Deiss',
        baseKey: 'Sol',
        liturgicalSeasons: ['ORDINARIO', 'PASCUA'],
        massSuitability: 'LITURGICO',
        isPublic: false, // Privado solo para Coro Santa Cecilia
        lyricsAndChords: `{CORO}
[Sol]Pueblo de [Sim]reyes, asam[Do]blea [Sol]santa,
[Do]pueblo sacer[Sol]dotal, [Lam]pueblo de [Re]Dios,
¡ben[Do]dice a [Re]tu Se[Sol]ñor!

{ESTROFA 1}
[Sol]Te cantamos, oh [Do]Hijo amado del [Sol]Padre,
te ala[Mim]bamos, eterna Pa[Lam]labra salida de [Re]Dios.

{ESTROFA 2}
[Sol]Te cantamos, oh [Do]Hijo de la Virgen Ma[Sol]ría,
te ala[Mim]bamos, oh Cristo nuestro her[Lam]mano, nuestro Salva[Re]dor.`,
      },
      {
        choirId: coroSantaCecilia.id,
        createdById: directorAlejandro.id,
        title: 'Perdona a tu Pueblo Señor',
        author: 'Tradicional Cuaresmal',
        baseKey: 'Mim',
        liturgicalSeasons: ['CUARESMA'],
        massSuitability: 'LITURGICO',
        isPublic: true,
        lyricsAndChords: `{CORO}
[Mim]Perdona a tu pueblo, Se[Si7]ñor,
per[Mim]dona a tu pueblo,
[Lam]perdónale, Se[Si7]ñor.

{ESTROFA 1}
[Mim]No estés eternamente eno[Si7]jado,
no es[Mim]tés eternamente enojado,
[Lam]perdónale, Se[Si7]ñor.

{ESTROFA 2}
[Mim]Por tus profundas llagas cru[Si7]eles,
por [Mim]tus salivas y por tus hieles,
[Lam]perdónale, Se[Si7]ñor.`,
      },
      {
        choirId: coroSantaCecilia.id,
        createdById: directorAlejandro.id,
        title: 'Resucitó, Aleluya',
        author: 'Kiko Argüello',
        baseKey: 'Lam',
        liturgicalSeasons: ['PASCUA'],
        massSuitability: 'LITURGICO',
        isPublic: true,
        lyricsAndChords: `{CORO}
[Lam]¡Resuci[Sol]tó, resuci[Fa]tó, resuci[Mi]tó, alelu[Lam]ya!
¡Alelu[Sol]ya, alelu[Fa]ya, alelu[Mi]ya, resuci[Lam]tó!

{ESTROFA 1}
[Lam]La muerte, ¿dónde está la [Sol]muerte?
¿Dónde está mi [Fa]muerte?
¿Dónde su vic[Mi]toria?

{ESTROFA 2}
[Lam]Alegría, alegría her[Sol]manos,
que si hoy nos que[Fa]remos
es que resuci[Mi]tó.`,
      },
      {
        choirId: coroSantaCecilia.id,
        createdById: directorAlejandro.id,
        title: 'Ven, Ven Señor No Tardes',
        author: 'Cesáreo Gabaráin',
        baseKey: 'Do',
        liturgicalSeasons: ['ADVIENTO'],
        massSuitability: 'LITURGICO',
        isPublic: true,
        lyricsAndChords: `{CORO}
[Do]Ven, ven Se[Sol]ñor, no [Do]tardes;
[Fa]ven, ven que te espe[Sol]ramos;
[Do]ven, ven Se[Sol]ñor, no [Do]tardes;
[Fa]ven pronto, [Sol]Se[Do]ñor.

{ESTROFA 1}
[Do]El mundo muere de [Fa]frío,
el [Sol]alma perdió el ca[Do]lor;
los [Fa]hombres no son her[Do]manos,
el [Re7]mundo no tiene a[Sol]mor.

{ESTROFA 2}
[Do]Envuelto en sombría [Fa]noche,
el [Sol]mundo sin paz no [Do]ve,
bus[Fa]cando va una espe[Do]ranza,
bus[Re7]cando, Señor, tu [Sol]fe.`,
      },
      {
        choirId: coroSantaCecilia.id,
        createdById: directorAlejandro.id,
        title: 'Noche de Paz',
        author: 'Franz Gruber / Joseph Mohr',
        baseKey: 'La',
        liturgicalSeasons: ['NAVIDAD'],
        massSuitability: 'LITURGICO',
        isPublic: true,
        lyricsAndChords: `{ESTROFA 1}
[La]Noche de paz, noche de amor,
[Mi]todo duerme en derre[La]dor.
[Re]Entre los astros que es[La]parcen su luz,
[Re]bella anunciando al ni[La]ñito Jesús,
[Mi]brilla la estrella de [Fa#m]paz,
[La]brilla la es[Mi]trella de [La]paz.

{ESTROFA 2}
[La]Noche de paz, noche de amor,
[Mi]oye humilde el fiel pas[La]tor,
[Re]coros celestes que a[La]nuncian salud,
[Re]gracias y glorias en [La]gran plenitud,
[Mi]por nuestro buen Reden[Fa#m]tor,
[La]por nuestro [Mi]buen Reden[La]tor.`,
      },
      {
        choirId: coroSanMiguel.id,
        createdById: directorCarlos.id,
        title: 'Alma de Cristo (Arreglo Coro San Miguel)',
        author: 'San Ignacio / Música Jésed',
        baseKey: 'Mi',
        liturgicalSeasons: ['ORDINARIO', 'CUARESMA'],
        massSuitability: 'LITURGICO',
        isPublic: true, // Público de OTRO coro (San Miguel)
        lyricsAndChords: `{ESTROFA 1}
[Mi]Alma de Cristo, santi[Do#m]fícame.
[La]Cuerpo de Cristo, [Si]sálvame.
[Mi]Sangre de Cristo, embri[Do#m]ágame.
[La]Agua del costado de [Si]Cristo, [Mi]lávame.

{ESTROFA 2}
[Fa#m]Pasión de Cristo, con[Do#m]fórtame.
[Fa#m]¡Oh, buen Jesús!, [Si]óyeme.
[La]Dentro de tus llagas, es[Mi]cóndeme.
[La]No permitas que me a[Fa#m]parte de [Si]Ti.`,
      },
      {
        choirId: coroSanMiguel.id,
        createdById: directorCarlos.id,
        title: 'Himno Patronal a San Miguel (Exclusivo)',
        author: 'Coro San Miguel Arcángel',
        baseKey: 'Re',
        liturgicalSeasons: ['ORDINARIO'],
        massSuitability: 'NO_LITURGICO',
        isPublic: false, // Privado de Coro San Miguel
        lyricsAndChords: `{CORO}
[Re]San Miguel Ar[La]cángel, príncipe ce[Sim]lestial,
[Sol]defiende a tu pa[Re]rroquia en [La]la batalla espiri[Re]tual.`,
      },
      {
        choirId: coroSantaCecilia.id,
        createdById: directorAlejandro.id,
        title: 'Nadie Te Ama Como Yo',
        author: 'Martín Valverde',
        baseKey: 'Do',
        liturgicalSeasons: ['ORDINARIO', 'CUARESMA'],
        massSuitability: 'NO_LITURGICO',
        massMoments: ['Meditación / Poscomunión'],
        isPublic: true,
        lyricsAndChords: `{ESTROFA 1}
[Do]Cuánto he esperado este mo[Sol]mento,
[Lam]cuánto he esperado que estu[Mim]vieras así,
[Fa]cuánto he esperado que me ha[Do]blaras,
[Rem]cuánto he esperado que vi[Sol]nieras a mí.

{CORO}
[Do]Pues nadie te ama [Sol]como yo,
[Lam]pues nadie te ama [Mim]como yo;
[Fa]mira la cruz, ésa es mi [Do]más grande prueba,
[Rem]nadie te ama como [Sol]yo.
[Do]Pues nadie te ama [Sol]como yo,
[Lam]pues nadie te ama [Mim]como yo;
[Fa]mira la cruz, fue por [Do]ti, fue porque te amo,
[Rem]nadie te [Sol]ama como [Do]yo.`,
      },
    ],
  });
  }

  // Asegurar cantos ordinarios de la misa (Piedad, Gloria, Ofertorio, Santo, Cordero)
  const ensureMassSong = async (
    title: string,
    author: string,
    baseKey: string,
    moment: string,
    lyricsAndChords: string
  ) => {
    const found = await prisma.song.findFirst({ where: { title } });
    if (!found) {
      return await prisma.song.create({
        data: {
          choirId: coroSantaCecilia.id,
          createdById: directorAlejandro.id,
          title,
          author,
          baseKey,
          liturgicalSeasons: ['ORDINARIO', 'PASCUA', 'NAVIDAD'],
          massSuitability: 'LITURGICO',
          massMoments: [moment],
          isPublic: true,
          lyricsAndChords,
        },
      });
    }
    return found;
  };

  const sPiedad = await ensureMassSong(
    'Señor Ten Piedad (Tradicional)',
    'Liturgia Parroquial',
    'Mim',
    'Señor Ten Piedad',
    `{ESTROFA 1}\n[Mim]Señor, ten pie[Lam]dad de no[Mim]sotros.\n[Do]Señor, ten pie[Si7]dad de no[Mim]sotros.\n\n{CORO}\n[Sol]Cristo, ten pie[Re]dad de no[Sol]sotros.\n[Lam]Cristo, ten pie[Si7]dad de no[Mim]sotros.`
  );

  const sGloria = await ensureMassSong(
    'Gloria a Dios en el Cielo (Giombini)',
    'Marcello Giombini',
    'Re',
    'Gloria',
    `{CORO}\n[Re]Gloria, [La]gloria, a [Sim]Dios en el [Fa#m]cielo,\ny en la [Sol]tierra a los [Re]hombres [Mim]paz.[La]\n\n{ESTROFA 1}\n[Re]Te alabamos y te [La]bendecimos,\n[Sim]te adoramos y glorifi[Fa#m]camos.`
  );

  const sOfertorio = await ensureMassSong(
    'Te Presentamos el Vino y el Pan',
    'Juan Antonio Espinosa',
    'Sol',
    'Ofertorio',
    `{CORO}\n[Sol]Te presentamos el [Do]vino y el [Sol]pan,\nben[Do]dito seas por [Re]siempre, Se[Sol]ñor.\n\n{ESTROFA 1}\n[Sol]Bendito seas, Se[Do]ñor, por este [Sol]pan que nos diste,\n[Do]fruto de la [Sol]tierra y del tra[Re]bajo de los hombres.`
  );

  const sSanto = await ensureMassSong(
    'Santo es el Señor (Solemne)',
    'Tradicional Litúrgico',
    'Lam',
    'Santo',
    `{ESTROFA 1}\n[Lam]Santo, Santo, [Sol]Santo es el Se[Fa]ñor,\nDios del uni[Mi]verso.\n[Lam]Llenos están el [Sol]cielo y la [Fa]tierra\nde tu [Mi]gloria, hosanna.\n\n{CORO}\n[Lam]Hosanna, [Rem]hosanna,\n[Sol]hosanna en el [Do]cielo.[Mi]`
  );

  const sCordero = await ensureMassSong(
    'Cordero de Dios (Coral)',
    'Arreglo Santa Cecilia',
    'Do',
    'Cordero de Dios / Paz',
    `{ESTROFA 1}\n[Do]Cordero de [Sol]Dios que [Lam]quitas\nel pe[Fa]cado del [Sol]mundo,\n[Fa]ten piedad de no[Sol]sotros, [Do]ten pie[Sol]dad.\n\n{FINAL}\n[Do]Cordero de [Sol]Dios que [Lam]quitas\nel pe[Fa]cado del [Sol]mundo,\n[Fa]danos la [Sol]paz, [Fa]danos [Sol]la [Do]paz.`
  );

  const sEntrada = await prisma.song.findFirst({
    where: { title: { contains: 'Juntos como Hermanos' } },
  });
  const sComunion = await prisma.song.findFirst({
    where: { title: { contains: 'Alma de Cristo' } },
  });
  const sSalida = await prisma.song.findFirst({
    where: { title: { contains: 'Pueblo de Reyes' } },
  });

  // 4. Crear Cronogramas de Misa, Ensayo y Eventos del Calendario si están vacíos
  const existingMassCount = await prisma.massSchedule.count();
  if (existingMassCount === 0) {
    const massDominical = await prisma.massSchedule.create({
      data: {
        choirId: coroSantaCecilia.id,
        title: 'Misa Dominical Solemne (11:00 AM)',
        date: new Date('2026-10-25T11:00:00.000Z'),
        liturgicalSeason: 'ORDINARIO',
        celebrantNotes:
          'Celebrante: Pbro. Roberto Jiménez. Procesión solemne de entrada.',
        items: {
          create: [
            {
              sortOrder: 1,
              momentName: 'Entrada',
              songId: sEntrada?.id,
              targetKey: 'Re',
              directorNotes: 'Inicia guitarra con rasgueo firme; entra todo el coro.',
            },
            {
              sortOrder: 2,
              momentName: 'Señor Ten Piedad',
              songId: sPiedad.id,
              targetKey: 'Mim',
              directorNotes: 'Solista soprano en las invocaciones; coro responde.',
            },
            {
              sortOrder: 3,
              momentName: 'Gloria',
              songId: sGloria.id,
              targetKey: 'Re',
              directorNotes: 'Cantar a dos voces en el estribillo.',
            },
            {
              sortOrder: 4,
              momentName: 'Ofertorio',
              songId: sOfertorio.id,
              targetKey: 'Sol',
              directorNotes: 'Volumen suave durante la procesión de ofrendas.',
            },
            {
              sortOrder: 5,
              momentName: 'Santo',
              songId: sSanto.id,
              targetKey: 'Lam',
              directorNotes: 'Cuidar el corte final en Hosanna.',
            },
            {
              sortOrder: 6,
              momentName: 'Cordero de Dios / Paz',
              songId: sCordero.id,
              targetKey: 'Do',
              directorNotes: 'Arpegio delicado en la última petición.',
            },
            {
              sortOrder: 7,
              momentName: 'Comunión',
              songId: sComunion?.id,
              targetKey: 'Mi',
              directorNotes: 'Canto público compartido por el Coro San Miguel.',
            },
            {
              sortOrder: 8,
              momentName: 'Salida',
              songId: sSalida?.id,
              targetKey: 'Sol',
              directorNotes: 'Iniciar inmediatamente tras el "Demos gracias a Dios".',
            },
          ],
        },
      },
    });

    const rehearsalSabado = await prisma.rehearsalSchedule.create({
      data: {
        choirId: coroSantaCecilia.id,
        title: 'Ensayo General Pre-Misa Dominical',
        date: new Date('2026-10-24T17:00:00.000Z'),
        location: 'Salón Santa Cecilia (Parroquia San José)',
        generalObjective:
          'Dejar ensamblado a cabalidad el repertorio de la Misa Dominical de 11:00 AM, puliendo las segundas voces del Santo y la dinámica del canto de Comunión.',
        blocks: {
          create: [
            {
              sortOrder: 1,
              title: 'Oración Inicial y Afinación de Instrumentos',
              blockType: 'ORACION',
              durationMinutes: 10,
              detailedNotes:
                'Lectura breve del Evangelio del domingo, oración del coro y afinación de guitarras en 440Hz.',
              isCompleted: true,
            },
            {
              sortOrder: 2,
              title: 'Técnica Vocal y Respiración Diafragmática',
              blockType: 'VOCALIZACION',
              durationMinutes: 15,
              detailedNotes:
                'Ejercicios de apoyo respiratorio (4 tiempos inhalar, 4 sostener, 8 exhalar en S) y vocalización por cuerdas (Sopranos, Contraltos y Tenores).',
              isCompleted: true,
            },
            {
              sortOrder: 3,
              title: 'Armonización de Voces: Santo y Cordero de Dios',
              blockType: 'PRACTICA_CANTO',
              durationMinutes: 25,
              detailedNotes:
                'Practicar a capella las entradas de segundas voces en "Hosanna en el cielo" y el matiz piano en "danos la paz".',
              isCompleted: false,
              songs: {
                create: [
                  {
                    songId: sSanto.id,
                    focusNotes: 'Cuidar entrada de tenores en Hosanna',
                  },
                  {
                    songId: sCordero.id,
                    focusNotes: 'Rallentando en el último compás',
                  },
                ],
              },
            },
            {
              sortOrder: 4,
              title: 'Montaje de Canto de Comunión: Alma de Cristo',
              blockType: 'PRACTICA_CANTO',
              durationMinutes: 25,
              detailedNotes:
                'Estudiar estrofa por estrofa el arreglo público del Coro San Miguel. Ajustar cejilla y transiciones armónicas.',
              isCompleted: false,
              songs: sComunion
                ? {
                    create: [
                      {
                        songId: sComunion.id,
                        focusNotes: 'Practicar en tono original Mi mayor',
                      },
                    ],
                  }
                : undefined,
            },
            {
              sortOrder: 5,
              title: 'Simulacro Continuo de Misa y Avisos Parroquiales',
              blockType: 'REPASO_MISA',
              durationMinutes: 20,
              detailedNotes:
                'Pasar en orden Entrada, Piedad, Gloria, Ofertorio y Salida sin interrupciones para medir tiempos de cambio de tono.',
              isCompleted: false,
              songs: {
                create: [
                  ...(sEntrada ? [{ songId: sEntrada.id }] : []),
                  { songId: sGloria.id },
                  { songId: sOfertorio.id },
                ],
              },
            },
          ],
        },
      },
    });

    await prisma.calendarEvent.createMany({
      data: [
        {
          choirId: coroSantaCecilia.id,
          title: 'Ensayo General Pre-Misa',
          description:
            'Ensayo estructurado por bloques para preparar la Misa Dominical.',
          location: 'Salón Santa Cecilia',
          startAt: new Date('2026-10-24T17:00:00.000Z'),
          endAt: new Date('2026-10-24T18:35:00.000Z'),
          type: 'REHEARSAL',
          rehearsalScheduleId: rehearsalSabado.id,
        },
        {
          choirId: coroSantaCecilia.id,
          title: 'Misa Dominical Solemne (11:00 AM)',
          description:
            'Celebración Eucarística Dominical. Llegar 20 minutos antes.',
          location: 'Templo Parroquial San José',
          startAt: new Date('2026-10-25T11:00:00.000Z'),
          endAt: new Date('2026-10-25T12:15:00.000Z'),
          type: 'MASS',
          massScheduleId: massDominical.id,
        },
        {
          choirId: coroSantaCecilia.id,
          title: 'Reunión de Planificación de Adviento y Navidad',
          description:
            'Selección del repertorio de Adviento y Navidad con todo el coro.',
          location: 'Salón Parroquial',
          startAt: new Date('2026-10-28T19:00:00.000Z'),
          endAt: new Date('2026-10-28T20:30:00.000Z'),
          type: 'IMPORTANT_EVENT',
        },
        {
          choirId: coroSantaCecilia.id,
          title: 'Vigilia Solemne de Todos los Santos',
          description:
            'Noche de adoración y canto litúrgico junto a los grupos parroquiales.',
          location: 'Capilla del Santísimo',
          startAt: new Date('2026-10-31T20:00:00.000Z'),
          endAt: new Date('2026-10-31T21:30:00.000Z'),
          type: 'IMPORTANT_EVENT',
        },
      ],
    });
  }

  console.log('✅ Seed completado con éxito (Sistema Completo V2).');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
