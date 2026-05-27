import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export class StorageService {
  /**
   * Compresses an image file (JPEG or PNG) to a maximum width/height of 350px and returns a Blob.
   * Also provides a Base64 data URL for offline fallback.
   */
  static compressImage(file: File, maxWidth = 350, maxHeight = 350): Promise<{ blob: Blob; base64: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context could not be created'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.7);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({ blob, base64 });
              } else {
                reject(new Error('Canvas to Blob conversion failed'));
              }
            },
            'image/jpeg',
            0.7
          );
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  /**
   * Uploads an image to Firebase Storage with a native local Base64 fallback if offline or storage fails
   */
  static async uploadImage(
    file: File,
    folderPath: string, // e.g., 'businesses/default/products'
    filename: string
  ): Promise<string> {
    try {
      const { blob, base64 } = await this.compressImage(file);

      const activeBusinessId = typeof window !== 'undefined'
        ? localStorage.getItem('lual_active_business_id') || 'LUAL-BIZ-MEDELLIN-01'
        : 'LUAL-BIZ-MEDELLIN-01';
      const resolvedPath = folderPath.replace('default', activeBusinessId);

      if (navigator.onLine) {
        try {
          const storageRef = ref(storage, `${resolvedPath}/${filename}`);
          const snapshot = await uploadBytes(storageRef, blob);
          const downloadUrl = await getDownloadURL(snapshot.ref);
          return downloadUrl;
        } catch (storageError) {
          console.warn('Firebase Storage failed or not configured, using offline-first Base64 fallback', storageError);
          return base64;
        }
      } else {
        console.info('System offline, storing raw compressed local base64 payload');
        return base64;
      }
    } catch (e) {
      console.error('Image compression or upload error:', e);
      throw e;
    }
  }
}
