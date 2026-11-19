import { PrismaClient, ClientType, UserType, OccurrenceStatus, Priority, RiskLevel } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Criar Pool Lowdataesc
  const pool = await prisma.poolLowdataesc.upsert({
    where: { name: 'pool-nacional' },
    update: {},
    create: {
      name: 'pool-nacional',
      description: 'Pool soberano para contas segregadas lowdataesc',
      consortiumId: 'cio-sp', // Será atualizado após criar consórcio
      isActive: true,
      rateLimitPerMinute: 10000,
      storageQuotaGB: 1000,
      computeQuota: 100
    }
  });

  // Criar Consórcios
  const cioSp = await prisma.consortium.upsert({
    where: { cnpj: '04.347.777/0001-00' },
    update: {},
    create: {
      id: 'cio-sp',
      name: 'Consórcio Intermunicipal do Oeste Paulista',
      shortName: 'CIOP',
      cnpj: '04.347.777/0001-00',
      state: 'SP',
      region: 'Sudeste',
      isActive: true,
      defaultSlaHours: 24,
      maxPriorityScore: 100
    }
  });

  const cimgaMg = await prisma.consortium.upsert({
    where: { cnpj: '05.348.888/0001-00' },
    update: {},
    create: {
      id: 'cimga-mg',
      name: 'Consórcio Intermunicipal da Microrregião de Alfenas',
      shortName: 'CIMGA',
      cnpj: '05.348.888/0001-00',
      state: 'MG',
      region: 'Sudeste',
      isActive: true,
      defaultSlaHours: 24,
      maxPriorityScore: 100
    }
  });

  const amuresSc = await prisma.consortium.upsert({
    where: { cnpj: '06.349.999/0001-00' },
    update: {},
    create: {
      id: 'amures-sc',
      name: 'Associação dos Municípios da Região Serrana',
      shortName: 'AMURES',
      cnpj: '06.349.999/0001-00',
      state: 'SC',
      region: 'Sul',
      isActive: true,
      defaultSlaHours: 24,
      maxPriorityScore: 100
    }
  });

  // Atualizar pool com consortiumId correto
  await prisma.poolLowdataesc.update({
    where: { id: pool.id },
    data: { consortiumId: cioSp.id }
  });

  // Criar Municípios para CIOP-SP
  const municipalitiesSp = [
    { ibgeCode: '3509502', name: 'Presidente Prudente', state: 'SP', region: 'Sudeste', population: 220000, areaKm2: 562.5 },
    { ibgeCode: '3509601', name: 'Álvaro de Carvalho', state: 'SP', region: 'Sudeste', population: 5000, areaKm2: 81.2 },
    { ibgeCode: '3509700', name: 'Anhembi', state: 'SP', region: 'Sudeste', population: 6000, areaKm2: 734.4 },
    { ibgeCode: '3509809', name: 'Estrela do Norte', state: 'SP', region: 'Sudeste', population: 3000, areaKm2: 188.9 },
    { ibgeCode: '3509908', name: 'Iepê', state: 'SP', region: 'Sudeste', population: 8000, areaKm2: 155.6 }
  ];

  for (const mun of municipalitiesSp) {
    await prisma.municipality.upsert({
      where: { ibgeCode: mun.ibgeCode },
      update: {},
      create: {
        id: `${mun.ibgeCode}-${cioSp.id}`,
        ...mun,
        consortiumId: cioSp.id
      }
    });
  }

  // Criar Municípios para CIMGA-MG
  const municipalitiesMg = [
    { ibgeCode: '3101608', name: 'Alfenas', state: 'MG', region: 'Sudeste', population: 75000, areaKm2: 851.0 },
    { ibgeCode: '3101707', name: 'Alterosa', state: 'MG', region: 'Sudeste', population: 14000, areaKm2: 365.0 },
    { ibgeCode: '3101806', name: 'Arenópolis', state: 'MG', region: 'Sudeste', population: 8000, areaKm2: 270.0 }
  ];

  for (const mun of municipalitiesMg) {
    await prisma.municipality.upsert({
      where: { ibgeCode: mun.ibgeCode },
      update: {},
      create: {
        id: `${mun.ibgeCode}-${cimgaMg.id}`,
        ...mun,
        consortiumId: cimgaMg.id
      }
    });
  }

  // Criar Municípios para AMURES-SC
  const municipalitiesSc = [
    { ibgeCode: '4205407', name: 'Lages', state: 'SC', region: 'Sul', population: 160000, areaKm2: 2651.0 },
    { ibgeCode: '4205456', name: 'Correia Pinto', state: 'SC', region: 'Sul', population: 15000, areaKm2: 620.0 },
    { ibgeCode: '4205506', name: 'São Joaquim', state: 'SC', region: 'Sul', population: 25000, areaKm2: 1886.0 }
  ];

  for (const mun of municipalitiesSc) {
    await prisma.municipality.upsert({
      where: { ibgeCode: mun.ibgeCode },
      update: {},
      create: {
        id: `${mun.ibgeCode}-${amuresSc.id}`,
        ...mun,
        consortiumId: amuresSc.id
      }
    });
  }

  // Criar Categorias
  const categories = [
    { code: 'BURACO', name: 'Buraco na Via', description: 'Buracos e crateras em vias públicas' },
    { code: 'ILUMINACAO', name: 'Iluminação Pública', description: 'Problemas com iluminação pública' },
    { code: 'LIMPEZA', name: 'Limpeza Urbana', description: 'Acúmulo de lixo, entulho e sujeira' },
    { code: 'AGUA', name: 'Água e Esgoto', description: 'Vazamentos, falta d`água, esgoto a céu aberto' },
    { code: 'ARVORE', name: 'Arborição', description: 'Podas, árvores caídas, galhos perigosos' },
    { code: 'TRANSITO', name: 'Trânsito', description: 'Sinalização, semáforos, placas danificadas' },
    { code: 'CALCADA', name: 'Calçada', description: 'Calçadas danificadas, falta de acessibilidade' },
    { code: 'OUTRO', name: 'Outros', description: 'Outras ocorrências não categorizadas' }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: {},
      create: {
        ...cat,
        isActive: true
      }
    });
  }

  // Criar Subcategorias
  const subcategories = [
    { categoryCode: 'BURACO', code: 'GRANDE', name: 'Buraco Grande (>30cm)', description: 'Buracos com mais de 30cm de profundidade' },
    { categoryCode: 'BURACO', code: 'PEQUENO', name: 'Buraco Pequeno (<30cm)', description: 'Buracos com menos de 30cm de profundidade' },
    { categoryCode: 'ILUMINACAO', code: 'APAGADA', name: 'Lâmpada Apagada', description: 'Lâmpada queimada ou não funcionando' },
    { categoryCode: 'ILUMINACAO', code: 'PISCA_PISCA', name: 'Lâmpada Piscando', description: 'Lâmpada com funcionamento intermitente' },
    { categoryCode: 'LIMPEZA', code: 'ENTULHO', name: 'Entulho', description: 'Acúmulo de entulho e materiais de construção' },
    { categoryCode: 'LIMPEZA', code: 'LIXO', name: 'Lixo Acumulado', description: 'Acúmulo de lixo doméstico' },
    { categoryCode: 'AGUA', code: 'VAZAMENTO', name: 'Vazamento de Água', description: 'Vazamento visível na rede de água' },
    { categoryCode: 'AGUA', code: 'ESGOTO', name: 'Esgoto a Céu Aberto', description: 'Escoamento de esgoto sem tratamento' }
  ];

  for (const sub of subcategories) {
    const category = await prisma.category.findUnique({ where: { code: sub.categoryCode } });
    if (category) {
      await prisma.subcategory.upsert({
        where: { categoryId_code: { categoryId: category.id, code: sub.code } },
        update: {},
        create: {
          categoryId: category.id,
          code: sub.code,
          name: sub.name,
          description: sub.description,
          isActive: true
        }
      });
    }
  }

  // Criar Clientes (Prefeituras e Concessionárias)
  const clients = [
    { name: 'Prefeitura de Presidente Prudente', clientType: ClientType.PREFEITURA, cnpj: '45.345.678/0001-00', consortiumId: cioSp.id, municipalityCode: '3509502', slaHours: 12, priorityWeight: 1.5 },
    { name: 'Prefeitura de Alfenas', clientType: ClientType.PREFEITURA, cnpj: '46.346.789/0001-00', consortiumId: cimgaMg.id, municipalityCode: '3101608', slaHours: 12, priorityWeight: 1.5 },
    { name: 'Prefeitura de Lages', clientType: ClientType.PREFEITURA, cnpj: '47.347.890/0001-00', consortiumId: amuresSc.id, municipalityCode: '4205407', slaHours: 12, priorityWeight: 1.5 },
    { name: 'SABESP', clientType: ClientType.CONCESSIONARIA, cnpj: '03.646.020/0001-33', consortiumId: cioSp.id, slaHours: 6, priorityWeight: 2.0 },
    { name: 'Energisa', clientType: ClientType.CONCESSIONARIA, cnpj: '03.902.000/0001-05', consortiumId: cioSp.id, slaHours: 4, priorityWeight: 2.5 }
  ];

  for (const client of clients) {
    let municipalityId: string | undefined;
    if (client.municipalityCode) {
      const mun = await prisma.municipality.findFirst({
        where: { ibgeCode: client.municipalityCode, consortiumId: client.consortiumId }
      });
      municipalityId = mun?.id;
    }

    await prisma.client.upsert({
      where: { cnpj: client.cnpj! },
      update: {},
      create: {
        name: client.name,
        clientType: client.clientType,
        cnpj: client.cnpj,
        consortiumId: client.consortiumId,
        municipalityId,
        slaHours: client.slaHours,
        priorityWeight: client.priorityWeight,
        isActive: true
      }
    });
  }

  // Criar Matriz de Competências
  const competenceMatrix = [
    { consortiumId: cioSp.id, categoryCode: 'BURACO', clientType: ClientType.PREFEITURA },
    { consortiumId: cioSp.id, categoryCode: 'ILUMINACAO', clientType: ClientType.PREFEITURA },
    { consortiumId: cioSp.id, categoryCode: 'LIMPEZA', clientType: ClientType.PREFEITURA },
    { consortiumId: cioSp.id, categoryCode: 'CALCADA', clientType: ClientType.PREFEITURA },
    { consortiumId: cioSp.id, categoryCode: 'AGUA', clientType: ClientType.CONCESSIONARIA, clientName: 'SABESP' },
    { consortiumId: cioSp.id, categoryCode: 'TRANSITO', clientType: ClientType.PREFEITURA },
    { consortiumId: cimgaMg.id, categoryCode: 'BURACO', clientType: ClientType.PREFEITURA },
    { consortiumId: cimgaMg.id, categoryCode: 'ILUMINACAO', clientType: ClientType.PREFEITURA },
    { consortiumId: amuresSc.id, categoryCode: 'BURACO', clientType: ClientType.PREFEITURA }
  ];

  for (const cm of competenceMatrix) {
    const category = await prisma.category.findUnique({ where: { code: cm.categoryCode } });
    if (!category) continue;

    let clientId: string | undefined;
    if (cm.clientName) {
      const client = await prisma.client.findFirst({
        where: { name: cm.clientName, consortiumId: cm.consortiumId }
      });
      clientId = client?.id;
    } else {
      const client = await prisma.client.findFirst({
        where: { clientType: cm.clientType, consortiumId: cm.consortiumId }
      });
      clientId = client?.id;
    }

    if (clientId) {
      await prisma.competenceMatrix.upsert({
        where: { consortiumId_clientId_categoryId: { consortiumId: cm.consortiumId, clientId, categoryId: category.id } },
        update: {},
        create: {
          consortiumId: cm.consortiumId,
          clientId,
          categoryId: category.id,
          isResponsible: true,
          priorityScore: 50
        }
      });
    }
  }

  // Criar Usuários Admin
  const adminNacional = await prisma.user.upsert({
    where: { email: 'admin@zela.gov.br' },
    update: {},
    create: {
      email: 'admin@zela.gov.br',
      name: 'Administrador Nacional',
      passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H3.GJ8K5v5z4L1Z8J7g1v2x3y4z', // senha: admin123
      userType: UserType.ADMIN_NACIONAL,
      isActive: true
    }
  });

  const adminCiop = await prisma.user.upsert({
    where: { email: 'admin@cio-sp.gov.br' },
    update: {},
    create: {
      email: 'admin@cio-sp.gov.br',
      name: 'Administrador CIOP',
      passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H3.GJ8K5v5z4L1Z8J7g1v2x3y4z',
      userType: UserType.ADMIN_CONSORCIO,
      consortiumId: cioSp.id,
      isActive: true
    }
  });

  const adminPrefeituraPp = await prisma.user.upsert({
    where: { email: 'admin@prudente.sp.gov.br' },
    update: {},
    create: {
      email: 'admin@prudente.sp.gov.br',
      name: 'Administrador Prefeitura Presidente Prudente',
      passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mrq4H3.GJ8K5v5z4L1Z8J7g1v2x3y4z',
      userType: UserType.ADMIN_PREFEITURA,
      consortiumId: cioSp.id,
      clientId: (await prisma.client.findFirst({ where: { name: 'Prefeitura de Presidente Prudente' } }))?.id,
      isActive: true
    }
  });

  // Criar Permissões
  const permissions = [
    { code: 'occurrence:create', name: 'Criar Ocorrência', resource: 'occurrence', action: 'create' },
    { code: 'occurrence:read', name: 'Visualizar Ocorrência', resource: 'occurrence', action: 'read' },
    { code: 'occurrence:update', name: 'Atualizar Ocorrência', resource: 'occurrence', action: 'update' },
    { code: 'occurrence:delete', name: 'Deletar Ocorrência', resource: 'occurrence', action: 'delete' },
    { code: 'occurrence:assign', name: 'Atribuir Ocorrência', resource: 'occurrence', action: 'assign' },
    { code: 'occurrence:resolve', name: 'Resolver Ocorrência', resource: 'occurrence', action: 'resolve' },
    { code: 'user:create', name: 'Criar Usuário', resource: 'user', action: 'create' },
    { code: 'user:read', name: 'Visualizar Usuário', resource: 'user', action: 'read' },
    { code: 'user:update', name: 'Atualizar Usuário', resource: 'user', action: 'update' },
    { code: 'user:delete', name: 'Deletar Usuário', resource: 'user', action: 'delete' },
    { code: 'report:view', name: 'Visualizar Relatórios', resource: 'report', action: 'read' },
    { code: 'dashboard:view', name: 'Visualizar Dashboard', resource: 'dashboard', action: 'read' },
    { code: 'settings:manage', name: 'Gerenciar Configurações', resource: 'settings', action: 'manage' },
    { code: 'billing:view', name: 'Visualizar Faturamento', resource: 'billing', action: 'read' },
    { code: 'audit:view', name: 'Visualizar Auditoria', resource: 'audit', action: 'read' }
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm
    });
  }

  // Criar Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrador com acesso total',
      isSystem: true
    }
  });

  const fiscalRole = await prisma.role.upsert({
    where: { name: 'FISCAL' },
    update: {},
    create: {
      name: 'FISCAL',
      description: 'Fiscal de campo',
      isSystem: true
    }
  });

  const tecnicoRole = await prisma.role.upsert({
    where: { name: 'TECNICO' },
    update: {},
    create: {
      name: 'TECNICO',
      description: 'Técnico operacional',
      isSystem: true
    }
  });

  // Associar permissões aos roles
  const allPermissions = await prisma.permission.findMany();
  
  // ADMIN tem todas as permissões
  for (const perm of allPermissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm
    });
    await prisma.role.update({
      where: { id: adminRole.id },
      data: { permissions: { connect: { id: perm.id } } }
    });
  }

  // FISCAL tem permissões de visualização e resolução
  const fiscalPermissions = ['occurrence:read', 'occurrence:update', 'occurrence:resolve', 'report:view', 'dashboard:view'];
  for (const code of fiscalPermissions) {
    const perm = await prisma.permission.findUnique({ where: { code } });
    if (perm) {
      await prisma.role.update({
        where: { id: fiscalRole.id },
        data: { permissions: { connect: { id: perm.id } } }
      });
    }
  }

  // TECNICO tem permissões de criação e atualização
  const tecnicoPermissions = ['occurrence:create', 'occurrence:read', 'occurrence:update', 'occurrence:assign'];
  for (const code of tecnicoPermissions) {
    const perm = await prisma.permission.findUnique({ where: { code } });
    if (perm) {
      await prisma.role.update({
        where: { id: tecnicoRole.id },
        data: { permissions: { connect: { id: perm.id } } }
      });
    }
  }

  // Associar roles aos usuários
  await prisma.user.update({
    where: { id: adminNacional.id },
    data: { roles: { connect: { id: adminRole.id } } }
  });

  await prisma.user.update({
    where: { id: adminCiop.id },
    data: { roles: { connect: { id: adminRole.id } } }
  });

  await prisma.user.update({
    where: { id: adminPrefeituraPp.id },
    data: { roles: { connect: { id: adminRole.id } } }
  });

  // Criar Workflow padrão
  const workflow = await prisma.workflow.upsert({
    where: { name: 'Padrão Nacional' },
    update: {},
    create: {
      name: 'Padrão Nacional',
      description: 'Workflow padrão para ocorrências nacionais',
      version: 1,
      isActive: true,
      definition: {
        steps: [
          { name: 'Recebimento', type: 'intake', order: 1 },
          { name: 'Classificação', type: 'classification', order: 2 },
          { name: 'Roteamento', type: 'routing', order: 3 },
          { name: 'Atribuição', type: 'assignment', order: 4 },
          { name: 'Execução', type: 'execution', order: 5 },
          { name: 'Verificação', type: 'verification', order: 6 },
          { name: 'Encerramento', type: 'closure', order: 7 }
        ]
      }
    }
  });

  // Criar Integrações Externas
  const integrations = [
    { name: 'Gov.br', provider: 'GOV_BR', config: { clientId: 'zela-nacional', redirectUri: 'https://zela.gov.br/auth/callback' }, isActive: true },
    { name: 'WhatsApp Business API', provider: 'WHATSAPP_BUSINESS', config: { phoneNumberId: '123456789', accessToken: 'token-placeholder' }, isActive: false },
    { name: 'IBGE API', provider: 'IBGE', config: { baseUrl: 'https://servicodados.ibge.gov.br/api/v1' }, isActive: true },
    { name: 'OpenStreetMap', provider: 'OPENSTREETMAP', config: { baseUrl: 'https://nominatim.openstreetmap.org' }, isActive: true },
    { name: 'PIX', provider: 'PIX', config: { key: 'pix-placeholder' }, isActive: false }
  ];

  for (const int of integrations) {
    await prisma.externalIntegration.upsert({
      where: { name: int.name },
      update: {},
      create: int
    });
  }

  // Criar ocorrências de exemplo
  const ppMunicipality = await prisma.municipality.findFirst({
    where: { ibgeCode: '3509502' }
  });

  const buracoCategory = await prisma.category.findUnique({ where: { code: 'BURACO' } });
  const grandeSubcategory = await prisma.subcategory.findFirst({
    where: { categoryId: buracoCategory?.id, code: 'GRANDE' }
  });

  const prefPp = await prisma.client.findFirst({
    where: { name: 'Prefeitura de Presidente Prudente' }
  });

  if (ppMunicipality && buracoCategory && grandeSubcategory && prefPp) {
    for (let i = 1; i <= 10; i++) {
      await prisma.occurrence.upsert({
        where: { protocol: `ZEL-2024-000${i}` },
        update: {},
        create: {
          protocol: `ZEL-2024-000${i}`,
          title: `Buraco na Rua ${i}`,
          description: `Buraco grande na Rua das Flores, ${i} com Av. Principal`,
          status: i % 2 === 0 ? OccurrenceStatus.RESOLVED : OccurrenceStatus.PENDING,
          priority: i <= 3 ? Priority.HIGH : Priority.NORMAL,
          riskLevel: RiskLevel.MEDIUM,
          categoryId: buracoCategory.id,
          subcategoryId: grandeSubcategory.id,
          latitude: -22.1234 + (i * 0.001),
          longitude: -51.3456 + (i * 0.001),
          address: `Rua das Flores, ${i}, Centro, Presidente Prudente - SP`,
          referencePoint: `Próximo ao Mercado Municipal`,
          censusSectorId: ppMunicipality.id,
          municipalityId: ppMunicipality.id,
          consortiumId: cioSp.id,
          clientId: prefPp.id,
          routedBy: i % 2 === 0 ? RoutingSource.AUTO : RoutingSource.MANUAL,
          confidenceScore: 0.95,
          explanation: 'Buraco classificado como grande com base na imagem fornecida',
          workflowId: workflow.id,
          workflowState: 'Roteamento',
          assignedUserId: i % 2 === 0 ? adminPrefeituraPp.id : undefined,
          slaHours: 12,
          slaDeadline: new Date(Date.now() + (12 * 60 * 60 * 1000)),
          createdBy: adminCiop.id
        }
      });
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
