import { PrismaClient, TipoUsuario, TipoPessoa, TipoVistoria, StatusVistoria } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // 1. Criar empresa principal
  const empresa = await prisma.empresa.create({
    data: {
      nome: 'Facilita Vistorias Ltda',
      cnpj: '12.345.678/0001-90',
      ativa: true,
    }
  })

  console.log(`✅ Empresa criada: ${empresa.nome}`)

  // 2. Criar usuários (admin e vistoriador)
  const senhaHash = await bcrypt.hash('senha123', 10)

  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@facilitavistorias.com.br',
      nome: 'Administrador Sistema',
      senhaHash,
      tipo: TipoUsuario.ADMIN,
      empresaId: empresa.id,
      ativo: true,
    }
  })

  const vistoriador = await prisma.usuario.create({
    data: {
      email: 'vistoriador@facilitavistorias.com.br',
      nome: 'Osmar Gonçalves',
      senhaHash,
      tipo: TipoUsuario.VISTORIADOR,
      empresaId: empresa.id,
      ativo: true,
    }
  })

  console.log(`✅ Usuários criados: ${admin.nome}, ${vistoriador.nome}`)

  // 3. Criar imóveis de exemplo
  const imoveis = await Promise.all([
    prisma.imovel.create({
      data: {
        endereco: 'Rua das Flores',
        numero: '123',
        bairro: 'Centro',
        cidade: 'Blumenau',
        estado: 'SC',
        cep: '89010000',
        empresaId: empresa.id,
      }
    }),
    prisma.imovel.create({
      data: {
        endereco: 'Avenida Beira Rio',
        numero: '456',
        complemento: 'Ap 302',
        bairro: 'Velha',
        cidade: 'Blumenau',
        estado: 'SC',
        cep: '89012000',
        empresaId: empresa.id,
      }
    }),
    prisma.imovel.create({
      data: {
        endereco: 'Rua XV de Novembro',
        numero: '789',
        bairro: 'Itoupava Seca',
        cidade: 'Blumenau',
        estado: 'SC',
        cep: '89015000',
        empresaId: empresa.id,
      }
    })
  ])

  console.log(`✅ ${imoveis.length} imóveis criados`)

  // 4. Criar pessoas (locadores e locatários)
  const pessoas = await Promise.all([
    // Locador do primeiro imóvel
    prisma.pessoa.create({
      data: {
        nome: 'João Silva',
        email: 'joao.silva@email.com',
        telefone: '(47) 99999-1111',
        documento: '123.456.789-00',
        tipo: TipoPessoa.LOCADOR,
        imovelId: imoveis[0].id,
      }
    }),
    // Locatário do primeiro imóvel
    prisma.pessoa.create({
      data: {
        nome: 'Maria Santos',
        email: 'maria.santos@email.com',
        telefone: '(47) 99999-2222',
        documento: '987.654.321-00',
        tipo: TipoPessoa.LOCATARIO,
        imovelId: imoveis[0].id,
      }
    }),
    // Locador do segundo imóvel
    prisma.pessoa.create({
      data: {
        nome: 'Carlos Oliveira',
        email: 'carlos.oliveira@email.com',
        telefone: '(47) 99999-3333',
        documento: '111.222.333-44',
        tipo: TipoPessoa.LOCADOR,
        imovelId: imoveis[1].id,
      }
    }),
    // Proprietário do terceiro imóvel (compra segura)
    prisma.pessoa.create({
      data: {
        nome: 'Ana Souza',
        email: 'ana.souza@email.com',
        telefone: '(47) 99999-4444',
        documento: '555.666.777-88',
        tipo: TipoPessoa.PROPRIETARIO,
        imovelId: imoveis[2].id,
      }
    })
  ])

  console.log(`✅ ${pessoas.length} pessoas criadas`)

  // 5. Criar vistorias agendadas
  const hoje = new Date()
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)

  const vistorias = await Promise.all([
    // Vistoria de entrada agendada para amanhã
    prisma.vistoria.create({
      data: {
        codigo: `VIST-${Date.now()}-001`,
        tipo: TipoVistoria.ENTRADA,
        data: amanha,
        status: StatusVistoria.AGENDADA,
        imovelId: imoveis[0].id,
        empresaId: empresa.id,
        usuarioId: vistoriador.id,
      }
    }),
    // Vistoria de saída para daqui a 3 dias
    prisma.vistoria.create({
      data: {
        codigo: `VIST-${Date.now()}-002`,
        tipo: TipoVistoria.SAIDA,
        data: new Date(hoje.setDate(hoje.getDate() + 3)),
        status: StatusVistoria.AGENDADA,
        imovelId: imoveis[1].id,
        empresaId: empresa.id,
        usuarioId: vistoriador.id,
      }
    })
  ])

  console.log(`✅ ${vistorias.length} vistorias agendadas`)

  // 6. Criar ambientes e itens para a primeira vistoria
  const ambientes = await Promise.all([
    prisma.ambiente.create({
      data: {
        nome: 'Sala',
        ordem: 1,
        vistoriaId: vistorias[0].id,
      }
    }),
    prisma.ambiente.create({
      data: {
        nome: 'Cozinha',
        ordem: 2,
        vistoriaId: vistorias[0].id,
      }
    }),
    prisma.ambiente.create({
      data: {
        nome: 'Banheiro Social',
        ordem: 3,
        vistoriaId: vistorias[0].id,
      }
    })
  ])

  console.log(`✅ ${ambientes.length} ambientes criados`)

  // Criar alguns itens em cada ambiente
  const itens = await Promise.all([
    // Itens da sala
    prisma.item.create({
      data: {
        nome: 'Piso',
        descricao: 'Piso cerâmico',
        ambienteId: ambientes[0].id,
      }
    }),
    prisma.item.create({
      data: {
        nome: 'Paredes',
        descricao: 'Paredes pintadas',
        ambienteId: ambientes[0].id,
      }
    }),
    // Itens da cozinha
    prisma.item.create({
      data: {
        nome: 'Pia',
        descricao: 'Pia de inox',
        ambienteId: ambientes[1].id,
      }
    }),
    prisma.item.create({
      data: {
        nome: 'Armários',
        descricao: 'Armários de madeira',
        ambienteId: ambientes[1].id,
      }
    }),
  ])

  console.log(`✅ ${itens.length} itens criados`)

  console.log('🌱 Seed completo!')
  console.log('📊 Resumo:')
  console.log(`   • Empresas: 1`)
  console.log(`   • Usuários: 2`)
  console.log(`   • Imóveis: 3`)
  console.log(`   • Pessoas: 4`)
  console.log(`   • Vistorias: 2`)
  console.log(`   • Ambientes: 3`)
  console.log(`   • Itens: 4`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })