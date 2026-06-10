<template>
  <main class="journey-page">
    <section class="journey-hero">
      <div class="journey-hero__content">
        <p class="journey-eyebrow">Minha jornada</p>

        <div class="journey-hero__top">
          <div>
            <h1>Seu caminho no seConecta</h1>
            <p>
              Um espaço para transformar oportunidades, prazos e interesses em próximos passos
              simples — com você no controle da própria trajetória.
            </p>
          </div>

          <button class="ghost-action" @click="showAutonomyPanel = !showAutonomyPanel">
            {{ showAutonomyPanel ? 'Fechar controle' : 'Ajustar minha jornada' }}
          </button>
        </div>

        <div class="journey-stage-card">
          <div>
            <span class="stage-label">Você está em</span>
            <strong>{{ currentStage.title }}</strong>
            <p>{{ currentStage.description }}</p>
          </div>

          <div class="stage-progress">
            <span>{{ currentStage.progress }}%</span>
            <div class="stage-progress__bar">
              <div :style="{ width: `${currentStage.progress}%` }" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="showAutonomyPanel" class="autonomy-panel">
      <div class="section-heading">
        <p>Controle da jornada</p>
        <h2>Você escolhe como quer ser acompanhado</h2>
      </div>

      <div class="autonomy-grid">
        <article class="control-card">
          <span class="control-card__icon">🎯</span>
          <h3>Foco atual</h3>
          <p>Escolha o tipo de caminho que faz mais sentido agora.</p>

          <div class="pill-group">
            <button
              v-for="focus in focusOptions"
              :key="focus.key"
              class="select-pill"
              :class="{ 'select-pill--active': selectedFocus === focus.key }"
              @click="selectedFocus = focus.key"
            >
              {{ focus.label }}
            </button>
          </div>
        </article>

        <article class="control-card">
          <span class="control-card__icon">⏱️</span>
          <h3>Ritmo</h3>
          <p>Defina se quer passos leves ou um acompanhamento mais direto.</p>

          <div class="pill-group">
            <button
              v-for="pace in paceOptions"
              :key="pace.key"
              class="select-pill"
              :class="{ 'select-pill--active': selectedPace === pace.key }"
              @click="selectedPace = pace.key"
            >
              {{ pace.label }}
            </button>
          </div>
        </article>

        <article class="control-card">
          <span class="control-card__icon">🔔</span>
          <h3>Lembretes</h3>
          <p>Controle o quanto o seConecta deve te lembrar dos próximos prazos.</p>

          <div class="toggle-row">
            <div>
              <strong>Lembretes inteligentes</strong>
              <span>{{ remindersEnabled ? 'Ativados' : 'Pausados' }}</span>
            </div>

            <button
              class="switch"
              :class="{ 'switch--on': remindersEnabled }"
              @click="remindersEnabled = !remindersEnabled"
              aria-label="Alternar lembretes"
            >
              <span />
            </button>
          </div>
        </article>
      </div>
    </section>

    <section class="journey-grid">
      <div class="journey-main">
        <article class="next-step-card">
          <div class="next-step-card__header">
            <div>
              <p class="soft-badge">Próximo passo de hoje</p>
              <h2>{{ mainStep.title }}</h2>
            </div>

            <span class="time-chip">{{ mainStep.time }}</span>
          </div>

          <p>{{ mainStep.description }}</p>

          <div class="why-box">
            <strong>Por que isso apareceu?</strong>
            <span>{{ mainStep.reason }}</span>
          </div>

          <div class="next-step-card__actions">
            <button class="primary-btn" @click="completeMainStep">
              {{ mainStepDone ? 'Concluído' : 'Fazer agora' }}
            </button>

            <button class="secondary-btn" @click="rotateMainStep">
              Trocar sugestão
            </button>
          </div>
        </article>

        <section class="daily-section">
          <div class="section-heading section-heading--inline">
            <div>
              <p>Atividades de hoje</p>
              <h2>3 passos pequenos para continuar</h2>
            </div>

            <span class="completion-chip">
              {{ completedTasksCount }}/{{ visibleTasks.length }} feitas
            </span>
          </div>

          <div class="task-list">
            <article
              v-for="task in visibleTasks"
              :key="task.id"
              class="task-card"
              :class="{ 'task-card--done': task.done }"
            >
              <button
                class="task-check"
                :class="{ 'task-check--done': task.done }"
                @click="task.done = !task.done"
                aria-label="Marcar tarefa"
              >
                ✓
              </button>

              <div class="task-card__body">
                <div class="task-card__meta">
                  <span>{{ task.kind }}</span>
                  <span>{{ task.time }}</span>
                </div>

                <h3>{{ task.title }}</h3>
                <p>{{ task.description }}</p>

                <div class="task-card__actions">
                  <button @click="task.done = true">Marcar como feito</button>
                  <button @click="skipTask(task.id)">Pular por agora</button>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="journey-section">
          <div class="section-heading section-heading--inline">
            <div>
              <p>Em andamento</p>
              <h2>Oportunidades que você está acompanhando</h2>
            </div>

            <button class="text-action">Adicionar oportunidade</button>
          </div>

          <div class="opportunity-list">
            <article
              v-for="item in trackedOpportunities"
              :key="item.id"
              class="tracked-card"
            >
              <div class="tracked-card__main">
                <div class="tracked-icon" :style="{ background: item.colorSoft, color: item.color }">
                  {{ item.icon }}
                </div>

                <div>
                  <div class="tracked-card__topline">
                    <span>{{ item.category }}</span>
                    <span>{{ item.deadline }}</span>
                  </div>

                  <h3>{{ item.title }}</h3>
                  <p>{{ item.nextAction }}</p>
                </div>
              </div>

              <div class="tracked-card__controls">
                <label>Status</label>
                <select v-model="item.status">
                  <option value="interesse">Tenho interesse</option>
                  <option value="preparando">Estou me preparando</option>
                  <option value="aplicando">Estou aplicando</option>
                  <option value="enviado">Enviei</option>
                  <option value="finalizado">Finalizado</option>
                </select>
              </div>
            </article>
          </div>
        </section>
      </div>

      <aside class="journey-sidebar">
        <section class="checkin-card">
          <div class="section-heading">
            <p>Check-in rápido</p>
            <h2>Como você quer avançar hoje?</h2>
          </div>

          <div class="checkin-options">
            <button
              v-for="option in checkinOptions"
              :key="option.key"
              class="checkin-option"
              :class="{ 'checkin-option--active': selectedCheckin === option.key }"
              @click="selectedCheckin = option.key"
            >
              <span>{{ option.icon }}</span>
              {{ option.label }}
            </button>
          </div>

          <div class="checkin-result">
            <strong>{{ checkinResult.title }}</strong>
            <p>{{ checkinResult.text }}</p>
          </div>
        </section>

        <section class="agenda-card">
          <div class="section-heading section-heading--inline">
            <div>
              <p>Próximos prazos</p>
              <h2>Sua agenda</h2>
            </div>
          </div>

          <div class="agenda-list">
            <article
              v-for="event in agendaItems"
              :key="event.id"
              class="agenda-item"
              :class="`agenda-item--${event.tone}`"
            >
              <div>
                <strong>{{ event.date }}</strong>
                <span>{{ event.month }}</span>
              </div>

              <section>
                <p>{{ event.title }}</p>
                <small>{{ event.description }}</small>
              </section>
            </article>
          </div>

          <button class="full-width-action">Ver calendário completo</button>
        </section>

        <section class="radar-card">
          <div class="section-heading">
            <p>Radar personalizado</p>
            <h2>Recomendado para continuar</h2>
          </div>

          <div class="radar-list">
            <article
              v-for="rec in recommendations"
              :key="rec.id"
              class="radar-item"
            >
              <div>
                <span>{{ rec.category }}</span>
                <h3>{{ rec.title }}</h3>
                <p>{{ rec.reason }}</p>
              </div>

              <button>Salvar</button>
            </article>
          </div>
        </section>
      </aside>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'

