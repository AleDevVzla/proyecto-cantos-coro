import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
}

async function main() {
  console.log('🌱 Iniciando seed de Base de Datos (Versión 1)...');

  const existingChoirs = await prisma.choir.count();
  if (existingChoirs > 0) {
    console.log('✅ La base de datos ya contiene datos iniciales. Saltando seed.');
    return;
  }

  const defaultPass = await hashPassword('123456');

  // 1. Crear dos coros para demostrar el alcance privado vs público entre coros
  const coroSantaCecilia = await prisma.choir.create({
    data: {
      name: 'Coro Santa Cecilia',
      parish: 'Parroquia San José',
      inviteCode: 'CECILIA-2026',
    },
  });

  const coroSanMiguel = await prisma.choir.create({
    data: {
      name: 'Coro San Miguel Arcángel',
      parish: 'Parroquia Cristo Rey',
      inviteCode: 'MIGUEL-2026',
    },
  });

  // 2. Crear usuarios con roles DIRECTOR y MEMBER
  const directorAlejandro = await prisma.user.create({
    data: {
      email: 'director@santacecilia.org',
      name: 'Alejandro Morales (Director)',
      passwordHash: defaultPass,
      memberships: {
        create: {
          choirId: coroSantaCecilia.id,
          role: 'DIRECTOR',
          instrument: 'Guitarra y Dirección',
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'miembro@santacecilia.org',
      name: 'María Fernanda (Soprano)',
      passwordHash: defaultPass,
      memberships: {
        create: {
          choirId: coroSantaCecilia.id,
          role: 'MEMBER',
          instrument: 'Voz Soprano',
        },
      },
    },
  });

  const directorCarlos = await prisma.user.create({
    data: {
      email: 'director@sanmiguel.org',
      name: 'Carlos Mendoza (Director)',
      passwordHash: defaultPass,
      memberships: {
        create: {
          choirId: coroSanMiguel.id,
          role: 'DIRECTOR',
          instrument: 'Teclado y Dirección',
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'miembro@sanmiguel.org',
      name: 'Lucía Gómez (Contralto)',
      passwordHash: defaultPass,
      memberships: {
        create: {
          choirId: coroSanMiguel.id,
          role: 'MEMBER',
          instrument: 'Voz Contralto',
        },
      },
    },
  });

  // 3. Crear repertorio completo cubriendo los 5 tiempos litúrgicos y Litúrgico / No litúrgico
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

  console.log('✅ Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
