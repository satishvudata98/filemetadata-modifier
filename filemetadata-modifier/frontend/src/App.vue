<script setup>
import { ref, computed } from 'vue';
import axios from 'axios';

// Reactive state
const filePath = ref('');
const comments = ref('');
const message = ref('');
const messageType = ref('success');
const loading = ref(false);
const metadata = ref(null);
const extracting = ref(false);
const editingComment = ref(null);
const editText = ref('');

// Computed properties
const formattedComments = computed(() => {
  if (!metadata.value) return '';
  
  const commentsText = metadata.value.subject || metadata.value.comments || '';
  if (!commentsText) return 'No comments';
  
  // Split comments by newlines and format each line
  return commentsText.split('\n\n').map(comment => {
    // Check if the comment has a timestamp format
    if (comment.includes(': ')) {
      const [timestamp, text] = comment.split(': ');
      return { timestamp, text };
    }
    return { timestamp: '', text: comment };
  });
});

// Methods
const handleSubmit = async () => {
  loading.value = true;
  message.value = '';
  
  try {
    const response = await axios.post('http://localhost:3001/api/metadata', {
      filePath: filePath.value,
      comments: comments.value
    });
    
    message.value = response.data.message;
    messageType.value = 'success';
    
    // After updating, fetch the new metadata
    await extractMetadata();
    
    // Clear comments field on success
    comments.value = '';
  } catch (error) {
    message.value = error.response?.data?.message || 'Error: Could not connect to the server';
    messageType.value = 'error';
  } finally {
    loading.value = false;
  }
};

const extractMetadata = async () => {
  if (!filePath.value) return;
  
  extracting.value = true;
  metadata.value = null;
  editingComment.value = null;
  editText.value = '';
  
  try {
    const encodedPath = encodeURIComponent(filePath.value);
    const response = await axios.get(`http://localhost:3001/api/metadata/${encodedPath}`);
    metadata.value = response.data.metadata;
  } catch (error) {
    console.error('Error extracting metadata:', error);
  } finally {
    extracting.value = false;
  }
};

const startEditing = (index) => {
  editingComment.value = index;
  editText.value = formattedComments.value[index].text;
};

const cancelEditing = () => {
  editingComment.value = null;
  editText.value = '';
};

const saveEdit = async (index) => {
  if (!editText.value.trim()) {
    message.value = 'Comment cannot be empty';
    messageType.value = 'error';
    return;
  }
  
  loading.value = true;
  message.value = '';
  
  try {
    const encodedPath = encodeURIComponent(filePath.value);
    const response = await axios.put(`http://localhost:3001/api/metadata/${encodedPath}`, {
      commentIndex: index,
      newComment: editText.value
    });
    
    message.value = response.data.message;
    messageType.value = 'success';
    
    // After updating, fetch the new metadata
    await extractMetadata();
  } catch (error) {
    message.value = error.response?.data?.message || 'Error: Could not update comment';
    messageType.value = 'error';
  } finally {
    loading.value = false;
  }
};

const handleFilePathChange = () => {
  // Only extract metadata when the user has finished typing
  if (filePath.value) {
    extractMetadata();
  } else {
    metadata.value = null;
  }
};

const handleKeyPress = (event) => {
  // If Enter key is pressed, extract metadata
  if (event.key === 'Enter') {
    handleFilePathChange();
  }
};
</script>

<template>
  <v-app>
    <v-main>
      <v-container>
        <v-card class="mx-auto" max-width="800">
          <v-card-title class="text-center text-h4 py-4">
            File Metadata Modifier
          </v-card-title>
          
          <v-card-text>
            <v-form @submit.prevent="handleSubmit">
              <v-text-field
                v-model="filePath"
                label="File Path"
                placeholder="Enter the full path to your PDF or image file"
                required
                :rules="[v => !!v || 'File path is required']"
                variant="outlined"
                class="mb-4"
                @blur="handleFilePathChange"
                @keyup="handleKeyPress"
              ></v-text-field>
              
              <!-- Display existing metadata -->
              <v-card v-if="metadata" class="mb-4 pa-4" variant="outlined">
                <v-card-title class="text-subtitle-1 font-weight-bold">
                  Existing Metadata
                </v-card-title>
                <v-card-text>
                  <div class="d-flex flex-column">
                    <div class="d-flex mb-2">
                      <span class="font-weight-bold mr-2">Title:</span>
                      <span>{{ metadata.title }}</span>
                    </div>
                    <div class="d-flex mb-2">
                      <span class="font-weight-bold mr-2">Author:</span>
                      <span>{{ metadata.author }}</span>
                    </div>
                    <div class="d-flex mb-2">
                      <span class="font-weight-bold mr-2">File Type:</span>
                      <span>{{ metadata.type.toUpperCase() }}</span>
                    </div>
                    
                    <div class="mt-3">
                      <div class="font-weight-bold mb-2">Comments:</div>
                      <div v-if="formattedComments.length === 0" class="text-muted">
                        No comments
                      </div>
                      <div v-else class="comments-container">
                        <div v-for="(comment, index) in formattedComments" :key="index" class="comment-item mb-2">
                          <div v-if="comment.timestamp" class="text-caption text-muted">
                            {{ comment.timestamp }}
                          </div>
                          
                          <!-- Edit mode -->
                          <div v-if="editingComment === index" class="mt-2">
                            <v-textarea
                              v-model="editText"
                              variant="outlined"
                              rows="3"
                              class="mb-2"
                            ></v-textarea>
                            <div class="d-flex">
                              <v-btn
                                color="primary"
                                size="small"
                                class="mr-2"
                                @click="saveEdit(index)"
                                :loading="loading"
                              >
                                Save
                              </v-btn>
                              <v-btn
                                color="grey"
                                size="small"
                                variant="outlined"
                                @click="cancelEditing"
                              >
                                Cancel
                              </v-btn>
                            </div>
                          </div>
                          
                          <!-- Display mode -->
                          <div v-else class="comment-text">
                            {{ comment.text }}
                            <v-btn
                              icon="mdi-pencil"
                              size="x-small"
                              variant="text"
                              class="ml-2"
                              @click="startEditing(index)"
                            ></v-btn>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
              
              <v-textarea
                v-model="comments"
                label="New Comment"
                placeholder="Enter your comment"
                required
                :rules="[v => !!v || 'Comment is required']"
                variant="outlined"
                class="mb-4"
                rows="4"
              ></v-textarea>
              
              <v-btn
                type="submit"
                color="primary"
                block
                :loading="loading"
              >
                Add Comment
              </v-btn>
            </v-form>
            
            <!-- Loading indicator -->
            <v-progress-linear
              v-if="extracting"
              indeterminate
              color="primary"
              class="mt-4"
            ></v-progress-linear>
            
            <!-- Message display -->
            <v-alert
              v-if="message"
              :type="messageType"
              class="mt-4"
              closable
            >
              {{ message }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
.comments-container {
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
}

.comment-item {
  padding: 8px;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.comment-text {
  word-break: break-word;
}
</style>
