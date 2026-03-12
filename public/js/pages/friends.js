function showTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
  });

  // Remove active from all tab buttons
  document.querySelectorAll('.tab').forEach(btn => {
    btn.classList.remove('active');
  });

  // Show the selected tab content
  document.getElementById(tabName).style.display = 'block';

  // Set the clicked button as active
  event.target.classList.add('active');
}