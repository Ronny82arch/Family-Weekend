/**
 * Storage Service per la compressione di immagini e la gestione sicura del LocalStorage.
 * Previene il crash QuotaExceededError su dispositivi mobili (iOS Safari e Android).
 */

/**
 * Ridimensiona e comprime un'immagine Base64 o Data URL.
 * Riducono il peso delle foto del diario e degli avatar fino al 90%.
 */
export async function compressBase64Image(
  base64Str: string,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    // Se non è un data URL o è una stringa breve/vuota, ritorna il valore originale
    if (!base64Str || !base64Str.startsWith('data:image')) {
      resolve(base64Str);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      // Esporta in formato JPEG leggero
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

/**
 * Salva un oggetto in LocalStorage gestendo in modo sicuro l'eccezione di quota piena.
 */
export function safeLocalStorageSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014) {
      console.warn(`[StorageService] LocalStorage pieno salvando ${key}. Tentativo di salvataggio emergenza...`);
      alert("⚠️ Memoria del telefono quasi piena! Impossibile salvare ulteriori dati multimediali pesanti.");
      return false;
    }
    console.error(`[StorageService] Errore di salvataggio per ${key}:`, e);
    return false;
  }
}
