<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { User, Save, LockKeyhole, Mail, Palette } from 'lucide-vue-next'
import PageHeader from '@/shared/components/PageHeader.vue'
import Button from '@/shared/components/Button.vue'
import Input from '@/shared/components/Input.vue'
import { useAuthStore } from '@/shared/stores/auth'
import { useToastStore } from '@/shared/stores/toast'
import { useThemeStore } from '@/shared/stores/theme'
import Select from '@/shared/components/Select.vue'

const authStore = useAuthStore()
const toastStore = useToastStore()
const themeStore = useThemeStore()

const themeOptions = computed(() => [
  { value: '', label: `Heredar de la organización (${themeStore.themes.find(t => t.id === themeStore.orgTheme)?.name || themeStore.orgTheme})` },
  ...themeStore.themes.map(t => ({ value: t.id, label: t.name })),
])

const userTheme = computed({
  get: () => themeStore.userTheme ?? '',
  set: (value) => themeStore.setUserTheme(value || null),
})

const profile = reactive({
  name: authStore.user?.name || '',
  postalCode: '',
  notificationEmail: authStore.user?.email || '',
})
const profileErrors = reactive({})
const isSavingProfile = ref(false)

const password = reactive({
  current: '',
  next: '',
  confirm: '',
})
const passwordErrors = reactive({})
const isSavingPassword = ref(false)

function saveProfile() {
  Object.keys(profileErrors).forEach(k => delete profileErrors[k])
  if (!profile.name.trim()) profileErrors.name = 'El nombre es obligatorio'
  if (profile.postalCode && !/^\d{4,5}$/.test(profile.postalCode)) profileErrors.postalCode = 'Código postal inválido'
  if (profile.notificationEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.notificationEmail)) profileErrors.notificationEmail = 'Correo inválido'
  if (Object.keys(profileErrors).length) return
  isSavingProfile.value = true
  setTimeout(() => {
    isSavingProfile.value = false
    toastStore.success('Datos personales actualizados')
  }, 400)
}

function savePassword() {
  Object.keys(passwordErrors).forEach(k => delete passwordErrors[k])
  if (!password.next) passwordErrors.next = 'Ingresa la nueva contraseña'
  else if (password.next.length < 6) passwordErrors.next = 'Mínimo 6 caracteres'
  if (password.confirm !== password.next) passwordErrors.confirm = 'Las contraseñas no coinciden'
  if (Object.keys(passwordErrors).length) return
  isSavingPassword.value = true
  setTimeout(() => {
    isSavingPassword.value = false
    password.current = ''
    password.next = ''
    password.confirm = ''
    toastStore.success('Contraseña actualizada')
  }, 400)
}

onMounted(() => {
  profile.name = authStore.user?.name || ''
  profile.notificationEmail = authStore.user?.email || ''
})
</script>

<template>
  <div class="space-y-7">
    <PageHeader
      title="Mi perfil"
      description="Actualiza tus datos personales, correo de notificaciones y contraseña"
      :icon="User"
    />

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="card p-6 space-y-5">
        <h2 class="font-display font-bold text-ink flex items-center gap-2">
          <User class="w-5 h-5 text-primary-500" aria-hidden="true" /> Datos personales
        </h2>
        <Input id="emp-name" v-model="profile.name" label="Nombre" required :error="profileErrors.name" placeholder="Tu nombre" />
        <Input id="emp-cp" v-model="profile.postalCode" label="Código postal" :error="profileErrors.postalCode" placeholder="00000" />
        <Input
          id="emp-notify"
          v-model="profile.notificationEmail"
          type="email"
          label="Correo de notificaciones"
          :error="profileErrors.notificationEmail"
          placeholder="correo@dominio.com"
        />
        <div class="flex justify-end">
          <Button variant="primary" :icon="Save" :loading="isSavingProfile" @click="saveProfile">Guardar</Button>
        </div>
      </div>

      <div class="card p-6 space-y-5">
        <h2 class="font-display font-bold text-ink flex items-center gap-2">
          <Palette class="w-5 h-5 text-primary-500" aria-hidden="true" /> Mi tema
        </h2>
        <p class="text-sm text-ink-muted">Elige un tema solo para tu cuenta o hereda el de la organización.</p>
        <Select id="my-theme" v-model="userTheme" label="Tema de la interfaz" :options="themeOptions" />
        <p class="text-xs text-ink-muted">
          {{ userTheme ? 'Tu tema personal tiene prioridad sobre el de la organización.' : 'Estás usando el tema de la organización; cualquier administrador puede cambiarlo.' }}
        </p>
      </div>

      <div class="card p-6 space-y-5">
        <h2 class="font-display font-bold text-ink flex items-center gap-2">
          <LockKeyhole class="w-5 h-5 text-primary-500" aria-hidden="true" /> Cambiar contraseña
        </h2>
        <Input id="emp-pass-current" v-model="password.current" type="password" label="Contraseña actual" placeholder="••••••••" />
        <Input id="emp-pass-next" v-model="password.next" type="password" label="Nueva contraseña" :error="passwordErrors.next" placeholder="••••••••" />
        <Input id="emp-pass-confirm" v-model="password.confirm" type="password" label="Confirmar contraseña" :error="passwordErrors.confirm" placeholder="••••••••" />
        <div class="flex justify-end">
          <Button variant="primary" :icon="LockKeyhole" :loading="isSavingPassword" @click="savePassword">Cambiar contraseña</Button>
        </div>
      </div>
    </div>
  </div>
</template>