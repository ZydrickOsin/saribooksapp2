<template>
  <div>
    <v-tabs v-model="activeTab" class="mb-6">
      <v-tab value="shared-with-me">Shared with Me</v-tab>
      <v-tab value="shared-by-me">Shared by Me</v-tab>
    </v-tabs>
    
    <v-window v-model="activeTab">
      <!-- Books shared with me -->
      <v-window-item value="shared-with-me">
        <v-row>
          <v-col cols="12">
            <h1 class="text-h4 mb-4">Books Shared with Me</h1>
          </v-col>
        </v-row>
        
        <v-alert
          v-if="errorMsg"
          type="error"
          dismissible
          class="mb-4"
        >
          {{ errorMsg }}
        </v-alert>
        
        <v-card v-if="loadingShared" class="d-flex justify-center align-center" height="200">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </v-card>
        
        <v-alert
          v-else-if="!sharedWithMe.length"
          type="info"
          class="mb-4"
        >
          No books have been shared with you yet.
        </v-alert>
        
        <v-row v-else>
          <v-col v-for="shared in sharedWithMe" :key="shared.id" cols="12" sm="6" lg="4">
            <v-card class="h-100">
              <v-card-title class="text-h6">{{ shared.books.title }}</v-card-title>
              <v-card-subtitle>
                {{ shared.books.author }}
                <v-chip
                  v-if="getCategoryName(shared.books.category_id)"
                  size="small"
                  class="ml-2"
                  color="primary"
                  text-color="white"
                >
                  {{ getCategoryName(shared.books.category_id) }}
                </v-chip>
              </v-card-subtitle>
              <v-card-text>
                <p class="mb-2">{{ shared.books.description }}</p>
                <p class="text-caption">
                  Shared by: {{ shared.profiles.username }}
                  <br>
                  Shared on: {{ formatDate(shared.created_at) }}
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
      
      <!-- Books shared by me -->
      <v-window-item value="shared-by-me">
        <v-row>
          <v-col cols="12">
            <h1 class="text-h4 mb-4">Books I've Shared</h1>
          </v-col>
        </v-row>
        
        <v-alert
          v-if="errorMsg"
          type="error"
          dismissible
          class="mb-4"
        >
          {{ errorMsg }}
        </v-alert>
        
        <v-card v-if="loadingMyShared" class="d-flex justify-center align-center" height="200">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </v-card>
        
        <v-alert
          v-else-if="!sharedByMe.length"
          type="info"
          class="mb-4"
        >
          You haven't shared any books yet.
        </v-alert>
        
        <v-row v-else>
          <v-col v-for="shared in sharedByMe" :key="shared.id" cols="12" sm="6" lg="4">
            <v-card class="h-100">
              <v-card-title class="text-h6">{{ shared.books.title }}</v-card-title>
              <v-card-subtitle>
                {{ shared.books.author }}
                <v-chip
                  v-if="getCategoryName(shared.books.category_id)"
                  size="small"
                  class="ml-2"
                  color="primary"
                  text-color="white"
                >
                  {{ getCategoryName(shared.books.category_id) }}
                </v-chip>
              </v-card-subtitle>
              <v-card-text>
                <p class="mb-2">{{ shared.books.description }}</p>
                <p class="text-caption">
                  Shared with: {{ shared.profiles.username }}
                  <br>
                  Shared on: {{ formatDate(shared.created_at) }}
                </p>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="error"
                  text
                  @click="removeSharing(shared.id)"
                  :loading="removingId === shared.id"
                >
                  Remove Sharing
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getSharedBooks, getBooksSharedByMe, removeSharedBook, getCategories } from '../lib/supabase'

const activeTab = ref('shared-with-me')
const sharedWithMe = ref([])
const sharedByMe = ref([])
const loadingShared = ref(true)
const loadingMyShared = ref(true)
const errorMsg = ref('')
const removingId = ref(null)
const categories = ref([])

onMounted(async () => {
  await Promise.all([
    fetchSharedBooks(),
    fetchBooksSharedByMe(),
    fetchCategories()
  ])
})

const fetchCategories = async () => {
  try {
    categories.value = await getCategories()
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

const fetchSharedBooks = async () => {
  try {
    loadingShared.value = true
    errorMsg.value = ''
    
    sharedWithMe.value = await getSharedBooks()
  } catch (error) {
    errorMsg.value = error.message || 'Failed to fetch shared books'
    console.error('Error fetching shared books:', error)
  } finally {
    loadingShared.value = false
  }
}

const fetchBooksSharedByMe = async () => {
  try {
    loadingMyShared.value = true
    errorMsg.value = ''
    
    sharedByMe.value = await getBooksSharedByMe()
  } catch (error) {
    errorMsg.value = error.message || 'Failed to fetch books shared by me'
    console.error('Error fetching books shared by me:', error)
  } finally {
    loadingMyShared.value = false
  }
}

const removeSharing = async (id) => {
  try {
    removingId.value = id
    errorMsg.value = ''
    
    await removeSharedBook(id)
    
    sharedByMe.value = sharedByMe.value.filter(shared => shared.id !== id)
  } catch (error) {
    errorMsg.value = error.message || 'Failed to remove sharing'
    console.error('Error removing sharing:', error)
  } finally {
    removingId.value = null
  }
}

const getCategoryName = (categoryId) => {
  if (!categoryId) return null
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : null
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
