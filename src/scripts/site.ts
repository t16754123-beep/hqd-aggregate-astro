import products from '../data/products.json';
const key='hqd-aggregate-shortlist-v1';
const known=new Set(products.map(p=>p.id));
const read=():string[]=>{try{const v=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(v)?[...new Set(v.filter((s:unknown)=>typeof s==='string'&&known.has(s)))]:[];}catch{return [];}};
let saved=read();
const toast=(message:string)=>{const el=document.querySelector<HTMLElement>('[data-toast]');if(!el)return;el.textContent=message;el.classList.add('visible');window.setTimeout(()=>el.classList.remove('visible'),2600);};
function refreshSaved(){document.querySelectorAll('[data-shortlist-count]').forEach(e=>e.textContent=String(saved.length));document.querySelectorAll<HTMLButtonElement>('[data-save]').forEach(b=>{const yes=saved.includes(b.dataset.save!);b.setAttribute('aria-pressed',String(yes));const label=b.querySelector('[data-save-label]');if(label)label.textContent=yes?'SAVED TO SHORTLIST':'ADD TO SHORTLIST';else{b.textContent=yes?'✓':'+';const p=products.find(p=>p.id===b.dataset.save);b.setAttribute('aria-label',`${yes?'Remove':'Add'} ${p?.model} ${yes?'from':'to'} shortlist`);}});}
function store(){try{localStorage.setItem(key,JSON.stringify(saved));}catch{toast('Browser storage is unavailable. Your selection is kept for this page.');}refreshSaved();}
document.addEventListener('click',event=>{const b=(event.target as Element).closest<HTMLButtonElement>('[data-save]');if(!b)return;const id=b.dataset.save!;if(!known.has(id))return;const yes=saved.includes(id);saved=yes?saved.filter(x=>x!==id):[...saved,id];store();toast(yes?'Removed from your shortlist.':'Added to your shortlist.');});
window.addEventListener('storage',()=>{saved=read();refreshSaved();renderShortlist();});
refreshSaved();
const toggle=document.querySelector<HTMLButtonElement>('.menu-toggle'),nav=document.querySelector<HTMLElement>('#primary-nav');
toggle?.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav?.classList.toggle('open',open);});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&toggle?.getAttribute('aria-expanded')==='true'){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');nav?.classList.remove('open');toggle.focus();}});
const finder=document.querySelector<HTMLElement>('[data-finder]');
if(finder){
 const cards=[...finder.querySelectorAll<HTMLElement>('[data-product-card]')];const input=finder.querySelector<HTMLInputElement>('input[name=search]')!;const sort=finder.querySelector<HTMLSelectElement>('select[name=sort]')!;const params=new URLSearchParams(location.search);
 for(const name of ['interface','family','operation']){for(const value of params.getAll(name)){finder.querySelectorAll<HTMLInputElement>(`input[name=${name}]`).forEach(c=>{if(c.value===value)c.checked=true;});}}
 input.value=params.get('q')||'';
 const apply=()=>{const checks=(name:string)=>[...finder.querySelectorAll<HTMLInputElement>(`input[name=${name}]:checked`)].map(i=>i.value);const types=checks('interface'),families=checks('family'),ops=checks('operation'),q=input.value.trim().toLowerCase();let count=0;
  cards.forEach(card=>{const match=(!types.length||types.includes(card.dataset.interface!))&&(!families.length||families.includes(card.dataset.family!))&&(!ops.length||ops.some(o=>card.dataset.operations!.split(',').includes(o)))&&(!q||card.dataset.search!.includes(q));card.hidden=!match;if(match)count++;});
  const ordered=[...cards];if(sort.value==='model')ordered.sort((a,b)=>products.find(p=>p.id===a.dataset.id)!.model.localeCompare(products.find(p=>p.id===b.dataset.id)!.model));if(sort.value==='outputs')ordered.sort((a,b)=>products.find(p=>p.id===a.dataset.id)!.outputs-products.find(p=>p.id===b.dataset.id)!.outputs);const grid=finder.querySelector('.finder-grid')!;ordered.forEach(c=>grid.append(c));finder.querySelector('[data-result-count]')!.textContent=String(count);finder.querySelector<HTMLElement>('[data-empty]')!.hidden=count!==0;
  const url=new URL(location.href);url.search='';for(const name of ['interface','family','operation'])checks(name).forEach(v=>url.searchParams.append(name,v));if(q)url.searchParams.set('q',input.value.trim());history.replaceState(null,'',url.pathname+url.search);
 };
 finder.addEventListener('input',apply);finder.addEventListener('change',apply);finder.querySelectorAll('[data-reset]').forEach(b=>b.addEventListener('click',()=>{finder.querySelectorAll<HTMLInputElement>('input[type=checkbox]').forEach(c=>c.checked=false);input.value='';sort.value='default';apply();}));apply();
}
document.querySelectorAll<HTMLElement>('[data-gallery]').forEach(g=>{const main=g.querySelector<HTMLImageElement>('[data-main-image]')!,dialog=g.querySelector<HTMLDialogElement>('[data-image-dialog]')!,large=g.querySelector<HTMLImageElement>('[data-dialog-image]')!;g.querySelectorAll<HTMLButtonElement>('[data-gallery-image]').forEach(b=>b.addEventListener('click',()=>{main.src=b.dataset.galleryImage!;large.src=main.src;g.querySelectorAll('[data-gallery-image]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}));g.querySelector('[data-zoom]')?.addEventListener('click',()=>{large.src=main.src;dialog.showModal();});g.querySelector('[data-close-dialog]')?.addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});});
document.querySelector('[data-print]')?.addEventListener('click',()=>window.print());
const shortlist=document.querySelector<HTMLElement>('[data-shortlist]');
function element(tag:string,text?:string,cls?:string){const e=document.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
function renderShortlist(){if(!shortlist)return;shortlist.replaceChildren();const selected=products.filter(p=>saved.includes(p.id));document.querySelector<HTMLElement>('[data-shortlist-empty]')!.hidden=selected.length>0;document.querySelector<HTMLElement>('[data-shortlist-actions]')!.hidden=!selected.length;
 selected.forEach(p=>{const card=element('article',undefined,'shortlist-card');const image=document.createElement('img');image.src=p.image;image.alt=p.model;image.width=130;image.height=130;card.append(image);const body=element('div'),h=element('h2'),a=document.createElement('a');a.href=`/products/${p.slug}/`;a.textContent=p.model;h.append(a);body.append(h,element('p',`${p.name} · ${p.interface} · ${p.outputs} output${p.outputs>1?'s':''}`));card.append(body);const remove=document.createElement('button');remove.type='button';remove.className='remove';remove.textContent='REMOVE ×';remove.setAttribute('aria-label',`Remove ${p.model}`);remove.addEventListener('click',()=>{saved=saved.filter(x=>x!==p.id);store();renderShortlist();});card.append(remove);shortlist.append(card);});
 const enquire=document.querySelector<HTMLAnchorElement>('[data-enquire-shortlist]');if(enquire)enquire.href='/contact/?product='+encodeURIComponent(selected.map(p=>p.model).join(', '));
 const comparison=document.querySelector<HTMLElement>('[data-comparison]')!;comparison.replaceChildren();comparison.hidden=selected.length<2;if(selected.length>=2){comparison.append(element('h2','Your selection at a glance.'));const table=document.createElement('table'),thead=document.createElement('thead'),head=document.createElement('tr');head.append(element('th','Model'));selected.forEach(p=>head.append(element('th',p.model)));thead.append(head);table.append(thead);const tbody=document.createElement('tbody');for(const [label,value] of [['Connection',(p:typeof products[number])=>p.interface],['Configuration',(p:typeof products[number])=>p.family],['Outputs',(p:typeof products[number])=>String(p.outputs)],['Tooling',()=>'ER25'],['Machining',(p:typeof products[number])=>p.operations.join(', ')] ] as const){const row=document.createElement('tr'),th=element('th',label);th.setAttribute('scope','row');row.append(th);selected.forEach(p=>row.append(element('td',value(p))));tbody.append(row);}table.append(tbody);comparison.append(table);}}
renderShortlist();document.querySelector('[data-clear-shortlist]')?.addEventListener('click',()=>{saved=[];store();renderShortlist();});
const form=document.querySelector<HTMLFormElement>('[data-enquiry-form]');
if(form){
 const model=form.querySelector<HTMLInputElement>('[name=product]')!;
 const selectedModel=new URLSearchParams(location.search).get('product')||'';
 model.value=selectedModel;
 const button=form.querySelector<HTMLButtonElement>('[data-submit-button]')!;
 const label=form.querySelector<HTMLElement>('[data-submit-label]')!;
 const result=form.querySelector<HTMLElement>('[data-form-result]')!;
 let submitting=false;
 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(submitting||!form.reportValidity())return;
  submitting=true;button.disabled=true;label.textContent='SENDING…';form.setAttribute('aria-busy','true');
  result.hidden=false;result.classList.remove('is-error');result.replaceChildren(element('p','Sending your enquiry…'));
  try{
   const data=new FormData(form);
   const payload=Object.fromEntries(['name','company','email','phone','product','machine','message','website'].map(name=>[name,String(data.get(name)||'')]));
   const response=await fetch(form.action,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},credentials:'same-origin',body:JSON.stringify(payload),signal:AbortSignal.timeout(22000)});
   const delivery=await response.json().catch(()=>null);
   if(!response.ok||delivery?.ok!==true){
    const fallback='Online delivery is temporarily unavailable. Please try again or email HQD directly.';
    const message=typeof delivery?.message==='string'?delivery.message:fallback;
    throw new Error(message);
   }
   result.replaceChildren(element('p','Your enquiry has been submitted. Thank you — HQD will be in touch.'));
   form.reset();model.value=selectedModel;
  }catch(error){
   result.classList.add('is-error');
   const message=error instanceof Error&&error.name!=='TimeoutError'&&error.name!=='AbortError'?error.message:'The request timed out. Your details are still in the form. Please try again or email HQD directly.';
   result.replaceChildren(element('p',message));
   const contact=document.createElement('a');contact.href='mailto:lisa@hqd-spindlemotor.com';contact.textContent='EMAIL HQD DIRECTLY ↗';result.append(contact);
  }finally{
   submitting=false;button.disabled=false;label.textContent='SEND ENQUIRY';form.removeAttribute('aria-busy');result.focus();
  }
 });
}
