<template>
  <div>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">My Books</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title>Add New Book</v-card-title>
          <v-card-text>
            <v-form @submit.prevent="addBook">
              <v-text-field
                v-model="newBook.title"
                label="Title"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="newBook.author"
                label="Author"
                required
              ></v-text-field>
              
              <v-select
                v-model="newBook.category_id"
                :items="categories"
                item-title="name"
                item-value="id"
                label="Category"
              ></v-select>
              
              <v-textarea
                v-model="newBook.description"
                label="Description"
                rows="3"
              ></v-textarea>
              
              <v-btn
                color="primary"
                type="submit"
                :loading="loading"
                block
              >
                Add Book
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="8">
        <v-alert
          v-if="errorMsg"
          type="error"
          dismissible
          class="mb-4"
        >
          {{ errorMsg }}
        </v-alert>
        
        <v-card class="mb-4">
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="searchQuery"
                  label="Search books"
                  prepend-icon="mdi-magnify"
                  clearable
                  @input="filterBooks"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-select
                  v-model="selectedCategory"
                  :items="[{ id: null, name: 'All Categories' }, ...categories]"
                  item-title="name"
                  item-value="id"
                  label="Filter by Category"
                  @update:model-value="filterBooks"
                ></v-select>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        
        <v-card v-if="loading && !filteredBooks.length" class="d-flex justify-center align-center" height="200">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </v-card>
        
        <v-alert
          v-else-if="!filteredBooks.length && !loading"
          type="info"
          class="mb-4"
        >
          {{ searchQuery || selectedCategory ? 'No books match your search criteria.' : 'You haven\'t added any books yet. Add your first book!' }}
        </v-alert>
        
        <v-row v-else>
          <v-col v-for="book in filteredBooks" :key="book.id" cols="12" sm="6" lg="4">
            <v-card class="h-100">
              <v-card-title class="text-h6">{{ book.title }}</v-card-title>
              <v-card-subtitle>
                {{ book.author }}
                <v-chip
                  v-if="book.category"
                  size="small"
                  class="ml-2"
                  color="primary"
                  text-color="white"
                >
                  {{ book.category.name }}
                </v-chip>
              </v-card-subtitle>
              <v-card-text>
                <p>{{ book.description }}</p>
              </v-card-text>
              <v-card-actions>
                <v-btn
                  color="primary"
                  text
                  @click="openShareDialog(book)"
                >
                  Share
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  color="error"
                  text
                  @click="deleteBook(book.id)"
                  :loading="deletingId === book.id"
                >
                  Delete
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Share Book Dialog -->
    <v-dialog v-model="shareDialog" max-width="500px">
      <v-card>
        <v-card-title>Share "{{ selectedBook?.title }}"</v-card-title>
        <v-card-text>
          <v-alert
            v-if="shareError"
            type="error"
            dismissible
            class="mb-4"
          >
            {{ shareError }}
          </v-alert>
          
          <v-alert
            v-if="shareSuccess"
            type="success"
            dismissible
            class="mb-4"
          >
            {{ shareSuccess }}
          </v-alert>
          
          <v-text-field
            v-model="userSearchQuery"
            label="Search for a user"
            hint="Enter at least 3 characters"
            persistent-hint
            @input="searchForUsers"
          ></v-text-field>
          
          <v-list v-if="searchedUsers.length">
            <v-list-item
              v-for="user in searchedUsers"
              :key="user.id"
              @click="selectUserToShare(user)"
            >
              <v-list-item-title>{{ user.username }}</v-list-item-title>
            </v-list-item>
          </v-list>
          
          <v-alert
            v-else-if="userSearchQuery.length >= 3 && !searching"
            type="info"
            class="mt-4"
          >
            No users found matching "{{ userSearchQuery }}"
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            @click="shareDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase, getCategories, searchUsers, shareBook } from '../lib/supabase'

const books = ref([])
const allBooks = ref([])
const loading = ref(true)
const errorMsg = ref('')
const deletingId = ref(null)
const categories = ref([])
const searchQuery = ref('')
const selectedCategory = ref(null)
const newBook = ref({
  title: '',
  author: '',
  description: '',
  category_id: null
})

