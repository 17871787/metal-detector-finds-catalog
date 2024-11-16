// src/lib/firebase/findService.ts

// src/services/findservice.ts
import { db, storage } from '../lib/firebase/firebase';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  orderBy 
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
}

export const findService = new FindService();