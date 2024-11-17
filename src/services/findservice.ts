// src/services/findservice.ts
import { db, storage } from '../lib/firebase/firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Find, NewFind } from '../types/finds';

// Rest of the service code remains the same...

class FindService {
  private collection = collection(db, 'finds');

  async uploadImage(file: File): Promise<string> {
    try {
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, `finds/${filename}`);
      
      const uploadResult = await uploadBytes(storageRef, file);
      return getDownloadURL(uploadResult.ref);
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  async deleteImage(imageUrl: string) {
    if (!imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
      return;
    }

    try {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }

  async getFinds(): Promise<Find[]> {
    try {
      const q = query(this.collection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      } as Find));
    } catch (error) {
      console.error('Error getting finds:', error);
      throw new Error('Failed to load finds');
    }
  }

  async addFind(find: NewFind, imageFile?: File): Promise<Find> {
    try {
      let imageUrl = '/api/placeholder/300/200';
      
      if (imageFile) {
        imageUrl = await this.uploadImage(imageFile);
      }

      const findData = {
        ...find,
        imageUrl,
        createdAt: new Date()
      };

      const docRef = await addDoc(this.collection, findData);

      return {
        id: docRef.id,
        ...findData
      };
    } catch (error) {
      console.error('Error adding find:', error);
      throw new Error('Failed to add find');
    }
  }

  async deleteFind(id: string, imageUrl: string): Promise<void> {
    try {
      await this.deleteImage(imageUrl);
      await deleteDoc(doc(this.collection, id));
    } catch (error) {
      console.error('Error deleting find:', error);
      throw new Error('Failed to delete find');
    }
  }

  async updateFind(id: string, updates: NewFind, newImageFile?: File): Promise<void> {
    try {
      let imageUrl = undefined;
      
      if (newImageFile) {
        // Upload new image if provided
        imageUrl = await this.uploadImage(newImageFile);
        
        // Get the old find to delete its image if it exists
        const oldFind = await this.getFind(id);
        if (oldFind?.imageUrl) {
          await this.deleteImage(oldFind.imageUrl);
        }
      }

      const findRef = doc(this.collection, id);
      await updateDoc(findRef, {
        ...updates,
        ...(imageUrl && { imageUrl }),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating find:', error);
      throw new Error('Failed to update find');
    }
  }

  // Add this helper method if you don't have it
  async getFind(id: string): Promise<Find | null> {
    try {
      const docRef = doc(this.collection, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Find;
      }
      return null;
    } catch (error) {
      console.error('Error getting find:', error);
      throw error;
    }
  }
}

export const findService = new FindService();