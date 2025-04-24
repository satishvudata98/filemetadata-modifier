<script>
import axios from 'axios';

export default {
  name: 'App',
  data() {
    return {
      filePath: '',
      comments: '',
      message: '',
      messageType: 'success',
      loading: false,
      metadata: null,
      extracting: false,
      editingComment: null,
      editText: ''
    };
  },
  computed: {
    formattedComments() {
      if (!this.metadata) return '';
      
      const commentsText = this.metadata.subject || this.metadata.comments || '';
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
    }
  },
  methods: {
    async handleSubmit() {
      this.loading = true;
      this.message = '';
      
      try {
        const response = await axios.post('http://localhost:3001/api/metadata', {
          filePath: this.filePath,
          comments: this.comments
        });
        
        this.message = response.data.message;
        this.messageType = 'success';
        
        // After updating, fetch the new metadata
        await this.extractMetadata();
        
        // Clear comments field on success
        this.comments = '';
      } catch (error) {
        this.message = error.response?.data?.message || 'Error: Could not connect to the server';
        this.messageType = 'error';
      } finally {
        this.loading = false;
      }
    },
    
    async extractMetadata() {
      if (!this.filePath) return;
      
      this.extracting = true;
      this.metadata = null;
      this.editingComment = null;
      this.editText = '';
      
      try {
        const encodedPath = encodeURIComponent(this.filePath);
        const response = await axios.get(`http://localhost:3001/api/metadata/${encodedPath}`);
        this.metadata = response.data.metadata;
      } catch (error) {
        console.error('Error extracting metadata:', error);
      } finally {
        this.extracting = false;
      }
    },
    
    startEditing(index) {
      this.editingComment = index;
      this.editText = this.formattedComments[index].text;
    },
    
    cancelEditing() {
      this.editingComment = null;
      this.editText = '';
    },
    
    async saveEdit(index) {
      if (!this.editText.trim()) {
        this.message = 'Comment cannot be empty';
        this.messageType = 'error';
        return;
      }
      
      this.loading = true;
      this.message = '';
      
      try {
        const encodedPath = encodeURIComponent(this.filePath);
        const response = await axios.put(`http://localhost:3001/api/metadata/${encodedPath}`, {
          commentIndex: index,
          newComment: this.editText
        });
        
        this.message = response.data.message;
        this.messageType = 'success';
        
        // After updating, fetch the new metadata
        await this.extractMetadata();
      } catch (error) {
        this.message = error.response?.data?.message || 'Error: Could not update comment';
        this.messageType = 'error';
      } finally {
        this.loading = false;
      }
    },
    
    handleFilePathChange() {
      // Only extract metadata when the user has finished typing
      if (this.filePath) {
        this.extractMetadata();
      } else {
        this.metadata = null;
      }
    },
    
    handleKeyPress(event) {
      // If Enter key is pressed, extract metadata
      if (event.key === 'Enter') {
        this.handleFilePathChange();
      }
    }
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