const showAutonomyPanel = ref(true)
const selectedFocus = ref('explorar')
const selectedPace = ref('leve')
const remindersEnabled = ref(true)
const selectedCheckin = ref('descobrir')
const mainStepIndex = ref(0)
const mainStepDone = ref(false)

const focusOptions = [
  { key: 'explorar', label: 'Descobrir caminhos' },
  { key: 'olimpiadas', label: 'Olimpíadas' },
  { key: 'bolsas', label: 'Bolsas e programas' },
  { key: 'projetos', label: 'Projetos e liderança' },
  { key: 'aplicar', label: 'Aplicar agora' }
]

const paceOptions = [
  { key: 'leve', label: 'Leve' },
  { key: 'constante', label: 'Constante' },
  { key: 'intenso', label: 'Intenso' }
]

const stages = {
  explorar: {
    title: 'Descobrindo interesses',
    description: 'Você está entendendo quais caminhos combinam com você antes de assumir um compromisso maior.',
    progress: 22
  },
  olimpiadas: {
    title: 'Construindo foco',
    description: 'Você já tem uma direção e pode transformar interesse em preparação real.',
    progress: 48
  },
  bolsas: {
    title: 'Mapeando oportunidades',
    description: 'Você está reunindo prazos, requisitos e próximos passos para não perder boas chances.',
    progress: 42
  },
  projetos: {
    title: 'Criando trajetória',
    description: 'Você está usando oportunidades para construir impacto, repertório e comunidade.',
    progress: 55
  },
  aplicar: {
    title: 'Aplicando com clareza',
    description: 'Você tem prazos importantes e precisa transformar intenção em envio.',
    progress: 68
  }
}

