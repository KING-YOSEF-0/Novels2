const books = window.STORY_LIBRARY || [];
const grid = document.querySelector('#bookGrid');
const reader = document.querySelector('#reader');
const searchInput = document.querySelector('#searchInput');
const savedKey = 'gilded-lantern-saved';
let saved = new Set(JSON.parse(localStorage.getItem(savedKey) || '[]'));
let filter = 'all';
let activeBook = 0;
let fontSize = 20;
let toastTimer;
const $ = (s) => document.querySelector(s);
const escapeText = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function excerpt(text) {
  const p = text.split(/\n\s*\n/).find(x => x.trim() && !/^(chapter|the moral|story \d)/i.test(x.trim()));
  return (p || 'A little tale for the road ahead.').replace(/\s+/g,' ').slice(0,128).replace(/\s+\S*$/,'') + '…';
}
function saveState(){ localStorage.setItem(savedKey, JSON.stringify([...saved])); }
function updateCounts(){ $('#allCount').textContent=books.length; $('#savedCount').textContent=saved.size; }
function render(){
  const q=searchInput.value.trim().toLowerCase();
  const visible=books.map((b,i)=>({...b,index:i})).filter(b=>{
    const kind=b.index===0?'novel':'story';
    return (filter==='all'||filter===kind||(filter==='saved'&&saved.has(b.id))) && (!q||`${b.title} ${b.kind} ${b.body}`.toLowerCase().includes(q));
  });
  grid.innerHTML=visible.map((b,n)=>`<article class="book-card" style="--tilt:${n%2?'.5deg':'-.5deg'}"><div class="card-top"><span class="book-symbol" aria-hidden="true">${b.index===0?'☼':['✧','❧','✦','☾','❋'][b.index%5]}</span><button class="bookmark ${saved.has(b.id)?'saved':''}" data-save="${escapeText(b.id)}" aria-label="${saved.has(b.id)?'Remove from':'Save to'} favorites" title="${saved.has(b.id)?'Saved':'Save this story'}">${saved.has(b.id)?'♥':'♡'}</button></div><div class="book-number">${b.index===0?'The featured novel':`Tale No. ${String(b.index).padStart(2,'0')}`}</div><h3>${escapeText(b.title)}</h3><p>${escapeText(excerpt(b.body))}</p><div class="card-bottom"><span class="kind">${escapeText(b.kind)}</span><button class="read-button" data-open="${b.index}">${b.index===0?'Open the novel':'Read the tale'} <span>↗</span></button></div></article>`).join('');
  $('#shelfCount').textContent=`${visible.length} ${visible.length===1?'volume':'volumes'}`;
  $('#emptyState').hidden=visible.length>0;
  updateCounts();
}
function showToast(text){const t=$('#toast');t.textContent=text;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),1800)}
function openBook(index){activeBook=(index+books.length)%books.length;const b=books[activeBook];$('#readerMeta').textContent=`${b.kind}  ·  ${activeBook===0?'The complete novel':`Tale ${String(activeBook).padStart(2,'0')} of 30`}`;$('#readerTitle').textContent=b.title;$('#readerPosition').textContent=`${activeBook+1} / ${books.length}`;$('#readerSave').innerHTML=saved.has(b.id)?'♥ Saved':'♡ Save';$('#readerSave').setAttribute('aria-pressed',saved.has(b.id));$('#prevBook').disabled=activeBook===0;$('#prevBook').style.opacity=activeBook===0?'.35':'1';$('#nextBook').disabled=activeBook===books.length-1;$('#nextBook').style.opacity=activeBook===books.length-1?'.35':'1';
  const blocks=b.body.split(/\n\s*\n/).map(x=>x.trim()).filter(Boolean);
  $('#readerContent').innerHTML=blocks.map(x=>{const clean=escapeText(x).replace(/\n/g,' ');if(/^(chapter|CHAPTER)\s+/i.test(x))return `<h3>${clean}</h3>`;if(/^(the moral of the story|THE MORAL OF THE STORY)/i.test(x))return `<h3>${clean}</h3>`;return `<p>${clean}</p>`}).join('');
  $('#readerContent').style.fontSize=`${fontSize}px`;reader.showModal();$('#readerContent').scrollTop=0;document.body.style.overflow='hidden';
}
function closeBook(){reader.close();document.body.style.overflow=''}
grid.addEventListener('click',e=>{const save=e.target.closest('[data-save]');if(save){const id=save.dataset.save;if(saved.has(id))saved.delete(id);else saved.add(id);saveState();render();return}const open=e.target.closest('[data-open]');if(open)openBook(Number(open.dataset.open))});
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('.filter').forEach(b=>b.classList.toggle('active',b===button));render()}));
searchInput.addEventListener('input',render);
$('#closeReader').addEventListener('click',closeBook);
reader.addEventListener('click',e=>{if(e.target===reader)closeBook()});
reader.addEventListener('close',()=>document.body.style.overflow='');
$('#readerSave').addEventListener('click',()=>{const id=books[activeBook].id;if(saved.has(id))saved.delete(id);else saved.add(id);saveState();render();$('#readerSave').innerHTML=saved.has(id)?'♥ Saved':'♡ Save';showToast(saved.has(id)?'Tucked away on your saved shelf.':'Removed from your saved shelf.')});
$('#prevBook').addEventListener('click',()=>activeBook>0&&openBook(activeBook-1));$('#nextBook').addEventListener('click',()=>activeBook<books.length-1&&openBook(activeBook+1));
$('#fontDown').addEventListener('click',()=>{fontSize=Math.max(16,fontSize-1);$('#readerContent').style.fontSize=`${fontSize}px`});$('#fontUp').addEventListener('click',()=>{fontSize=Math.min(27,fontSize+1);$('#readerContent').style.fontSize=`${fontSize}px`});
document.addEventListener('keydown',e=>{if(!reader.open)return;if(e.key==='ArrowRight')$('#nextBook').click();if(e.key==='ArrowLeft')$('#prevBook').click()});
$('#soundToggle').addEventListener('click',e=>{const b=e.currentTarget,quiet=b.getAttribute('aria-pressed')==='true';b.setAttribute('aria-pressed',String(!quiet));b.querySelector('.sound-label').textContent=quiet?'Quiet mode':'Ambience off';b.querySelector('.sound-icon').textContent=quiet?'♫':'♪';showToast(quiet?'Quiet mode restored.':'This library keeps its quiet.');});
$('#year').textContent=new Date().getFullYear();
render();