import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  DEMO_USERS,
  INITIAL_CATEGORIES,
  INITIAL_SKILLS
} from './data/catalog-seed.js';
import { normalizeSkillQuery } from './services/matching.service.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding database PostgreSQL SkillLoop...');

  for (const cat of INITIAL_CATEGORIES) {
    await prisma.skillCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: {
        id: cat.id,
        name: cat.name,
        slug: cat.slug
      }
    });
  }
  console.log(`✔ ${INITIAL_CATEGORIES.length} kategori skill berhasil disinkronkan.`);

  for (const skill of INITIAL_SKILLS) {
    const upsertedSkill = await prisma.skill.upsert({
      where: { slug: skill.slug },
      update: {
        name: skill.name,
        categoryId: skill.categoryId,
        description: skill.description,
        isActive: true
      },
      create: {
        id: skill.id,
        name: skill.name,
        slug: skill.slug,
        categoryId: skill.categoryId,
        description: skill.description,
        isActive: true
      }
    });

    for (const rawAlias of skill.aliases) {
      const normalized = normalizeSkillQuery(rawAlias);
      await prisma.skillAlias.upsert({
        where: { alias: normalized },
        update: { skillId: upsertedSkill.id },
        create: {
          skillId: upsertedSkill.id,
          alias: normalized
        }
      });
    }
  }
  console.log(`✔ ${INITIAL_SKILLS.length} canonical skills beserta alias berhasil disinkronkan.`);

  const passwordHash = await bcrypt.hash('DemoSkillLoop123!', 10);

  for (const demoUser of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: demoUser.email.toLowerCase() },
      update: {
        displayName: demoUser.displayName,
        username: demoUser.username,
        bio: demoUser.bio,
        timezone: demoUser.timezone,
        isActive: true
      },
      create: {
        id: demoUser.id,
        email: demoUser.email.toLowerCase(),
        passwordHash,
        displayName: demoUser.displayName,
        username: demoUser.username,
        bio: demoUser.bio,
        timezone: demoUser.timezone,
        isActive: true
      }
    });

    for (const lang of demoUser.languages) {
      await prisma.userLanguage.upsert({
        where: {
          userId_languageCode: {
            userId: user.id,
            languageCode: lang.code
          }
        },
        update: { proficiency: lang.proficiency },
        create: {
          userId: user.id,
          languageCode: lang.code,
          proficiency: lang.proficiency
        }
      });
    }

    for (const decl of demoUser.skills) {
      const skill = await prisma.skill.findUnique({
        where: { slug: decl.skillSlug }
      });
      if (!skill) continue;

      await prisma.userSkill.upsert({
        where: {
          userId_skillId_role: {
            userId: user.id,
            skillId: skill.id,
            role: decl.role
          }
        },
        update: {
          proficiencyLevel: decl.proficiencyLevel ?? null,
          targetLevel: decl.targetLevel ?? null,
          description: decl.description
        },
        create: {
          userId: user.id,
          skillId: skill.id,
          role: decl.role,
          proficiencyLevel: decl.proficiencyLevel ?? null,
          targetLevel: decl.targetLevel ?? null,
          description: decl.description
        }
      });
    }
  }

  console.log(`✔ ${DEMO_USERS.length} akun demo PRD berhasil disiapkan (Password: DemoSkillLoop123!).`);
  console.log('🎉 Seeding selesai!');
}

main()
  .catch((err) => {
    console.error('❌ Gagal melakukan seeding:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