// Share functionality
const shareDialog = ref(false)
const selectedBook = ref(null)
const userSearchQuery = ref('')
const searchedUsers = ref([])
const searching = ref(false)
const shareError = ref('')
const shareSuccess = ref('')

onMounted(async () => {
  await Promise.all([
    fetchBooks(),
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

const fetchBooks = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        category:category_id(id, name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    
    allBooks.value = data || []
    books.value = [...allBooks.value]
  } catch (error) {
    errorMsg.value = error.message || 'Failed to fetch books'
    console.error('Error fetching books:', error)
  } finally {
    loading.value = false
  }
}

const addBook = async () => {
  try {
    loading.value = true
    errorMsg.value = ''
    
    if (!newBook.value.title || !newBook.value.author) {
      throw new Error('Title and author are required')
    }
    
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    
    if (!user) throw new Error('User not authenticated')
    
    const { data, error } = await supabase
      .from('books')
      .insert([
        {
          title: newBook.value.title,
          author: newBook.value.author,
          description: newBook.value.description,
          category_id: newBook.value.category_id,
          user_id: user.id
        }
      ])
      .select(`
        *,
        category:category_id(id, name)
      `)
    
    if (error) throw error
    
    allBooks.value = [data[0], ...allBooks.value]
    filterBooks()
    
    // Reset form
    newBook.value = {
      title: '',
      author: '',
      description: '',
      category_id: null
    }
  } catch (error) {
    errorMsg.value = error.message || 'Failed to add book'
    console.error('Error adding book:', error)
  } finally {
    loading.value = false
  }
}

const deleteBook = async (id) => {
  try {
    deletingId.value = id
    errorMsg.value = ''
    
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)
    
    if (error) throw error
    
    allBooks.value = allBooks.value.filter(book => book.id !== id)
    filterBooks()
  } catch (error) {
    errorMsg.value = error.message || 'Failed to delete book'
    console.error('Error deleting book:', error)
  } finally {
    deletingId.value = null
  }
}

const filterBooks = () => {
  let filtered = [...allBooks.value]
  
  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(book => 
      book.title.toLowerCase().includes(query) || 
      book.author.toLowerCase().includes(query) ||
      (book.description && book.description.toLowerCase().includes(query))
    )
  }
  
  // Filter by category
  if (selectedCategory.value) {
    filtered = filtered.filter(book => book.category_id === selectedCategory.value)
  }
  
  books.value = filtered
}

// Computed property for filtered books
const filteredBooks = computed(() => {
  return books.value
})

// Watch for changes in search query and selected category
watch([searchQuery, selectedCategory], () => {
  filterBooks()
})

// Share book functionality
const openShareDialog = (book) => {
  selectedBook.value = book
  shareDialog.value = true
  userSearchQuery.value = ''
  searchedUsers.value = []
  shareError.value = ''
  shareSuccess.value = ''
}

const searchForUsers = async () => {
  if (userSearchQuery.value.length < 3) {
    searchedUsers.value = []
    return
  }
  
  try {
    searching.value = true
    const { data: userData } = await supabase.auth.getUser()
    const currentUser = userData?.user
    
    const users = await searchUsers(userSearchQuery.value)
    // Filter out the current user
    searchedUsers.value = users.filter(user => user.id !== currentUser?.id)
  } catch (error) {
    console.error('Error searching for users:', error)
  } finally {
    searching.value = false
  }
}

const selectUserToShare = async (user) => {
  try {
    shareError.value = ''
    shareSuccess.value = ''
    
    if (!selectedBook.value) return
    
    await shareBook(selectedBook.value.id, user.id)
    
    shareSuccess.value = `Book successfully shared with ${user.username}`
    searchedUsers.value = []
    userSearchQuery.value = ''
  } catch (error) {
    shareError.value = error.message || 'Failed to share book'
    console.error('Error sharing book:', error)
  }
}
</script>
