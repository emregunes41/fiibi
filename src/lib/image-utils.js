/**
 * Cloudinary URL'ini optimize edilmiş versiyona dönüştürür.
 * Orijinal dosya korunur, sadece gösterim sırasında küçültülür.
 * 
 * @param {string} url - Orijinal Cloudinary URL
 * @param {object} options - { width, quality, format }
 * @returns {string} Optimize edilmiş URL
 */
export function optimizeCloudinaryUrl(url, options = {}) {
  if (!url || !url.includes('cloudinary.com')) return url;

  const { width = 1200, quality = 'auto', format = 'auto' } = options;

  // Already has transformations? Don't double-transform
  if (url.includes('/q_auto') || url.includes('/f_auto')) return url;

  // Cloudinary URL format: .../upload/v123456/folder/image.jpg
  // Insert transformations after /upload/
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  const transformations = `w_${width},q_${quality},f_${format}`;
  return `${parts[0]}/upload/${transformations}/${parts[1]}`;
}

/**
 * Thumbnail versiyonu (listeler, grid'ler için)
 */
export function thumbnailUrl(url, size = 400) {
  return optimizeCloudinaryUrl(url, { width: size, quality: 'auto:low' });
}

/**
 * Orta boy versiyonu (detay sayfaları için)
 */
export function mediumUrl(url) {
  return optimizeCloudinaryUrl(url, { width: 800 });
}
