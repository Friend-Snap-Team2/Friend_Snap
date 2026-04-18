document.addEventListener('DOMContentLoaded', async () => {

  const addBox = document.getElementById('addBox');
  const uploadInput = document.getElementById('uploadPhotosInput');
  const gallery = document.getElementById('uploadGallery');
  const uploadButton = document.getElementById('uploadButton');
  const uploadStatus = document.getElementById('uploadStatus');

  let selectedFiles = [];

  // =====================================
  // LOAD FACE DETECTION MODELS
  // =====================================
  async function loadModels() {
    uploadStatus.textContent = 'Loading face detection...';
    await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models');
    uploadStatus.textContent = '';
  }

  await loadModels();

  // =====================================
  // FACE DETECTION
  // =====================================
  async function containsFace(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;

        img.onload = async () => {
          const detection = await faceapi.detectSingleFace(
            img,
            new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.7 }) //increased tresghold not to catch animal faces as much
          );
          // returns detection object if face found, undefined if not
          resolve(!!detection);
        };
      };
      reader.readAsDataURL(file);
    });
  }

  // =====================================
  // FILE SELECTION
  // =====================================
  addBox.addEventListener('click', () => uploadInput.click());

  function showPreview(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.width = '200px';
      img.style.height = '200px';
      img.style.objectFit = 'cover';
      img.style.margin = '10px';
      img.style.borderRadius = '12px';
      gallery.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  uploadInput.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files);

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      uploadStatus.textContent = `Checking ${file.name}...`;

      const hasFace = await containsFace(file);

      if (hasFace) {
        // Face detected — reject the photo
        uploadStatus.textContent = `❌ "${file.name}" contains a person's face and cannot be uploaded. Please share photos of things, not people.`;
        uploadStatus.style.color = '#ff3b30';
      } else {
        // No face — allow the photo
        selectedFiles.push(file);
        showPreview(file);
        uploadStatus.textContent = '✅ Photo looks good!';
        uploadStatus.style.color = '#34c759';
      }
    }

    uploadInput.value = '';
  });

  // =====================================
  // UPLOAD TO SERVER
  // =====================================
  uploadButton.addEventListener('click', async (e) => {
    e.stopPropagation();

    if (!selectedFiles.length) {
      uploadStatus.textContent = 'No photos selected';
      uploadStatus.style.color = '#888';
      return;
    }

    uploadButton.disabled = true;
    uploadStatus.textContent = 'Uploading...';
    uploadStatus.style.color = '#888';

    try {
      const fd = new FormData();
      selectedFiles.forEach(f => fd.append('photos', f));

      const token = localStorage.getItem('token');

      const res = await fetch('/api/photos', {
        method: 'POST',
        headers: token ? { 'Authorization': 'Bearer ' + token } : {},
        body: fd
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        uploadStatus.textContent = err.message || 'Upload failed';
        uploadStatus.style.color = '#ff3b30';
        uploadButton.disabled = false;
        return;
      }

      const data = await res.json();
      uploadStatus.textContent = '✅ Uploaded ' + (data.photos ? data.photos.length : selectedFiles.length) + ' photo(s)';
      uploadStatus.style.color = '#34c759';
      selectedFiles = [];
      gallery.innerHTML = '';
    } catch (err) {
      console.error('Upload error', err);
      uploadStatus.textContent = 'Upload failed';
      uploadStatus.style.color = '#ff3b30';
    } finally {
      uploadButton.disabled = false;
    }
  });

  // =====================================
  // IDEAS POPUP
  // =====================================

  const categoryImages = {
    animals: [
      '/assets/animals/animal-1.jpg',
      '/assets/animals/animal-2.jpg',
      '/assets/animals/animal-3.jpg',
      '/assets/animals/animal-4.jpg',
      '/assets/animals/animal-5.jpg',
      '/assets/animals/animal-6.jpg',
    ],
    food: [
      '/assets/food/food-1.jpg',
      '/assets/food/food-2.jpg',
      '/assets/food/food-3.jpg',
      '/assets/food/food-4.jpg',
      '/assets/food/food-5.jpg',
      '/assets/food/food-6.jpg',
    ],
    art: [
      '/assets/art/art-1.jpg',
      '/assets/art/art-2.jpg',
      '/assets/art/art-3.jpg',
      '/assets/art/art-4.jpg',
      '/assets/art/art-5.jpg',
      '/assets/art/art-6.jpg',
    ],
    places: [
      '/assets/places/places-1.jpg',
      '/assets/places/places-2.jpg',
      '/assets/places/places-3.jpg',
      '/assets/places/places-4.jpg',
      '/assets/places/places-5.jpg',
      '/assets/places/places-6.jpg',
    ]
  };

  window.openIdeas = function(category, icon, title) {
    document.getElementById('ideas-popup-title').textContent = icon + ' ' + title;
    const grid = document.getElementById('ideas-grid');
    grid.innerHTML = '';
    const images = categoryImages[category] || [];
    if (!images.length) {
      grid.innerHTML = '<p style="text-align:center;color:#888">No images yet!</p>';
    } else {
      images.forEach(src => {
        const img = document.createElement('img');
        img.src = src;
        img.alt = title;
        img.className = 'idea-preview-img';
        grid.appendChild(img);
      });
    }
    document.getElementById('ideas-popup').style.display = 'flex';
  }

  window.closeIdeas = function() {
    document.getElementById('ideas-popup').style.display = 'none';
  }

  document.getElementById('ideas-popup').addEventListener('click', function(e) {
    if (e.target === this) closeIdeas();
  });

});