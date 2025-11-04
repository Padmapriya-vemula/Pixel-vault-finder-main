export interface ImageAnalysis {
  description: string;
  tags: string[];
}


const COMMON_OBJECTS = [
  'person', 'car', 'bicycle', 'motorcycle', 'bus', 'truck', 'boat', 'airplane',
  'bird', 'cat', 'dog', 'horse', 'sheep', 'cow', 'elephant', 'bear',
  'chair', 'couch', 'bed', 'dining table', 'toilet', 'tv', 'laptop',
  'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl',
  'banana', 'apple', 'sandwich', 'orange', 'broccoli', 'carrot', 'pizza',
  'book', 'clock', 'vase', 'scissors', 'teddy bear'
];


const COLOR_TAGS = [
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
  'black', 'white', 'gray', 'grey', 'dark', 'light', 'bright', 'muted'
];

const SCENE_TAGS = [
  'indoor', 'outdoor', 'nature', 'urban', 'landscape', 'portrait', 'close-up',
  'wide-angle', 'street', 'beach', 'mountain', 'forest', 'city', 'home',
  'office', 'restaurant', 'park', 'garden', 'sky', 'water', 'building'
];

const STYLE_TAGS = [
  'professional', 'amateur', 'artistic', 'documentary', 'candid', 'posed',
  'vintage', 'modern', 'abstract', 'realistic', 'blurry', 'sharp', 'hdr',
  'black-and-white', 'colorful', 'monochrome', 'sepia', 'filtered'
];

async function analyzeImageColors(imageData: Uint8Array | File): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        resolve(['unknown']);
        return;
      }
      
      const colors: { [key: string]: number } = {};
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        
      
        if (r > 200 && g < 100 && b < 100) colors['red'] = (colors['red'] || 0) + 1;
        if (r < 100 && g > 200 && b < 100) colors['green'] = (colors['green'] || 0) + 1;
        if (r < 100 && g < 100 && b > 200) colors['blue'] = (colors['blue'] || 0) + 1;
        if (r > 200 && g > 200 && b < 100) colors['yellow'] = (colors['yellow'] || 0) + 1;
        if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) colors['grayscale'] = (colors['grayscale'] || 0) + 1;
      }
      
      const dominantColors = Object.entries(colors)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([color]) => color);
      
      resolve(dominantColors);
    };
    
    if (imageData instanceof File) {
      img.src = URL.createObjectURL(imageData);
    } else {
      const buffer = imageData.buffer instanceof ArrayBuffer ? imageData.buffer : new Uint8Array(imageData).buffer;
      const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
      img.src = URL.createObjectURL(blob);
    }
  });
}

async function analyzeImageBrightness(imageData: Uint8Array | File): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        resolve(['unknown']);
        return;
      }
      
      let totalBrightness = 0;
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        totalBrightness += (r + g + b) / 3;
      }
      
      const avgBrightness = totalBrightness / (imageData.data.length / 4);
      const tags: string[] = [];
      
      if (avgBrightness < 85) tags.push('dark');
      else if (avgBrightness > 170) tags.push('bright');
      else tags.push('medium-light');
      
      resolve(tags);
    };
    
    if (imageData instanceof File) {
      img.src = URL.createObjectURL(imageData);
    } else {
      const buffer = imageData.buffer instanceof ArrayBuffer ? imageData.buffer : new Uint8Array(imageData).buffer;
      const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
      img.src = URL.createObjectURL(blob);
    }
  });
}

async function analyzeImageColors(imageData: Uint8Array | File): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        resolve(['unknown']);
        return;
      }
      
      const colors: { [key: string]: number } = {};
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        
        
        if (r > 200 && g < 100 && b < 100) colors['red'] = (colors['red'] || 0) + 1;
        if (r < 100 && g > 200 && b < 100) colors['green'] = (colors['green'] || 0) + 1;
        if (r < 100 && g < 100 && b > 200) colors['blue'] = (colors['blue'] || 0) + 1;
        if (r > 200 && g > 200 && b < 100) colors['yellow'] = (colors['yellow'] || 0) + 1;
        if (Math.abs(r - g) < 30 && Math.abs(g - b) < 30) colors['grayscale'] = (colors['grayscale'] || 0) + 1;
      }
      
      const dominantColors = Object.entries(colors)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([color]) => color);
      
      resolve(dominantColors);
    };

    if (imageData instanceof File) {
      img.src = URL.createObjectURL(imageData);
    } else {
      const buffer = imageData.buffer instanceof ArrayBuffer ? imageData.buffer : new Uint8Array(imageData).buffer;
      const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
      img.src = URL.createObjectURL(blob);
    }
  });
}

