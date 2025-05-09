<template>
  <v-container fluid fill-height>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-card-title class="text-h5 text-center">
            {{ view === 'sign-in' ? 'Sign In' : 'Sign Up' }}
          </v-card-title>
          
          <v-card-text>
            <v-alert v-if="errorMsg" type="error" dismissible>
              {{ errorMsg }}
            </v-alert>
            
            <v-form @submit.prevent="handleSubmit">
              <v-text-field
                v-model="email"
                label="Email"
                type="email"
                required
                prepend-icon="mdi-email"
              ></v-text-field>
              
              <v-text-field
                v-model="password"
                label="Password"
                :type="showPassword ? 'text' : 'password'"
                required
                prepend-icon="mdi-lock"
                :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append="showPassword = !showPassword"
              ></v-text-field>
              
              <v-btn
                color="primary"
                block
                large
                type="submit"
                :loading="loading"
                class="mt-4"
              >
                {{ view === 'sign-in' ? 'Sign In' : 'Sign Up' }}
              </v-btn>
            </v-form>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              text
              @click="toggleView"
              color="secondary"
            >
              {{ view === 'sign-in' ? 'Need an account? Sign Up' : 'Already have an account? Sign In' }}
            </v-btn>
            <v-spacer></v-spacer>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const loading = ref(false)
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const view = ref('sign-in')
const showPassword = ref(false)

const toggleView = () => {
  view.value = view.value === 'sign-in' ? 'sign-up' : 'sign-in'
  errorMsg.value = ''
}

const handleSubmit = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    
    if (view.value === 'sign-in') {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value
      })
      
      if (error) throw error
      
      router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value
      })
      
      if (error) throw error
      
      alert('Check your email for the confirmation link!')
    }
  } catch (error) {
    errorMsg.value = error.message || 'An error occurred during authentication'
  } finally {
    loading.value = false
  }
}
</script>