const currentStage = computed(() => stages[selectedFocus.value])

const mainSteps = [
  {
    title: 'Escolha uma oportunidade para acompanhar nesta semana',
    description: 'Veja recomendações alinhadas com seu perfil e salve uma delas na sua jornada.',
    reason: 'Você está em fase de descoberta e ainda não precisa decidir tudo. Só precisa escolher uma primeira porta.',
    time: '5 min'
  },
  {
    title: 'Revise os próximos prazos salvos',
    description: 'Olhe sua agenda personalizada e veja se algum prazo precisa de atenção hoje.',
    reason: 'Você já tem oportunidades em andamento. O objetivo agora é não deixar uma chance boa passar.',
    time: '3 min'
  },
  {
    title: 'Atualize seu foco da semana',
    description: 'Escolha se quer explorar, se preparar, aplicar ou se conectar com outros estudantes.',
    reason: 'Sua jornada muda com o tempo. O seConecta precisa acompanhar seu momento atual.',
    time: '2 min'
  }
]

const mainStep = computed(() => mainSteps[mainStepIndex.value])

const tasks = ref([
  {
    id: 1,
    focus: 'explorar',
    kind: 'Descoberta',
    time: '4 min',
    title: 'Veja 3 oportunidades diferentes',
    description: 'Não precisa aplicar. Só marque quais parecem interessantes.',
    done: false
  },
  {
    id: 2,
    focus: 'explorar',
    kind: 'Autonomia',
    time: '2 min',
    title: 'Escolha o foco da semana',
    description: 'Você pode mudar depois. A ideia é só ter uma direção inicial.',
    done: false
  },
  {
    id: 3,
    focus: 'explorar',
    kind: 'Reflexão',
    time: '1 min',
    title: 'Responda o que te chamou atenção',
    description: 'Isso ajuda o seConecta a ajustar melhor suas recomendações.',
    done: false
  },
  {
    id: 4,
    focus: 'olimpiadas',
    kind: 'Preparação',
    time: '20 min',
    title: 'Resolva uma questão antiga',
    description: 'Comece com uma questão simples para manter constância.',
    done: false
  },
  {
    id: 5,
    focus: 'olimpiadas',
    kind: 'Comunidade',
    time: '5 min',
    title: 'Veja quem também está estudando',
    description: 'A jornada fica mais fácil quando você encontra pessoas no mesmo caminho.',
    done: false
  },
  {
    id: 6,
    focus: 'aplicar',
    kind: 'Aplicação',
    time: '15 min',
    title: 'Abra o formulário oficial',
    description: 'Seu objetivo hoje é entender os campos, não terminar tudo.',
    done: false
  },
  {
    id: 7,
    focus: 'bolsas',
    kind: 'Organização',
    time: '10 min',
    title: 'Liste documentos necessários',
    description: 'Separe o que você já tem e o que ainda precisa pedir.',
    done: false
  },
  {
    id: 8,
    focus: 'projetos',
    kind: 'Construção',
    time: '15 min',
    title: 'Transforme uma ideia em próximo passo',
    description: 'Escreva uma ação pequena que pode sair do papel ainda esta semana.',
    done: false
  }
])

