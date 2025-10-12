# 💰 Sistema Simplificado de Comissões

## 📋 Resumo das Alterações

Sistema de comissões **totalmente simplificado**:

- ❌ Removidos campos `percentualComissao` e `expediente`
- ✅ Comissão = valor integral da aula (`valorAula`)
- ✅ Sistema mais direto e transparente

## 🔧 Alterações Implementadas

### **1. Campos Removidos do Usuario**

```javascript
// REMOVIDOS:
// percentualComissao: { type: Number }
// expediente: [{ horaInicio, horaFim }]

// MANTIDO APENAS:
valorAula: {
  type: Number,
  required: function () {
    return this.permissao === 3; // Apenas professores
  },
  min: 0,
  validate: {
    validator: function (v) {
      return this.permissao !== 3 || (v && v > 0);
    },
    message: 'Valor da aula deve ser maior que zero para professores',
  },
}
```

### **2. Sistema de Comissões Simplificado**

#### **ANTES (Sistema Complexo):**

```javascript
// Cálculo baseado em percentual do plano do aluno
comissao = (valorPlano / quantidadeAulas) * percentualProfessor / 100

// Múltiplos tipos de comissão:
- Comissão de venda (percentual sobre plano)
- Comissão de avaliação (percentual sobre avaliação)
- Comissão de aula (percentual sobre valor dividido por aulas)
```

#### **DEPOIS (Sistema Direto):**

```javascript
// Professor recebe o valor integral da aula
comissao = valorAula

// Apenas um tipo de comissão:
- Comissão por aula ministrada (valor fixo)
```

#### **Comissões Mensais** (`utils/distribComissoesMes.js`)

- Mesma lógica aplicada ao cálculo de comissões mensais
- Simplificação da função `calcularComissao`

## 💡 **Vantagens do Novo Sistema**

### **Flexibilidade**

- Cada professor pode ter um valor específico por aula
- Valores independentes do plano do aluno
- Facilita gestão de professores com diferentes níveis/especialidades

### **Simplicidade**

- Cálculo mais direto: `valorAula * percentual / 100`
- Menos dependência do valor do plano do aluno
- Melhor controle sobre pagamentos

### **Transparência**

- Professor sabe exatamente quanto receberá por aula
- Cálculos mais previsíveis
- Facilita planejamento financeiro

## 🔄 **Tipos de Comissão Mantidos**

### **Por Aula Ministrada** (Novo sistema)

- Baseado no `valorAula` do professor
- Aplicado automaticamente via cron job
- Cálculo: `valorAula * percentualComissao / 100`

### **Por Venda** (Sistema anterior mantido)

- Baseado no valor do plano vendido
- Para funcionários da recepção
- Cálculo: `valorPlano * percentualComissao / 100`

### **Por Avaliação** (Sistema anterior mantido)

- Baseado no valor da avaliação física
- Para professores que fazem avaliações
- Cálculo: `valorAvaliacao * percentualComissao / 100`

## 🚀 **Como Usar**

### **1. Cadastrando Professores**

```json
{
  "nome": "Professor João",
  "usuario": "prof.joao",
  "senha": "senha123",
  "permissao": 3,
  "percentualComissao": 80,
  "valorAula": 50.00,
  "expediente": [...]
}
```

### **2. Funcionamento Automático**

- Cron job diário às 23:40
- Calcula comissões automaticamente
- Usa o `valorAula` definido para cada professor
- Aplica o `percentualComissao` sobre o valor da aula

## ⚠️ **Migração**

### **Professores Existentes**

- Precisarão ter o campo `valorAula` preenchido
- Campo é obrigatório para permissao === 3
- Validação impede valores zero ou negativos

### **Retrocompatibilidade**

- Comissões de venda e avaliação mantêm lógica anterior
- Apenas comissões por aula ministrada usam novo cálculo

## 📊 **Exemplo Prático**

**Configuração do Professor:**

- valorAula: R$ 60,00
- percentualComissao: 75%

**Cálculo da Comissão:**

- Comissão por aula = R$ 60,00 × 75% = R$ 45,00

**Vantagem:**

- Independe do plano do aluno (R$ 150, R$ 200, etc.)
- Professor sempre recebe R$ 45,00 por aula ministrada
- Cálculo consistente e previsível
