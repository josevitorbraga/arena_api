# Arena API - Inicialização do Sistema

## 🚀 Primeira Inicialização em Produção

O sistema Arena API possui um mecanismo automático para resolver o problema de "primeiro acesso" em produção.

### ✅ Inicialização Automática

Quando o servidor inicia pela primeira vez e **não encontra nenhum usuário** no banco de dados, ele automaticamente:

1. **Cria uma unidade padrão:**

   - Nome: "Arena - Unidade Principal"
   - Endereço: "Rua Principal, 123"
   - Cidade: "Cidade Padrão"

2. **Cria um usuário administrador:**
   - **Usuário:** `admin`
   - **Senha:** `admin123`
   - **Permissão:** Admin (nível 1)
   - **Unidades:** Associado à unidade padrão

### 🔑 Credenciais Iniciais

```
Usuário: admin
Senha: admin123
```

> ⚠️ **IMPORTANTE:** Altere essas credenciais imediatamente após o primeiro login!

### 🛠️ Endpoint de Emergência

Caso precise recriar os dados iniciais manualmente, use:

```http
POST /api/initialize
```

**Resposta de sucesso:**

```json
{
  "message": "Sistema inicializado com sucesso!",
  "credentials": {
    "usuario": "admin",
    "senha": "admin123"
  },
  "warning": "IMPORTANTE: Altere essas credenciais após o primeiro login!"
}
```

**Caso já existam usuários:**

```json
{
  "message": "Sistema já possui usuários. Inicialização não é necessária.",
  "existingUsers": 5
}
```

### 📋 Próximos Passos Após Primeiro Login

1. **Alterar credenciais do admin**
2. **Configurar dados da unidade principal:**
   - Nome real da academia
   - Endereço correto
   - Cidade correta
3. **Criar outros usuários** (recepção, professores)
4. **Configurar planos** oferecidos pela academia
5. **Importar dados** existentes (se houver)

### 🔒 Segurança

- O endpoint `/api/initialize` só funciona quando não há usuários no sistema
- As credenciais padrão devem ser alteradas imediatamente
- O sistema de permissões impede acessos não autorizados

### 🐛 Troubleshooting

Se o seed automático falhar:

1. Verifique a conexão com MongoDB
2. Verifique se o usuário do banco tem permissões de escrita
3. Use o endpoint `/api/initialize` manualmente
4. Consulte os logs do servidor para mais detalhes
