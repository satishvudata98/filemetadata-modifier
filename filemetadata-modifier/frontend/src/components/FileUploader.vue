<template>
  <div>
    <v-card class="mb-4">
      <v-card-title>Upload File</v-card-title>
      <v-card-text>
        <v-file-input
          v-model="file"
          accept="image/*,.pdf"
          label="Choose file"
          prepend-icon="mdi-paperclip"
          @change="handleFileChange"
        ></v-file-input>
      </v-card-text>
    </v-card>

    <v-card v-if="fileMetadata" class="mb-4">
      <v-card-title>File Metadata</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item v-for="(value, key) in fileMetadata" :key="key">
            <v-list-item-title>{{ formatKey(key) }}</v-list-item-title>
            <v-list-item-subtitle>{{ formatValue(value) }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-textarea
          v-model="comment"
          label="Add a comment"
          rows="3"
          class="mt-4"
        ></v-textarea>

        <v-btn
          color="primary"
          class="mt-4"
          @click="addComment"
          :loading="addingComment"
        >
          Add Comment
        </v-btn>
      </v-card-text>
    </v-card>

    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      timeout="3000"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const file = ref(null)
const fileMetadata = ref(null)
const comment = ref('')
const addingComment = ref(false)
const snackbar = ref({
  show: false,
  text: '',
  color: 'success'
})

const API_URL = 'http://localhost:3000/api'

const handleFileChange = async (file) => {
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    fileMetadata.value = response.data.metadata
    showSnackbar('File uploaded successfully', 'success')
  } catch (error) {
    showSnackbar('Error uploading file', 'error')
    console.error('Upload error:', error)
  }
}

const addComment = async () => {
  if (!comment.value || !fileMetadata.value) return

  addingComment.value = true
  try {
    await axios.post(`${API_URL}/comment`, {
      filePath: fileMetadata.value.path,
      comment: comment.value
    })
    showSnackbar('Comment added successfully', 'success')
    comment.value = ''
  } catch (error) {
    showSnackbar('Error adding comment', 'error')
    console.error('Comment error:', error)
  } finally {
    addingComment.value = false
  }
}

const formatKey = (key) => {
  return key
    .split(/(?=[A-Z])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const formatValue = (value) => {
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return value
}

const showSnackbar = (text, color = 'success') => {
  snackbar.value = {
    show: true,
    text,
    color
  }
}
</script> 