const visibleTasks = computed(() => {
  const focused = tasks.value.filter((task) => task.focus === selectedFocus.value)

  if (focused.length >= 3) return focused.slice(0, 3)

  const fallback = tasks.value.filter((task) => task.focus === 'explorar')

  return [...focused, ...fallback].slice(0, 3)
})

const completedTasksCount = computed(() => {
  return visibleTasks.value.filter((task) => task.done).length
})

const trackedOpportunities = ref([
  {
    id: 1,
    title: 'OBMEP',
    category: 'Olimpíada',
    deadline: 'Prazo em 12 dias',
    nextAction: 'Próxima ação: revisar provas antigas e salvar a data principal.',
    status: 'preparando',
    icon: 'π',
    color: '#079272',
    colorSoft: '#e8f7f2'
  },
  {
    id: 2,
    title: 'Programa Jovem Cientista',
    category: 'Pesquisa',
    deadline: 'Prazo em 6 dias',
    nextAction: 'Próxima ação: abrir o edital e separar os documentos básicos.',
    status: 'aplicando',
    icon: '🔬',
    color: '#059669',
    colorSoft: '#e9fbf4'
  },
  {
    id: 3,
    title: 'Bolsa de Verão Internacional',
    category: 'Bolsa',
    deadline: 'Prazo em 21 dias',
    nextAction: 'Próxima ação: entender os requisitos antes de decidir se aplica.',
    status: 'interesse',
    icon: '✈️',
    color: '#2464E8',
    colorSoft: '#eef4ff'
  }
])

const checkinOptions = [
  { key: 'descobrir', label: 'Quero descobrir algo', icon: '🔎' },
  { key: 'preparar', label: 'Quero me preparar', icon: '📚' },
  { key: 'prazo', label: 'Tenho prazo chegando', icon: '⏳' },
  { key: 'perdido', label: 'Estou meio perdido', icon: '🧭' },
  { key: 'conectar', label: 'Quero falar com alguém', icon: '🤝' }
]

const checkinMessages = {
  descobrir: {
    title: 'Comece leve.',
    text: 'Hoje, o melhor passo é explorar algumas possibilidades e salvar uma que pareça interessante.'
  },
  preparar: {
    title: 'Vamos transformar interesse em rotina.',
    text: 'Escolha uma oportunidade em andamento e faça uma ação pequena de preparação.'
  },
  prazo: {
    title: 'Prioridade: não perder a data.',
    text: 'Foque no prazo mais próximo. Abra o site oficial e veja exatamente o que falta.'
  },
  perdido: {
    title: 'Tudo bem não saber ainda.',
    text: 'Sua tarefa hoje é escolher uma direção temporária. Você pode mudar depois.'
  },
  conectar: {
    title: 'A jornada não precisa ser sozinha.',
    text: 'Procure estudantes, embaixadores ou comunidades ligados ao seu interesse atual.'
  }
}

const checkinResult = computed(() => checkinMessages[selectedCheckin.value])

const agendaItems = [
  {
    id: 1,
    date: '23',
    month: 'mai',
    title: 'Prazo final do Programa Jovem Cientista',
    description: 'Separar documentos antes de enviar.',
    tone: 'urgent'
  },
  {
    id: 2,
    date: '29',
    month: 'mai',
    title: 'Inscrição OBMEP',
    description: 'Conferir escola e etapa de participação.',
    tone: 'green'
  },
  {
    id: 3,
    date: '04',
    month: 'jun',
    title: 'Workshop de projetos estudantis',
    description: 'Boa opção para explorar liderança.',
    tone: 'blue'
  }
]

