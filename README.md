# WELLWORK 

## Integrantes

### 2TDSPR
| ![Imagem 1](images/foto-felipe.png) |
|-------------------------------------------|
| <p align="center">Felipe Soares Gonçalves</p>|
| <p align="center">RM: 559175</p>|
| <p align="center">[GitHub](https://github.com/felipesoaresg)</p>|
| <p align="center">[Linkedin](https://www.linkedin.com/in/felipe-soares-40bb0125b/)</p>|

| ![Imagem 1](images/foto-henrique.png) |
|-------------------------------------------|
| <p align="center">Henrique Batista de Souza</p>|
| <p align="center">RM: 99742</p> |
| <p align="center">[GitHub](https://github.com/rickfiap)</p>|
| <p align="center">[Linkedin](https://www.linkedin.com/in/henriquebatistadev/)</p>|

| ![Imagem 1](images/foto-julia.png) |
|-------------------------------------------|
| <p align="center">Julia Lima Rodrigues</p>|
| <p align="center">RM: 559781</p> |
| <p align="center">[GitHub](https://github.com/juliafiap)</p>|
| <p align="center">[Linkedin](http://www.linkedin.com/in/julia-rodrigues-a12a3924b)</p>|

## Descrição do Projeto

## Vídeo apresentando projeto 
<a href='https://www.youtube.com/watch?v=1f9n5C1DmuU'>WeelWork Apresentação</a>

### Problema

O ambiente de trabalho moderno, especialmente nos formatos remoto e híbrido, traz desafios significativos para pessoas neurodivergentes ou com deficiência. A falta de acessibilidade digital, excesso de estímulos, dificuldades de organização, comunicação pouco inclusiva e ausência de suporte personalizado geram sobrecarga, queda de produtividade e aumento de estresse.

Atualmente, muitos trabalhadores com doenças neurodivergentes não encontram ferramentas que realmente atendam suas necessidades específicas.

### Funcionalidades

| Funcionalidade | Descrição | Hardware |
|----------------|-----------|----------|
| 📝 **Tarefas** | Lista de tarefas com interface simples e limpa | - |
| 🔔 **Lembretes** | Alertas para pausas, hidratação e compromissos | LED amarelo + Buzzer |
| ⏱️ **Timer de Foco** | Técnica Pomodoro para melhorar concentração | LED verde |
| 🆘 **Botão de Crise** | Suporte imediato em momentos de sobrecarga | Botão físico + LED vermelho |

---

## Arquitetura do Sistema

```
┌─────────────────┐      MQTT       ┌─────────────────┐      MQTT       ┌─────────────────┐
│  Dashboard Web  │◄───────────────►│  Broker HiveMQ  │◄───────────────►│      ESP32      │
│     (React)     │    WebSocket    │    (Gateway)    │      WiFi       │     (Wokwi)     │
└─────────────────┘                 └─────────────────┘                 └─────────────────┘
```

### Tecnologias Utilizadas

| Camada | Tecnologia |
|--------|------------|
| Hardware | ESP32 (simulado no Wokwi) |
| Protocolo | MQTT com mensagens JSON |
| Gateway | Broker HiveMQ público |
| Dashboard | React.js |

---

## 🔧 Componentes de Hardware

| Componente | Pino | Função |
|------------|------|--------|
| Botão vermelho | GPIO 4 | Aciona alerta de crise |
| LED Verde | GPIO 12 | Indica timer de foco ativo |
| LED Amarelo | GPIO 13 | Indica lembrete recebido |
| LED Vermelho | GPIO 14 | Indica estado de crise |
| Buzzer | GPIO 27 | Emite alertas sonoros |

---

## Comunicação MQTT

O sistema utiliza o protocolo MQTT para comunicação em tempo real entre o Dashboard e o ESP32.

### Tópicos Utilizados

| Tópico | Direção | Descrição | Exemplo de Payload |
|--------|---------|-----------|-------------------|
| `wellwork/timer` | Dashboard → ESP32 | Controla o timer de foco | `{"acao": "iniciar", "minutos": 25}` |
| `wellwork/reminder` | Dashboard → ESP32 | Envia lembretes | `{"texto": "Beber água!"}` |
| `wellwork/crisis` | ESP32 → Dashboard | Alerta de crise | `{"tipo": "crise"}` |

---

## Testes e Demonstração

### Teste 1: Conexão do Sistema

**Objetivo:** Verificar se todos os componentes estão conectados.

| Verificação | Resultado Esperado |
|-------------|-------------------|
| Dashboard (canto inferior esquerdo) | Status "Conectado" |
| Wokwi (Serial Monitor) | Mensagem "MQTT conectado!" |

---

### Teste 2: Timer de Foco

**Objetivo:** Demonstrar o funcionamento do timer Pomodoro com feedback no hardware.

| Passo | Ação | Resultado |
|-------|------|-----------|
| 1 | Clicar em "▶ Iniciar" no Dashboard | LED verde acende no ESP32 |
| 2 | Clicar em "⏸ Pausar" | LED verde apaga |
| 3 | Aguardar timer chegar em 00:00 | Buzzer toca 3 vezes |

**Fluxo de dados:**
```
Dashboard → MQTT → ESP32 → LED Verde acende
```

---

### Teste 3: Lembretes

**Objetivo:** Demonstrar o envio de lembretes com feedback visual e sonoro.

| Passo | Ação | Resultado |
|-------|------|-----------|
| 1 | Clicar em "💧 Água" | LED amarelo pisca 3x + buzzer toca |
| 2 | Clicar em "☕ Pausa" | LED amarelo pisca 3x + buzzer toca |
| 3 | Criar lembrete personalizado e clicar "📤" | LED amarelo pisca 3x + buzzer toca |

**Fluxo de dados:**
```
Dashboard → MQTT (wellwork/reminder) → ESP32 → LED Amarelo + Buzzer
```

---

### Teste 4: Botão de Crise

**Objetivo:** Demonstrar o suporte em momentos de sobrecarga emocional.

| Passo | Ação | Resultado |
|-------|------|-----------|
| 1 | Pressionar botão vermelho no Wokwi | LED vermelho acende |
| 2 | - | Modal de crise abre automaticamente no Dashboard |
| 3 | Navegar pelos 5 passos de respiração | Exercícios guiados aparecem |
| 4 | Clicar em "Estou Melhor" | Modal fecha, LED apaga após 10s |

**Fluxo de dados:**
```
ESP32 (botão) → MQTT (wellwork/crisis) → Dashboard → Modal de crise
```

**Os 5 passos do suporte de crise:**
1.  **Respire** - Técnica de respiração 4-4-4
2. **Observe** - Identificar 5 coisas visíveis
3.  **Toque** - Sentir textura de algo próximo
4.  **Ouça** - Identificar 3 sons no ambiente
5.  **Afirme** - Frase de autoafirmação

---

### Teste 5: Tarefas

**Objetivo:** Demonstrar o gerenciamento de tarefas.

| Passo | Ação | Resultado |
|-------|------|-----------|
| 1 | Digitar "Enviar relatório" e clicar "+" | Tarefa aparece na lista |
| 2 | Clicar no checkbox | Tarefa fica riscada (concluída) |
| 3 | Clicar em "✕" | Tarefa é removida da lista |

---

## Resumo da Integração IoT

| Requisito | Implementação |
|-----------|---------------|
| Dispositivo IoT | ESP32 com sensores e atuadores |
| Coleta de dados | Botão de crise detecta interação do usuário |
| Atuadores | LEDs (3 cores) + Buzzer para feedback |
| Comunicação | MQTT com JSON |
| Gateway | Broker HiveMQ público |
| Dashboard | Interface React em tempo real |
| Transmissão | WiFi + WebSocket |

---

## Público-Alvo

- Pessoas com TDAH
- Pessoas com TEA (Transtorno do Espectro Autista)
- Pessoas com ansiedade
- Pessoas com dislexia
- Trabalhadores em home office que buscam melhorar produtividade e bem-estar