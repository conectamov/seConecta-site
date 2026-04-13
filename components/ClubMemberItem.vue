<script setup lang="ts">
const props = defineProps<{
  member: any
  canManage: boolean
  currentUserId?: string
  showActions?: boolean
}>()

const emit = defineEmits<{
  approve: [userId: string]
  reject: [userId: string]
  remove: [userId: string]
  changeRole: [userId: string, role: string]
  ban: [userId: string]
}>()

const ROLE_LABEL: Record<string, string> = {
  OWNER: 'Dono',
  ADMIN: 'Admin',
  TEACHER: 'Professor',
  STUDENT: 'Aluno',
}
const ROLE_COLOR: Record<string, string> = {
  OWNER: '#F59E0B',
  ADMIN: '#2464E8',
  TEACHER: '#079272',
  STUDENT: '#888',
}
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Ativo',
  PENDING: 'Pendente',
  BANNED: 'Banido',
}

const displayName = computed(() => {
  const u = props.member.user
  if (!u) return `Usuário (${props.member.userId?.slice(0, 8)})`
  return u.fullName || u.username || 'Usuário'
})

const displayInitial = computed(() => displayName.value.charAt(0).toUpperCase())

const isMe = computed(() => props.member.userId === props.currentUserId)
const isPending = computed(() => props.member.status === 'PENDING')
const isBanned = computed(() => props.member.status === 'BANNED')
const isOwner = computed(() => props.member.role === 'OWNER')

const showRoleMenu = ref(false)

const roles = ['ADMIN', 'TEACHER', 'STUDENT']

function changeRole(role: string) {
  showRoleMenu.value = false
  emit('changeRole', props.member.userId, role)
}
</script>

<template>
  <div
    class="flex items-center gap-3 py-3 border-b border-[#f7f5f0] last:border-0"
    :class="{ 'opacity-60': isBanned }"
  >
    <!-- Avatar -->
    <div class="w-9 h-9 flex-shrink-0 rounded-full overflow-hidden">
      <img
        v-if="member.user?.profilePictureUrl"
        :src="member.user.profilePictureUrl"
        :alt="displayName"
        class="w-full h-full object-cover"
      />
      <div
        v-else
        class="w-full h-full bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-white text-xs font-bold"
      >
        {{ displayInitial }}
      </div>
    </div>

    <!-- Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[0.88rem] font-semibold text-[#111] truncate">
          {{ displayName }}
          <span v-if="isMe" class="text-[0.65rem] text-[#aaa] font-normal">(você)</span>
        </span>

        <span
          v-if="member.nicknameInClub"
          class="text-[0.65rem] text-[#aaa]"
        >
          "{{ member.nicknameInClub }}"
        </span>
      </div>

      <div class="flex items-center gap-2 mt-0.5">
        <!-- Role badge -->
        <span
          class="text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full"
          :style="{ background: ROLE_COLOR[member.role] + '18', color: ROLE_COLOR[member.role] }"
        >
          {{ ROLE_LABEL[member.role] ?? member.role }}
        </span>

        <!-- Status badge for non-active -->
        <span
          v-if="isPending || isBanned"
          class="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full"
          :class="isPending ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-red-50 text-red-500 border border-red-200'"
        >
          {{ STATUS_LABEL[member.status] }}
        </span>

        <span v-if="member.user?.username" class="text-[0.68rem] text-[#bbb]">
          @{{ member.user.username }}
        </span>
      </div>
    </div>

    <!-- Stats -->
    <div class="hidden sm:flex flex-col items-end gap-0.5 text-[0.68rem] text-[#aaa]">
      <span v-if="member.participationScore > 0">
        ⭐ {{ member.participationScore.toFixed(0) }}pts
      </span>
      <span v-if="member.completedAssignments > 0">
        ✓ {{ member.completedAssignments }} tarefas
      </span>
    </div>

    <!-- Actions -->
    <div v-if="canManage && showActions !== false && !isOwner && !isMe" class="flex items-center gap-1 flex-shrink-0 relative">
      <!-- Pending: approve / reject -->
      <template v-if="isPending">
        <button
          class="text-[0.7rem] font-semibold px-2.5 py-1 rounded-lg bg-[#079272] text-white border-none cursor-pointer hover:bg-[#068060] transition-colors"
          @click="emit('approve', member.userId)"
        >
          Aprovar
        </button>
        <button
          class="text-[0.7rem] font-semibold px-2.5 py-1 rounded-lg border border-[#e8e4dc] bg-white text-[#666] cursor-pointer hover:border-red-400 hover:text-red-500 transition-colors"
          @click="emit('reject', member.userId)"
        >
          Rejeitar
        </button>
      </template>

      <!-- Active members: role + remove -->
      <template v-else-if="!isBanned">
        <!-- Change role -->
        <div class="relative">
          <button
            class="text-[0.7rem] px-2 py-1 rounded-lg border border-[#e8e4dc] bg-white text-[#666] cursor-pointer hover:border-[#079272] transition-colors"
            @click="showRoleMenu = !showRoleMenu"
          >
            Role ▾
          </button>
          <div
            v-if="showRoleMenu"
            class="absolute right-0 top-full mt-1 bg-white border border-[#e8e4dc] rounded-xl shadow-xl z-10 py-1 min-w-[120px]"
          >
            <button
              v-for="r in roles"
              :key="r"
              class="w-full text-left px-3 py-1.5 text-[0.78rem] hover:bg-[#f7f5f0] transition-colors cursor-pointer"
              :class="member.role === r ? 'font-bold text-[#079272]' : 'text-[#444]'"
              @click="changeRole(r)"
            >
              {{ ROLE_LABEL[r] }}
            </button>
          </div>
        </div>

        <button
          class="w-7 h-7 rounded-lg flex items-center justify-center text-[#bbb] hover:bg-red-50 hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer"
          title="Remover do clube"
          @click="emit('remove', member.userId)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="17" y1="8" x2="23" y2="14"/>
            <line x1="23" y1="8" x2="17" y2="14"/>
          </svg>
        </button>
      </template>
    </div>
  </div>
</template>