const recommendations = computed(() => {
  const base = {
    explorar: [
      {
        id: 1,
        category: 'Para descobrir',
        title: 'Guia: como escolher sua primeira oportunidade',
        reason: 'Bom para quem ainda não sabe por onde começar.'
      },
      {
        id: 2,
        category: 'Oportunidade leve',
        title: 'Workshop introdutório de tecnologia',
        reason: 'Baixa barreira de entrada e bom para testar interesse.'
      }
    ],
    olimpiadas: [
      {
        id: 3,
        category: 'Olimpíada',
        title: 'OBI — Olimpíada Brasileira de Informática',
        reason: 'Combina com interesse em tecnologia e desafios.'
      },
      {
        id: 4,
        category: 'Preparação',
        title: 'Lista inicial de problemas',
        reason: 'Um próximo passo prático para começar.'
      }
    ],
    bolsas: [
      {
        id: 5,
        category: 'Bolsa',
        title: 'Programa de verão para estudantes',
        reason: 'Relevante para quem quer experiências acadêmicas.'
      }
    ],
    projetos: [
      {
        id: 6,
        category: 'Projeto',
        title: 'Como criar um clube estudantil',
        reason: 'Ajuda a transformar interesse em impacto local.'
      }
    ],
    aplicar: [
      {
        id: 7,
        category: 'Aplicação',
        title: 'Checklist de documentos',
        reason: 'Ajuda a sair da intenção e avançar no envio.'
      }
    ]
  }

  return base[selectedFocus.value] || base.explorar
})

function completeMainStep() {
  mainStepDone.value = true
}

function rotateMainStep() {
  mainStepDone.value = false
  mainStepIndex.value = (mainStepIndex.value + 1) % mainSteps.length
}

function skipTask(taskId) {
  tasks.value = tasks.value.filter((task) => task.id !== taskId)
}
</script>

<style scoped>
.journey-page {
  min-height: 100vh;
  padding: 32px;
  background:
    radial-gradient(circle at top left, rgba(7, 146, 114, 0.12), transparent 32%),
    linear-gradient(180deg, #fbfaf7 0%, #f7f4ee 100%);
  color: #111827;
  font-family: 'Outfit', Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.journey-hero {
  max-width: 1180px;
  margin: 0 auto 18px;
}

.journey-hero__content {
  border: 1px solid #e8e4dc;
  border-radius: 32px;
  padding: 28px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
}

.journey-eyebrow,
.section-heading p,
.soft-badge,
.stage-label {
  margin: 0;
  color: #079272;
  font-size: 0.76rem;
  font-weight: 950;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.journey-hero__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-top: 10px;
}

.journey-hero h1 {
  margin: 0;
  max-width: 760px;
  font-size: clamp(2rem, 4vw, 4.1rem);
  line-height: 0.95;
  letter-spacing: -0.07em;
}

.journey-hero p {
  max-width: 680px;
  margin: 14px 0 0;
  color: #5f6864;
  font-size: 1.02rem;
  line-height: 1.7;
}

.ghost-action,
.secondary-btn,
.text-action,
.full-width-action {
  border: 1px solid #d8d3ca;
  background: #ffffff;
  color: #111827;
  border-radius: 999px;
  padding: 11px 16px;
  font-weight: 900;
  cursor: pointer;
  transition: 0.2s ease;
}

.ghost-action:hover,
.secondary-btn:hover,
.text-action:hover,
.full-width-action:hover {
  border-color: #079272;
  color: #079272;
  transform: translateY(-1px);
}

.journey-stage-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
  margin-top: 26px;
  padding: 18px;
  border: 1px solid #e8e4dc;
  border-radius: 24px;
  background: #fbfaf7;
}

.journey-stage-card strong {
  display: block;
  margin-top: 4px;
  font-size: 1.35rem;
  letter-spacing: -0.04em;
}

.journey-stage-card p {
  margin: 4px 0 0;
  font-size: 0.94rem;
}

.stage-progress {
  min-width: 190px;
}

.stage-progress span {
  display: block;
  margin-bottom: 8px;
  color: #079272;
  font-weight: 950;
  text-align: right;
}

.stage-progress__bar {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e6e1d8;
}

.stage-progress__bar div {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #079272, #22c55e);
}

.autonomy-panel,
.journey-grid {
  max-width: 1180px;
  margin: 0 auto;
}

.autonomy-panel {
  margin-bottom: 18px;
  padding: 22px;
  border: 1px solid #dcefe8;
  border-radius: 28px;
  background: #f2fbf7;
}

.section-heading {
  margin-bottom: 16px;
}

.section-heading h2 {
  margin: 5px 0 0;
  font-size: 1.35rem;
  line-height: 1.1;
  letter-spacing: -0.05em;
}

.section-heading--inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.autonomy-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.control-card,
.next-step-card,
.daily-section,
.journey-section,
.checkin-card,
.agenda-card,
.radar-card {
  border: 1px solid #e8e4dc;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.06);
}

.control-card {
  padding: 18px;
}

.control-card__icon {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 16px;
  background: #e8f7f2;
  font-size: 1.3rem;
}

.control-card h3 {
  margin: 14px 0 6px;
  font-size: 1.05rem;
  letter-spacing: -0.03em;
}

.control-card p {
  margin: 0 0 14px;
  color: #66736d;
  font-size: 0.92rem;
  line-height: 1.5;
}

.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.select-pill {
  border: 1px solid #ddd7cd;
  border-radius: 999px;
  padding: 8px 11px;
  background: #fff;
  color: #47514d;
  font-size: 0.82rem;
  font-weight: 850;
  cursor: pointer;
}

.select-pill--active {
  border-color: #079272;
  background: #079272;
  color: #fff;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px;
  border: 1px solid #e8e4dc;
  border-radius: 18px;
  background: #fbfaf7;
}

.toggle-row strong {
  display: block;
  font-size: 0.9rem;
}

.toggle-row span {
  display: block;
  margin-top: 2px;
  color: #66736d;
  font-size: 0.8rem;
  font-weight: 750;
}

.switch {
  position: relative;
  width: 48px;
  height: 28px;
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  background: #c9c2b7;
  cursor: pointer;
}

.switch span {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 20px;
  height: 20px;
  margin: 0;
  border-radius: 50%;
  background: #fff;
  transition: 0.2s ease;
}

.switch--on {
  background: #079272;
}

.switch--on span {
  transform: translateX(20px);
}

.journey-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 18px;
}

