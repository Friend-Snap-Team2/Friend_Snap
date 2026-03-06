async function loadComponent(id, file) {
  const response = await fetch(file);
  const html = await response.text();
  document.getElementById(id).innerHTML = html;
}

loadComponent('header', '/components/header.html');
loadComponent('footer', '/components/footer.html').then(() => {
    
  // highlight the correct nav item based on current page
  const path = window.location.pathname;
  const navItems = document.querySelectorAll('.nav');

  const pageMap = [
    { path: 'home', index: 0 },
    { path: 'add-photo', index: 1 },
    { path: 'friends', index: 2 },
    { path: 'chat', index: 3 },
    { path: 'me', index: 4 },
  ];

  navItems.forEach(item => item.classList.remove('active'));

  const match = pageMap.find(p => path.includes(p.path));
  if (match) navItems[match.index].classList.add('active');
});