import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser()
  return data?.user
}

// Helper function to get user profile
export const getUserProfile = async () => {
  const user = await getCurrentUser()

  if (!user) return null

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user profile:", error)
    return null
  }

  return data
}

// Helper function to get avatar URL
export const getAvatarUrl = async (path) => {
  if (!path) return null

  try {
    const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60) // 1 hour expiry

    if (error) throw error

    return data.signedUrl
  } catch (error) {
    console.error("Error getting avatar URL:", error)
    return null
  }
}

// Helper function to get all categories
export const getCategories = async () => {
  const { data, error } = await supabase.from("categories").select("*").order("name")

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data || []
}

// Helper function to search for users (for sharing)
export const searchUsers = async (query) => {
  if (!query || query.length < 3) return []

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username")
    .ilike("username", `%${query}%`)
    .limit(5)

  if (error) {
    console.error("Error searching users:", error)
    return []
  }

  return data || []
}

// Helper function to share a book with another user
export const shareBook = async (bookId, sharedWithId) => {
  const user = await getCurrentUser()
  if (!user) throw new Error("User not authenticated")

  const { data, error } = await supabase
    .from("shared_books")
    .insert({
      book_id: bookId,
      owner_id: user.id,
      shared_with_id: sharedWithId,
    })
    .select()

  if (error) throw error

  return data
}

// Helper function to get books shared with the current user
export const getSharedBooks = async () => {
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("shared_books")
    .select(`
      id,
      book_id,
      owner_id,
      created_at,
      books:book_id(id, title, author, description, category_id),
      profiles:owner_id(id, username, avatar_url)
    `)
    .eq("shared_with_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching shared books:", error)
    return []
  }

  return data || []
}

// Helper function to get books shared by the current user
export const getBooksSharedByMe = async () => {
  const user = await getCurrentUser()
  if (!user) return []

  const { data, error } = await supabase
    .from("shared_books")
    .select(`
      id,
      book_id,
      shared_with_id,
      created_at,
      books:book_id(id, title, author, description, category_id),
      profiles:shared_with_id(id, username, avatar_url)
    `)
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching books shared by me:", error)
    return []
  }

  return data || []
}

// Helper function to remove a shared book
export const removeSharedBook = async (sharedBookId) => {
  const { error } = await supabase.from("shared_books").delete().eq("id", sharedBookId)

  if (error) throw error
}