.journey-main,
.journey-sidebar {
  display: grid;
  gap: 18px;
  align-content: start;
}

.next-step-card {
  padding: 24px;
  overflow: hidden;
  position: relative;
}

.next-step-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at top right, rgba(7, 146, 114, 0.18), transparent 28%),
    linear-gradient(135deg, rgba(255, 255, 255, 0), rgba(7, 146, 114, 0.04));
  pointer-events: none;
}

.next-step-card > * {
  position: relative;
}

.next-step-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.next-step-card h2 {
  max-width: 660px;
  margin: 8px 0 0;
  font-size: clamp(1.7rem, 3vw, 2.6rem);
  line-height: 1;
  letter-spacing: -0.07em;
}

.next-step-card p {
  max-width: 670px;
  margin: 15px 0 0;
  color: #5f6864;
  line-height: 1.65;
}

.time-chip,
.completion-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #eef8f5;
  color: #079272;
  font-size: 0.8rem;
  font-weight: 950;
  white-space: nowrap;
}

.why-box {
  display: grid;
  gap: 4px;
  margin-top: 18px;
  padding: 14px;
  border: 1px solid #d9eee7;
  border-radius: 20px;
  background: #f4fbf8;
}

.why-box strong {
  color: #079272;
  font-size: 0.84rem;
}

.why-box span {
  color: #4f5a55;
  font-size: 0.92rem;
  line-height: 1.55;
}

.next-step-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 18px;
}

.primary-btn {
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  background: #079272;
  color: #fff;
  font-weight: 950;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(7, 146, 114, 0.22);
}

.daily-section,
.journey-section,
.checkin-card,
.agenda-card,
.radar-card {
  padding: 20px;
}

.task-list {
  display: grid;
  gap: 12px;
}

.task-card {
  display: flex;
  gap: 14px;
  padding: 15px;
  border: 1px solid #e8e4dc;
  border-radius: 22px;
  background: #fff;
  transition: 0.2s ease;
}

.task-card--done {
  opacity: 0.68;
  background: #fbfaf7;
}

.task-check {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid #d8d3ca;
  border-radius: 50%;
  background: #fff;
  color: transparent;
  font-weight: 950;
  cursor: pointer;
}

.task-check--done {
  border-color: #079272;
  background: #079272;
  color: #fff;
}

.task-card__meta,
.tracked-card__topline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #079272;
  font-size: 0.75rem;
  font-weight: 950;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.task-card h3,
.tracked-card h3,
.radar-item h3 {
  margin: 6px 0 4px;
  font-size: 1.04rem;
  letter-spacing: -0.03em;
}

.task-card p,
.tracked-card p,
.radar-item p {
  margin: 0;
  color: #66736d;
  font-size: 0.92rem;
  line-height: 1.55;
}

