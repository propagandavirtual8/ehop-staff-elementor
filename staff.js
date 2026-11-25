const assetRoot=new URL('./',import.meta.url);
const release='2026-11-25c';
class EhopStaff extends HTMLElement {
 connectedCallback(){if(this._started)return;this._started=true;this.mount().catch(error=>{console.error('EHOP staff:',error);this.shadowRoot.replaceChildren(Object.assign(document.createElement('p'),{textContent:'Konten tim belum dapat dimuat. Silakan muat ulang halaman.'}));});}
 async mount(){
 const root=this.attachShadow({mode:'open'});let savedOverflow='';
 root.innerHTML='<p role="status" style="padding:32px;font:16px Arial">Memuat tim EHOP…</p>';
 const get=async file=>{const url=new URL(file,assetRoot);url.searchParams.set('v',release);const response=await fetch(url);if(!response.ok)throw new Error(file+': '+response.status);return response;};
 const [template,data]=await Promise.all([get('staff-template.html').then(r=>r.text()),get('staff-data.json').then(r=>r.json())]);
 const staff=data.staff;const imageBase=new URL(this.getAttribute('image-base')||data.imageBaseUrl,assetRoot);
 const stylesheet=document.createElement('link');stylesheet.rel='stylesheet';stylesheet.href=new URL('staff.css?v='+release,assetRoot).href;
 const styled=new Promise((resolve,reject)=>{stylesheet.onload=resolve;stylesheet.onerror=()=>reject(new Error('Stylesheet tidak dapat dimuat'));});
 root.replaceChildren(stylesheet);await styled;
 const fragment=document.createElement('template');fragment.innerHTML=template;root.append(fragment.content.cloneNode(true));
 root.querySelectorAll('[data-photo]').forEach(image=>{image.src=new URL(encodeURIComponent(image.dataset.photo)+'.png',imageBase).href;});
 root.querySelector('.give-cta').href=data.giveUrl;
 root.addEventListener('click',event=>{const anchor=event.target.closest('a[href^="#"]');if(!anchor)return;const destination=root.querySelector(anchor.getAttribute('href'));if(destination){event.preventDefault();destination.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}});
 const groups = {pengurus:'Pengurus Yayasan',manajemen:'Tim Manajemen',anggota:'Anggota Yayasan'};
const dialog=root.querySelector('#profile-dialog');
const search=root.querySelector('#search');
const cards=[];
let selectedGroup='all';
let previousFocus=null;
const photoPath=person=>new URL(encodeURIComponent(person.photo)+'.png',imageBase).href;

function openProfile(person,trigger){
  previousFocus=trigger;
  root.querySelector('#profile-name').textContent=person.name;
  root.querySelector('#profile-role').textContent=person.role;
  root.querySelector('#profile-group').textContent=groups[person.group];
  const image=root.querySelector('#profile-photo');image.src=photoPath(person);image.alt='Potret '+person.name;image.dataset.photoId=person.photo;
  root.querySelector('#profile-description').textContent=person.tier==='ketua'
    ? person.name+' tercantum sebagai Ketua Yayasan dalam struktur organisasi Yayasan EHOP Indonesia.'
    : person.name+' merupakan bagian dari '+groups[person.group].toLowerCase()+' dalam struktur organisasi Yayasan EHOP Indonesia.';
  dialog.showModal();savedOverflow=document.body.style.overflow;document.body.style.overflow='hidden';
}

staff.forEach(person=>{
  const button=document.createElement('button');button.type='button';button.className='person';
  button.setAttribute('aria-label','Kenali '+person.name+', '+person.role);button.setAttribute('aria-haspopup','dialog');
  const portrait=document.createElement('span');portrait.className='portrait';
  const image=document.createElement('img');image.src=photoPath(person);image.alt='';image.loading='lazy';image.decoding='async';image.dataset.photoId=person.photo;
  portrait.append(image);
  const plus=document.createElement('span');plus.className='person-plus';plus.textContent='+';plus.setAttribute('aria-hidden','true');portrait.append(plus);
  const caption=document.createElement('span');caption.className='hover-caption';caption.textContent='Kenali lebih dekat';caption.setAttribute('aria-hidden','true');portrait.append(caption);
  const info=document.createElement('span');info.className='person-info';
  const role=document.createElement('span');role.className='person-role';role.textContent=person.role;
  const name=document.createElement('span');name.className='person-name';name.textContent=person.name;
  info.append(role,name);button.append(portrait,info);
  button.addEventListener('click',()=>openProfile(person,button));
  root.querySelector('#'+person.tier+'-grid').append(button);cards.push({person,element:button});
});

function updateResults(){
  const query=search.value.trim().toLocaleLowerCase('id');let count=0;
  cards.forEach(({person,element})=>{const matchesGroup=selectedGroup==='all'||selectedGroup===person.group;
    const matchesText=(person.name+' '+person.role+' '+groups[person.group]).toLocaleLowerCase('id').includes(query);
    element.hidden=!(matchesGroup&&matchesText);if(!element.hidden){count++;element.classList.add('is-visible');}
  });
  root.querySelectorAll('.tier').forEach(tier=>{tier.hidden=!Array.from(tier.querySelectorAll('.person')).some(card=>!card.hidden);});
  root.querySelector('#empty-state').hidden=count!==0;
  root.querySelector('#result-count').textContent=count===13&&!query&&selectedGroup==='all'?'Menampilkan 13 orang dalam struktur organisasi.':'Menampilkan '+count+' dari 13 orang.';
  root.querySelector('#organization').classList.toggle('is-filtered',selectedGroup!=='all'||!!query);
}
root.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  selectedGroup=button.dataset.filter;
  root.querySelectorAll('[data-filter]').forEach(filter=>{const active=filter===button;filter.classList.toggle('active',active);filter.setAttribute('aria-pressed',String(active));});updateResults();
}));
search.addEventListener('input',updateResults);
root.querySelector('#reset-search').addEventListener('click',()=>{search.value='';root.querySelector('[data-filter="all"]').click();search.focus();});
const closeProfile=()=>dialog.close();
root.querySelector('.dialog-close').addEventListener('click',closeProfile);
root.querySelector('.dialog-done').addEventListener('click',closeProfile);
dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeProfile();}});
dialog.addEventListener('close',()=>{document.body.style.overflow=savedOverflow;previousFocus?.focus();});
if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
  root.querySelector('.ehop-app').classList.add('reveal-ready');
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}});},{threshold:.07});
  cards.forEach(({element})=>observer.observe(element));
}


 }
}
if(!customElements.get('ehop-staff'))customElements.define('ehop-staff',EhopStaff);
