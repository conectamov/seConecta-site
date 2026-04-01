<template>
  <div class="min-h-screen bg-[#faf9f6] selection:bg-[#079272]/10">
    <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#079272]/5 blur-[120px] animate-pulse"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#2464E8]/5 blur-[120px] animate-pulse" style="animation-delay: 2s"></div>
    </div>

    <div class="max-w-[1100px] mx-auto px-4 md:px-8 py-8">
      <div v-if="pending" class="flex flex-col items-center justify-center py-32">
        <div class="w-12 h-12 border-4 border-[#079272]/20 border-t-[#079272] rounded-full animate-spin"></div>
      </div>

      <div v-else-if="user" class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div class="relative bg-white border border-[#e8e4dc] rounded-[32px] overflow-hidden shadow-sm">
          <div class="h-40 bg-gradient-to-r from-[#0c1b32] via-[#1a3a32] to-[#0c1b32] relative">
            <div class="absolute inset-0 opacity-30" style="background-image: url('https://www.transparenttextures.com/patterns/carbon-fibre.png');"></div>
          </div>

          <div class="px-8 pb-8">
            <div class="relative flex flex-col md:flex-row md:items-end gap-6 -mt-16">
              <div class="relative group">
                <div class="w-32 h-32 rounded-[24px] border-[6px] border-white shadow-xl overflow-hidden bg-white">
                  <img
                    v-if="user.profile_picture_url"
                    :src="user.profile_picture_url"
                    class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div v-else class="w-full h-full bg-gradient-to-br from-[#079272] to-[#2464E8] flex items-center justify-center text-4xl font-bold text-white">
                    {{ userInitial }}
                  </div>
                </div>
                <div v-if="user.matching" class="absolute -bottom-2 -right-2 bg-[#FF6B35] p-1.5 rounded-xl border-4 border-white shadow-lg" title="Disponível para Match">
                  <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                </div>
              </div>

              <div class="flex-1 space-y-2">
                <div class="flex flex-wrap items-center gap-3">
                  <h1 class="text-3xl font-black text-[#111] tracking-tight">
                    {{ user.full_name }}
                  </h1>
                  <div class="flex gap-2">
                    <span
                      v-for="tag in user.tags"
                      :key="tag"
                      class="px-3 py-1 bg-[#079272] text-white text-[0.65rem] font-black uppercase tracking-wider rounded-lg shadow-sm"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
                
                <p v-if="user.public_title" class="text-lg font-medium text-[#444] leading-tight">
                  {{ user.public_title }}
                </p>
                
                <div class="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-[#777]">
                  <span class="flex items-center gap-1.5 font-medium">
                    @{{ user.username }}
                  </span>
                  <span v-if="user.organization" class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-7h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    {{ user.organization }}
                  </span>
                  <span v-if="user.location" class="flex items-center gap-1.5">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    {{ user.location }}
                  </span>
                </div>
              </div>

              <div class="flex gap-2 pb-1">
                <a v-if="user.linkedin" :href="user.linkedin" target="_blank" class="p-2.5 bg-[#f5f5f5] hover:bg-[#0077b5] hover:text-white rounded-xl transition-all">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                <a v-if="user.instagram" :href="user.instagram" target="_blank" class="p-2.5 bg-[#f5f5f5] hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white rounded-xl transition-all">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-4 space-y-6">
            <div class="bg-white border border-[#e8e4dc] rounded-3xl p-6 shadow-sm">
              <h3 class="text-xs font-black uppercase tracking-[0.15em] text-[#079272] mb-4">Sobre</h3>
              <p class="text-[0.92rem] text-[#555] leading-relaxed italic">
                "{{ user.bio || 'Sem biografia disponível.' }}"
              </p>
              
              <div class="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-[#f0eee9]">
                <div class="text-center">
                  <div class="text-xl font-black text-[#111]">{{ user.posts_count || 0 }}</div>
                  <div class="text-[0.65rem] font-bold text-[#aaa] uppercase tracking-wider">Posts</div>
                </div>
                <div class="text-center">
                  <div class="text-xl font-black text-[#111]">{{ user.comments_count || 0 }}</div>
                  <div class="text-[0.65rem] font-bold text-[#aaa] uppercase tracking-wider">Comentários</div>
                </div>
              </div>
            </div>

            <div v-if="user.interests?.length" class="bg-white border border-[#e8e4dc] rounded-3xl p-6 shadow-sm">
              <h3 class="text-xs font-black uppercase tracking-[0.15em] text-[#079272] mb-4">Interesses</h3>
              <div class="flex flex-wrap gap-2">
                <span v-for="interest in user.interests" :key="interest" class="px-3 py-1.5 bg-[#f7f5f0] border border-[#e8e4dc] text-[#666] text-xs font-bold rounded-xl">
                  #{{ interest }}
                </span>
              </div>
            </div>
          </div>

          <div class="lg:col-span-8">
            <div class="bg-white border border-[#e8e4dc] rounded-3xl p-8 shadow-sm min-h-[400px]">
              <div class="flex items-center justify-between mb-8">
                <h2 class="text-xl font-black text-[#111]">Publicações</h2>
                <div class="h-1 flex-1 mx-6 bg-[#f7f5f0] rounded-full hidden sm:block"></div>
              </div>

              <div v-if="postsPending" class="flex justify-center py-20">
                <div class="w-8 h-8 border-3 border-[#079272]/20 border-t-[#079272] rounded-full animate-spin"></div>
              </div>

              <div v-else-if="!posts.length" class="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div class="p-4 bg-[#f7f5f0] rounded-full">
                  <svg class="w-8 h-8 text-[#ccc]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v12a2 2 0 01-2 2z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01"/></svg>
                </div>
                <p class="text-gray-500 font-medium">Nenhuma publicação por aqui ainda.</p>
              </div>

              <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <NuxtLink
                  v-for="post in posts"
                  :key="post.id"
                  :to="`/feed/${post.slug || post.id}`"
                  class="group flex flex-col bg-white border border-[#e8e4dc] rounded-2xl overflow-hidden hover:border-[#079272] hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div class="relative h-40 overflow-hidden bg-gray-100">
                    <img v-if="post.cover_url" :src="post.cover_url" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div v-else class="w-full h-full bg-[#f0faf7] flex items-center justify-center text-[#079272]/20 font-black">seConecta</div>
                  </div>
                  <div class="p-5 flex-1 flex flex-col">
                    <h3 class="text-base font-bold text-[#111] line-clamp-2 group-hover:text-[#079272] transition-colors mb-2">
                      {{ post.title }}
                    </h3>
                    <div class="mt-auto flex items-center justify-between text-[0.65rem] font-bold text-[#aaa] uppercase tracking-widest">
                      <span>{{ formatDate(post.created_at) }}</span>
                      <span class="flex items-center gap-1">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/></svg>
                        {{ post.likes_count || 0 }}
                      </span>
                    </div>
                  </div>
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// (All your logic from previous message remains the same)
// Just ensure you map these fields correctly in your types/responses:
// user.public_title, user.organization, user.posts_count, user.comments_count, user.tags
</script>

<style scoped>
.animate-in {
  animation: fade-in 0.8s ease-out;
}
@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>