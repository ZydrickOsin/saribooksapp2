<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-title>Sari Books App</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn v-if="user" to="/dashboard" text>My Books</v-btn>
      <v-btn v-if="user" to="/shared" text>Shared Books</v-btn>
      <v-btn v-if="user" to="/profile" text>Profile</v-btn>
      <v-btn v-if="user" @click="handleSignOut" text>Sign Out</v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>

    <v-footer app color="primary" dark>
      <v-row justify="center" no-gutters>
        <v-col class="text-center" cols="12">
          {{ new Date().getFullYear() }} — <strong>Sari Books App</strong>
        </v-col>
      </v-row>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from './lib/supabase'

const router = useRouter()
const user = ref(null)

onMounted(async () => {
  const { data } = await supabase.auth.getUser()
  user.value = data?.user

  supabase.auth.onAuthStateChange(async (event, session) => {
    user.value = session?.user || null

    if (event === 'SIGNED_IN' && user.value) {
      router.push('/dashboard')
    } else if (event === 'SIGNED_OUT') {
      router.push('/')
    }
  })
})

const handleSignOut = async () => {
  try {
    await supabase.auth.signOut()
    router.push('/')
  } catch (error) {
    console.error('Error signing out:', error.message)
  }
}
</script>
