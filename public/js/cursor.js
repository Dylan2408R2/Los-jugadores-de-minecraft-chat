// simple custom cursor and trailing dots
(function(){
  const cursor = document.createElement('div'); cursor.className='cursor'; document.body.appendChild(cursor);
  const dots = [];
  for(let i=0;i<6;i++){ const d=document.createElement('div'); d.className='cursor'; d.style.opacity = 0.6 - i*0.08; d.style.width = d.style.height = (18 - i*2)+'px'; document.body.appendChild(d); dots.push(d);} 
  let mx=0,my=0; let px=0,py=0;
  document.addEventListener('mousemove', (e)=>{ mx=e.clientX; my=e.clientY; cursor.style.left=mx+'px'; cursor.style.top=my+'px'; });
  function loop(){ px += (mx - px)*0.2; py += (my - py)*0.2; for(let i=0;i<dots.length;i++){ const f = 0.2 + i*0.04; dots[i].style.left = (px - i*4) + 'px'; dots[i].style.top = (py - i*4) + 'px'; } requestAnimationFrame(loop); }
  loop();
})();
