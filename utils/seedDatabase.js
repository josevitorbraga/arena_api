import Unidade from '../models/Unidade.js';
import Usuario from '../models/Usuario.js';

const seedDatabase = async () => {
  try {
    // Verifica se já existem usuários no sistema
    const usuarioCount = await Usuario.countDocuments();

    if (usuarioCount > 0) {
      console.log('✅ Sistema já possui usuários. Seed não é necessário.');
      return;
    }

    console.log('🌱 Iniciando seed do banco de dados...');

    // Criar unidade padrão
    const unidadePadrao = new Unidade({
      nome: 'Arena - Jundiaí',
      endereco: 'Av. Manoel Teixeira Cabral, 777',
      cidade: 'Jundiaí',
    });

    await unidadePadrao.save();
    console.log('✅ Unidade padrão criada:', unidadePadrao.nome);

    // Criar usuário admin padrão
    // Nota: A senha será criptografada automaticamente pelo middleware pre('save') do modelo Usuario
    const adminUser = new Usuario({
      nome: 'Administrador',
      usuario: 'admin',
      senha: 'admin123', // Senha em texto plano - será criptografada automaticamente
      permissao: 1, // Admin
      unidades: [unidadePadrao._id],
    });

    await adminUser.save();
    console.log('✅ Usuário admin criado');

    console.log('🎉 Seed concluído com sucesso!');
    console.log('');
    console.log('📋 DADOS DE ACESSO INICIAL:');
    console.log('   Usuário: admin');
    console.log('   Senha: admin123');
    console.log(
      '   ⚠️  IMPORTANTE: Altere essas credenciais após o primeiro login!'
    );
    console.log('');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    throw error;
  }
};

export default seedDatabase;