async function analyzeImageBrightness(imageData: Uint8Array | File): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      if (!imageData) {
        resolve(['unknown']);
        return;
      }
      
      let totalBrightness = 0;
      for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        totalBrightness += (r + g + b) / 3;
      }
      
      const avgBrightness = totalBrightness / (imageData.data.length / 4);
      const tags: string[] = [];
      
      if (avgBrightness < 85) tags.push('dark');
      else if (avgBrightness > 170) tags.push('bright');
      else tags.push('medium-light');
      
      resolve(tags);
    };

    if (imageData instanceof File) {
      img.src = URL.createObjectURL(imageData);
    } else {
      const buffer = imageData.buffer instanceof ArrayBuffer ? imageData.buffer : new Uint8Array(imageData).buffer;
      const blob = new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' });
      img.src = URL.createObjectURL(blob);
    }
  });
}

export async function fallbackAnalysis(imageData: Uint8Array | File): Promise<ImageAnalysis> {
  console.log('Using enhanced local fallback analysis');
  
  let mimeType = 'image/jpeg';
  let fileName = 'image';
  let fileSize = 0;
  
  if (imageData instanceof File) {
    mimeType = imageData.type;
    fileName = imageData.name.toLowerCase();
    fileSize = imageData.size;
  }
  
  
  const colorTags = await analyzeImageColors(imageData);
  const brightnessTags = await analyzeImageBrightness(imageData);
  const tags: string[] = [...colorTags, ...brightnessTags];
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
    tags.push('jpeg', 'photo', 'compressed');
  } else if (mimeType.includes('png')) {
    tags.push('png', 'image', 'transparent');
  } else if (mimeType.includes('gif')) {
    tags.push('gif', 'animated', 'graphics');
  } else if (mimeType.includes('webp')) {
    tags.push('webp', 'modern', 'optimized');
  } else if (mimeType.includes('bmp')) {
    tags.push('bmp', 'bitmap', 'uncompressed');
  } else if (mimeType.includes('tiff')) {
    tags.push('tiff', 'high-quality', 'professional');
  }
  

  if (fileSize > 0) {
    if (fileSize > 10 * 1024 * 1024) { // > 10MB
      tags.push('large', 'high-resolution', 'detailed');
    } else if (fileSize > 2 * 1024 * 1024) { // > 2MB
      tags.push('medium', 'good-quality');
    } else if (fileSize < 100 * 1024) { // < 100KB
      tags.push('small', 'thumbnail', 'compressed');
    } else {
      tags.push('standard', 'web-optimized');
    }
  }
  
  
  const nameWords = fileName
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['img', 'image', 'pic', 'photo', 'picture'].includes(w))
    .slice(0, 5);
  
  
  nameWords.forEach(word => {
    if (COMMON_OBJECTS.includes(word)) {
      tags.push(word);
    } else if (COLOR_TAGS.includes(word)) {
      tags.push(word);
    } else if (SCENE_TAGS.includes(word)) {
      tags.push(word);
    } else if (STYLE_TAGS.includes(word)) {
      tags.push(word);
    } else {
      tags.push(word);
    }
  });
  if (fileName.includes('selfie') || fileName.includes('me')) {
    tags.push('selfie', 'portrait', 'person');
  }
  if (fileName.includes('food') || fileName.includes('meal')) {
    tags.push('food', 'meal', 'cooking');
  }
  if (fileName.includes('nature') || fileName.includes('landscape')) {
    tags.push('nature', 'landscape', 'outdoor');
  }
  if (fileName.includes('pet') || fileName.includes('dog') || fileName.includes('cat')) {
    tags.push('pet', 'animal');
  }
  if (fileName.includes('vacation') || fileName.includes('travel')) {
    tags.push('travel', 'vacation', 'trip');
  }
  if (fileName.includes('work') || fileName.includes('office')) {
    tags.push('work', 'office', 'professional');
  }
  
  const randomObjects = COMMON_OBJECTS
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.floor(Math.random() * 3) + 1);
  
  tags.push(...randomObjects);
  tags.push('uploaded', 'digital', 'media', 'visual', 'content');
  
  
  const format = mimeType.split('/')[1] || 'image';
  const sizeInfo = fileSize > 0 ? ` (${(fileSize / 1024 / 1024).toFixed(1)}MB)` : '';
  const objectTags = tags.filter(t => COMMON_OBJECTS.includes(t)).slice(0, 3);
  const sceneTags = tags.filter(t => SCENE_TAGS.includes(t)).slice(0, 2);
  const colorInfo = colorTags.length > 0 ? ` with predominant ${colorTags.join(', ')} colors` : '';
  const brightnessInfo = brightnessTags.length > 0 ? ` and ${brightnessTags[0]} tones` : '';
  
  let description = `A ${format} file${sizeInfo}${colorInfo}${brightnessInfo} uploaded to the system.`;
  
  if (objectTags.length > 0) {
    description += ` This image appears to contain ${objectTags.join(', ')}.`;
  }
  
  if (sceneTags.length > 0) {
    description += ` The scene appears to be ${sceneTags.join(' and ')}.`;
  }
  
  description += ' This visual content can be searched and organized using the generated tags.';
  
  return {
    description: description.trim(),
    tags: Array.from(new Set(tags)).slice(0, 15) 
  };
}
