(async ()=>{
  const res = await fetch('/api/user');
  const data = await res.json();
  if (!data.user) { location.href = '/login.html'; return; }
  const user = data.user;
  const socket = io();

  const messagesEl = document.getElementById('messages');
  const usersEl = document.getElementById('users');
  const profileBox = document.getElementById('profileBox');

  function renderUserProfile(u){
    profileBox.innerHTML = '';
    const img = document.createElement('div');
    img.style.width='80px'; img.style.height='80px'; img.style.borderRadius='50%'; img.style.margin='0 auto 8px';
    if (u.avatar) img.style.backgroundImage = `url(${u.avatar})`, img.style.backgroundSize='cover'; else img.style.background = u.color || '#3498db';
    profileBox.appendChild(img);
    const name = document.createElement('div'); name.textContent = u.displayName || u.username; profileBox.appendChild(name);
  }

  renderUserProfile(user);

  socket.on('connect', ()=>console.log('connected'));
  socket.on('system', d=>{
    const el = document.createElement('div'); el.className='msg'; el.textContent = d.msg; messagesEl.appendChild(el);
  });
  socket.on('message', m=>{
    const el = document.createElement('div'); el.className='msg';
    const av = document.createElement('div'); av.className='avatar';
    if (m.from.avatar) av.style.backgroundImage=`url(${m.from.avatar})`, av.style.backgroundSize='cover'; else av.style.background=m.from.color||'#666';
    el.appendChild(av);
    const txt = document.createElement('div'); txt.innerHTML = `<strong>${m.from.displayName || m.from.username}</strong>: ${escapeHtml(m.text)}`;
    el.appendChild(txt);
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });

  socket.on('user-joined', u=>{
    const el = document.createElement('div'); el.className='msg'; el.textContent = `${u.user.displayName || u.user.username} se unió.`; messagesEl.appendChild(el);
  });
  socket.on('user-left', u=>{
    const el = document.createElement('div'); el.className='msg'; el.textContent = `${u.user.displayName || u.user.username} salió.`; messagesEl.appendChild(el);
  });

  document.getElementById('msgForm').addEventListener('submit', e=>{
    e.preventDefault();
    const input = document.getElementById('msgInput');
    if (!input.value) return;
    socket.emit('message', input.value);
    input.value='';
  });

  document.getElementById('logoutBtn').addEventListener('click', async ()=>{
    await fetch('/api/logout', { method:'POST' });
    location.href = '/';
  });

  document.getElementById('profileForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const res = await fetch('/api/profile', { method:'POST', body: fd });
    const j = await res.json();
    if (j.user) { renderUserProfile(j.user); alert('Perfil actualizado'); }
  });

  function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

})();
