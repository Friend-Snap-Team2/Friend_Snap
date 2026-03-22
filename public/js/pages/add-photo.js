document.addEventListener('DOMContentLoaded', () => {

  const addBox = document.getElementById('addBox');
  const uploadInput = document.getElementById('uploadPhotosInput');
  const gallery = document.getElementById('uploadGallery');

  // Clicking anywhere on the add box opens file picker
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

  uploadInput.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      showPreview(file);
    });
    uploadInput.value = '';
  });

  // =====================================
  // IDEAS POPUP
  // =====================================

  // Define images for each category
  // Add your actual filenames here as you add images to each folder
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

  // Close popup when clicking outside
  document.getElementById('ideas-popup').addEventListener('click', function(e) {
    if (e.target === this) closeIdeas();
  });

});