.task-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.task-card__actions button,
.radar-item button {
  border: 1px solid #e1dbd1;
  border-radius: 999px;
  padding: 7px 10px;
  background: #fbfaf7;
  color: #39433f;
  font-size: 0.78rem;
  font-weight: 850;
  cursor: pointer;
}

.opportunity-list {
  display: grid;
  gap: 12px;
}

.tracked-card {
  display: grid;
  grid-template-columns: 1fr 190px;
  gap: 16px;
  align-items: center;
  padding: 15px;
  border: 1px solid #e8e4dc;
  border-radius: 22px;
  background: #fff;
}

.tracked-card__main {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.tracked-icon {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 17px;
  font-weight: 950;
}

.tracked-card__controls {
  display: grid;
  gap: 7px;
}

.tracked-card__controls label {
  color: #68736f;
  font-size: 0.75rem;
  font-weight: 950;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.tracked-card__controls select {
  width: 100%;
  border: 1px solid #d8d3ca;
  border-radius: 14px;
  padding: 10px;
  background: #fbfaf7;
  color: #111827;
  font-weight: 800;
}

.checkin-options {
  display: grid;
  gap: 8px;
}

.checkin-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: 1px solid #e8e4dc;
  border-radius: 17px;
  padding: 11px 12px;
  background: #fff;
  color: #39433f;
  font-weight: 850;
  text-align: left;
  cursor: pointer;
}

.checkin-option--active {
  border-color: #079272;
  background: #eef8f5;
  color: #079272;
}

.checkin-result {
  margin-top: 14px;
  padding: 14px;
  border-radius: 20px;
  background: #10231f;
  color: #fff;
}

.checkin-result strong {
  display: block;
  margin-bottom: 5px;
}

.checkin-result p {
  margin: 0;
  color: rgba(255, 255, 255, 0.76);
  font-size: 0.9rem;
  line-height: 1.55;
}

.agenda-list,
.radar-list {
  display: grid;
  gap: 10px;
}

.agenda-item {
  display: grid;
  grid-template-columns: 54px 1fr;
  gap: 12px;
  padding: 12px;
  border: 1px solid #e8e4dc;
  border-radius: 20px;
  background: #fff;
}

.agenda-item > div {
  display: grid;
  place-items: center;
  align-content: center;
  border-radius: 16px;
  background: #f3f1ec;
}

.agenda-item strong {
  font-size: 1rem;
  line-height: 1;
}

.agenda-item span {
  color: #68736f;
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
}

.agenda-item p {
  margin: 1px 0 3px;
  font-weight: 900;
  line-height: 1.3;
}

.agenda-item small {
  color: #66736d;
  line-height: 1.4;
}

.agenda-item--urgent > div {
  background: #fff1f2;
  color: #e11d48;
}

.agenda-item--green > div {
  background: #e8f7f2;
  color: #079272;
}

.agenda-item--blue > div {
  background: #eef4ff;
  color: #2464e8;
}

.full-width-action {
  width: 100%;
  margin-top: 14px;
}

.radar-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 13px;
  border: 1px solid #e8e4dc;
  border-radius: 20px;
  background: #fff;
}

.radar-item span {
  color: #079272;
  font-size: 0.74rem;
  font-weight: 950;
  text-transform: uppercase;
}

.radar-item button {
  height: fit-content;
  flex: 0 0 auto;
}

@media (max-width: 1040px) {
  .journey-grid,
  .autonomy-grid {
    grid-template-columns: 1fr;
  }

  .journey-sidebar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .radar-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .journey-page {
    padding: 16px;
  }

  .journey-hero__content,
  .autonomy-panel,
  .next-step-card,
  .daily-section,
  .journey-section,
  .checkin-card,
  .agenda-card,
  .radar-card {
    border-radius: 24px;
  }

  .journey-hero__top,
  .journey-stage-card,
  .next-step-card__header,
  .section-heading--inline {
    flex-direction: column;
    align-items: flex-start;
  }

  .stage-progress {
    width: 100%;
  }

  .stage-progress span {
    text-align: left;
  }

  .journey-sidebar {
    grid-template-columns: 1fr;
  }

  .tracked-card {
    grid-template-columns: 1fr;
  }

  .ghost-action,
  .primary-btn,
  .secondary-btn,
  .text-action {
    width: 100%;
  }

  .next-step-card__actions {
    flex-direction: column;
  }
}
</style>