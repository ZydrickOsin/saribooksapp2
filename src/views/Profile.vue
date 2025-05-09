<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Profile</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Profile Information</v-card-title>
          <v-card-text>
            <v-alert
              v-if="errorMsg"
              type="error"
              dismissible
              class="mb-4"
            >
              {{ errorMsg }}
            </v-alert>
            
            <v-alert
              v-if="successMsg"
              type="success"
              dismissible
              class="mb-4"
            >
              {{ successMsg }}
            </v-alert>
            
            <v-form @submit.prevent="updateProfile">
              <v-text-field
                v-model="profile.username"
                label="Username"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="profile.website"
                label="Website"
              ></v-text-field>
              
              <v-btn
                color="primary"
                type="submit"
                :loading="loading"
                block
                class="mt-4"
              >
                Update Profile
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Avatar</v-card-title>
          <v-card-text class="text-center">
            <v-avatar size="150" class="mb-4">
              <v-img
                :src="avatarUrl || 'https://via.placeholder.com/150'"
                alt="Avatar"
              ></v-img>
            </v-avatar>
            
            <v-file-input
              v-model="avatarFile"
              accept="image/*"
              label="Upload new avatar"
              prepend-icon="mdi-camera"
              @change="handleAvatarChange"
            ></v-file-input>
            
            <v-btn
              color="primary"
              @click="uploadAvatar"
              :loading="uploadingAvatar"
              :disabled="!avatarFile"
              block
            >
              Upload Avatar
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const profile = ref({
  username: '',
  website: '',
  avatar_url: ''
})
const loading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const avatarFile = ref(null)
const avatarUrl = ref('')
const uploadingAvatar = ref(false)

onMounted(async () => {
  await fetchProfile()
})

const fetchProfile = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    if (data) {
      profile.value = {
        username: data.username || '',
        website: data.website || '',
        avatar_url: data.avatar_url || ''
      }
      
      if (data.avatar_url) {
        downloadAvatar(data.avatar_url)
      }
    }
  } catch (error) {
    errorMsg.value = error.message || 'Failed to fetch profile'
    console.error('Error fetching profile:', error)
  } finally {
    loading.value = false
  }
}

const updateProfile = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    successMsg.value = ''
    
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    
    if (!user) throw new Error('User not authenticated')
    
    if (!profile.value.username) {
      throw new Error('Username is required')
    }
    
    const updates = {
      id: user.id,
      username: profile.value.username,
      website: profile.value.website,
      avatar_url: profile.value.avatar_url,
      updated_at: new Date()
    }
    
    const { error } = await supabase
      .from('profiles')
      .upsert(updates)
    
    if (error) throw error
    
    successMsg.value = 'Profile updated successfully!'
  } catch (error) {
    errorMsg.value = error.message || 'Failed to update profile'
    console.error('Error updating profile:', error)
  } finally {
    loading.value = false
  }
}

const handleAvatarChange = (event) => {
  if (!avatarFile.value) return
  
  const file = avatarFile.value
  if (file.size > 2 * 1024 * 1024) {
    errorMsg.value = 'Avatar image must be less than 2MB'
    avatarFile.value = null
    return
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    avatarUrl.value = e.target.result
  }
  reader.readAsDataURL(file)
}

const uploadAvatar = async () => {
  try {
    uploadingAvatar.value = true
    errorMsg.value = ''
    
    if (!avatarFile.value) return
    
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    
    if (!user) throw new Error('User not authenticated')
    
    const file = avatarFile.value
    const fileExt = file.name.split('.').pop()
    const filePath = `${user.id}/avatar.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true })
    
    if (uploadError) throw uploadError
    
    // Update profile with new avatar URL
    profile.value.avatar_url = filePath
    await updateProfile()
    
    successMsg.value = 'Avatar uploaded successfully!'
  } catch (error) {
    errorMsg.value = error.message || 'Failed to upload avatar'
    console.error('Error uploading avatar:', error)
  } finally {
    uploadingAvatar.value = false
  }
}

const downloadAvatar = async (path) => {
  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .download(path)
    
    if (error) throw error
    
    const url = URL.createObjectURL(data)
    avatarUrl.value = url
  } catch (error) {
    console.error('Error downloading avatar:', error)
  }
}
</script>
