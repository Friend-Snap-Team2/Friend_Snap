document.addEventListener("DOMContentLoaded", () => {

  const takeBtn = document.querySelector(".take-btn");
  const uploadBtn = document.querySelector(".upload-btn");

  const cameraInput = document.getElementById("cameraInput");
  const uploadInput = document.getElementById("uploadInput");

  const cameraDiv = document.querySelector(".camera");

  // Helper to show image previews
  function showPreview(file) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.style.width = "100%";
      img.style.marginTop = "20px";
      img.style.borderRadius = "12px";
      cameraDiv.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  // Take Photo
  takeBtn.addEventListener("click", () => {
    cameraInput.click();
  });

  cameraInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    showPreview(file);
    event.target.value = "";
  });

  // Upload Images from Laptop (like on Animals page)
  uploadBtn.addEventListener("click", () => uploadInput.click());

  uploadInput.addEventListener("change", (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (!file.type.startsWith("image/")) return;
      showPreview(file);
    });
    uploadInput.value = ""; // allow re-upload
  });



});











