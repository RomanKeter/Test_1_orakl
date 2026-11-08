function render(id, push=true){
  const page=pages[id];
  if(!page){showFeature(id);return;}
  if(push && state.current!==id) state.routeStack.push(id);
  state.current=id;
  const image=$('#screenImage');
  image.src=page.image; image.alt=page.alt;
  const shortScreens=['home','map','tarot','astrology'];
  $('#screenWrap').dataset.ratio=shortScreens.includes(id)?'short':'tall';
  const layer=$('#hotspots'); layer.replaceChildren();
  page.areas.forEach(([label,x,y,w,h,action])=>{
    const b=document.createElement('button');
    b.type='button'; b.className='hotspot'; b.setAttribute('aria-label',label); b.title=label;
    b.style.left=x+'%';b.style.top=y+'%';b.style.width=w+'%';b.style.height=h+'%';
    b.dataset.action=action;
    if(action.startsWith('toggle:')) b.setAttribute('aria-pressed',String(state.checks[label]??true));
    layer.append(b);
  });
  if(id==='themes') updateThemeMarker();
  if(push){history.pushState({page:id},'',`#${id}`);}
  closeDrawer(); closeModal();
}

function goBack(){
  if(state.routeStack.length>1) state.routeStack.pop();
  const target=state.routeStack[state.routeStack.length-1]||'home';
  render(target,false);
  history.replaceState({page:target},'',`#${target}`);
}

function updateThemeMarker(){
  const layer=$('#hotspots');
  layer.querySelectorAll('.theme-marker').forEach(node=>node.remove());
  // The reference artwork already shows Cabinet as the selected theme. Do not
  // paint a second check over it on the initial/default state.
  if(state.theme==='cabinet') return;
  const positions={magic:18.5,cyber:30.5,cabinet:42.5,garden:54.5,ocean:66.5,minimal:78.5};
  const reset=document.createElement('span');
  reset.className='theme-marker clear'; reset.setAttribute('aria-hidden','true');
  reset.style.top=positions.cabinet+'%'; reset.textContent=''; layer.append(reset);
  const marker=document.createElement('span');
  marker.className='theme-marker'; marker.setAttribute('aria-hidden','true');
  marker.style.top=(positions[state.theme]??positions.cabinet)+'%';
  marker.textContent='✓'; layer.append(marker);
}

async function unzipReferenceAssets(buffer){
  const bytes=new Uint8Array(buffer);
  const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const wanted=new Set(Object.values(pages).map(page=>page.image));
  const found=new Map();
  let offset=0;
  while(offset+30<=bytes.length && view.getUint32(offset,true)===0x04034b50){
    const flags=view.getUint16(offset+6,true);
    const method=view.getUint16(offset+8,true);
    const compressedSize=view.getUint32(offset+18,true);
    const uncompressedSize=view.getUint32(offset+22,true);
    const nameLength=view.getUint16(offset+26,true);
    const extraLength=view.getUint16(offset+28,true);
    if(flags & 0x08) throw new Error('ZIP uses a streaming data descriptor; please re-create the archive with a standard ZIP exporter.');
    if(flags & 0x01) throw new Error('ZIP archive is encrypted.');
    const nameStart=offset+30;
    const name=new TextDecoder().decode(bytes.subarray(nameStart,nameStart+nameLength));
    const dataStart=nameStart+nameLength+extraLength;
    const dataEnd=dataStart+compressedSize;
    if(dataEnd>bytes.length) throw new Error('ZIP archive is truncated.');
    if(wanted.has(name)){
      const compressed=bytes.subarray(dataStart,dataEnd);
      let decoded;
      if(method===0) decoded=compressed.slice();
      else if(method===8){
        if(typeof DecompressionStream==='undefined') throw new Error('This browser does not support ZIP decompression. Please update the browser.');
        const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        decoded=new Uint8Array(await new Response(stream).arrayBuffer());
      } else throw new Error('Unsupported ZIP compression method: '+method);
      if(decoded.byteLength!==uncompressedSize) throw new Error('The reference image '+name+' did not decompress correctly.');
      const cropSpec={
        'assets/home.webp':      {sx:0,sy:0,sw:290,sh:617,w:290,h:617},
        'assets/map.webp':       {sx:0,sy:0,sw:291,sh:617,w:291,h:617},
        'assets/tarot.webp':     {sx:0,sy:0,sw:291,sh:617,w:291,h:617},
        'assets/astrology.webp': {sx:22,sy:0,sw:291,sh:617,w:291,h:617},
        'assets/psychology.webp':{sx:0,sy:17,sw:290,sh:672,w:290,h:672},
        'assets/dreams.webp':    {sx:0,sy:17,sw:291,sh:672,w:291,h:672},
        'assets/arena.webp':     {sx:11,sy:7,sw:280,sh:682,w:280,h:682},
        'assets/themes.webp':    {sx:22,sy:7,sw:291,sh:682,w:291,h:682}
      };
      const spec=cropSpec[name];
      const bitmap=await createImageBitmap(new Blob([decoded],{type:'image/webp'}));
      const canvas=document.createElement('canvas');
      canvas.width=spec.w; canvas.height=spec.h;
      const context=canvas.getContext('2d',{alpha:false});
      const sx=Math.min(spec.sx,Math.max(0,bitmap.width-1));
      const sy=Math.min(spec.sy,Math.max(0,bitmap.height-1));
      const sw=Math.min(spec.sw,bitmap.width-sx);
      const sh=Math.min(spec.sh,bitmap.height-sy);
      context.drawImage(bitmap,sx,sy,sw,sh,0,0,spec.w,spec.h);
      bitmap.close?.();
      const cropped=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not crop '+name)),'image/webp',0.96));
      found.set(name,URL.createObjectURL(cropped));
    }
    offset=dataEnd;
  }
  const missing=[...wanted].filter(name=>!found.has(name));
  if(missing.length){
    for(const url of found.values()) URL.revokeObjectURL(url);
    throw new Error('The reference archive is missing: '+missing.join(', '));
  }
  return found;
}

async function boot(){
  const status=$('#loadingStatus');
  try{
    const response=await fetch(new URL('atlas-reference-assets.zip',document.baseURI),{cache:'no-cache'});
    if(!response.ok) throw new Error('Cannot load atlas-reference-assets.zip (HTTP '+response.status+').');
    imageUrls=await unzipReferenceAssets(await response.arrayBuffer());
    Object.values(pages).forEach(page=>{page.image=imageUrls.get(page.image);});
    const initial=location.hash.slice(1);
    state.routeStack=[pages[initial]?initial:'home'];
    render(state.routeStack[0],false);
    status?.remove();
    document.body.dataset.theme=state.theme;
  }catch(error){
    console.error('Atlas startup failed:',error);
    if(status) status.innerHTML='Не удалось загрузить иллюстрации Атласа.<br><small>Проверь, что atlas-reference-assets.zip находится в корне репозитория рядом с index.html.</small>';
  }
}
function showFeature(name){
  const copy=featureDescriptions[name]||'Этот раздел будет развиваться в следующих итерациях приложения.';
  openModal(name,`<p>${copy}</p><p class="modal-muted">Сейчас это временная демонстрационная версия.</p>`);
}
function openModal(title,body){
  $('#modalTitle').textContent=title;
  $('#modalBody').innerHTML=body;
  $('#modalBackdrop').hidden=false;
  $('#modalClose').focus();
}
function closeModal(){ $('#modalBackdrop').hidden=true; }
function closeDrawer(){ $('#drawer').classList.remove('open'); $('#drawerScrim').classList.remove('open'); $('#drawer').setAttribute('aria-hidden','true'); }
function showDrawer(){ $('#drawer').classList.add('open'); $('#drawerScrim').classList.add('open'); $('#drawer').setAttribute('aria-hidden','false'); }
let toastTimer;

function fitScreen(){
  const image=$('#screenImage');
  const wrap=$('#screenWrap');
  if(!image || !wrap || !image.naturalWidth || !image.naturalHeight) return;
  const ratio=image.naturalWidth/image.naturalHeight;
  const availableHeight=Math.max(260,window.innerHeight-(window.innerWidth<=700?14:40));
  const widthLimit=window.innerWidth<=700?window.innerWidth:460;
  const width=Math.max(220,Math.min(widthLimit,availableHeight*ratio));
  wrap.style.width=width+'px';
}
$('#screenImage').addEventListener('load',fitScreen);
window.addEventListener('resize',fitScreen,{passive:true});

function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400);}
function actionClick(action){
  const [kind,...rest]=action.split(':'); const value=rest.join(':');
  if(kind==='page') return render(value);
  if(kind==='menu') return showDrawer();
  if(kind==='notify') return openModal('Уведомления','<p>Новых уведомлений пока нет.</p><p>Здесь будут появляться сообщения, приглашения и события исследований.</p>');
  if(kind==='back') return goBack();
  if(kind==='feature') return showFeature(value);
  if(kind==='tab'){
    state.lastTab[state.current]=value;
    openModal(value,`<p>Открыта вкладка «${value}» в разделе «${pageTitle(state.current)}».</p><p>Содержимое вкладки пока демонстрационное; интерактивные материалы добавим при разработке функционала.</p>`);
    return;
  }
  if(kind==='toggle'){
    state.checks[value]=!state.checks[value];
    const control=$(`#hotspots .hotspot[aria-label="${CSS.escape(value)}"]`);
    control?.setAttribute('aria-pressed',String(state.checks[value]));
    toast(`${value}: ${state.checks[value]?'отмечено':'снята отметка'}`); return;
  }
  if(kind==='theme'){
    state.theme=value;storage.setItem('atlas-theme',value);document.body.dataset.theme=value;
    updateThemeMarker();
    toast(`Тема «${themeTitle(value)}» выбрана`);return;
  }
  if(kind==='diary'){
    const noteKey='atlas-diary:'+value;
    const saved=storage.getItem(noteKey)||'';
    openModal(value,`<p>Демонстрационная запись исследователя. Текст сохраняется локально в этом браузере.</p><textarea id="diaryText" placeholder="Запишите наблюдение, сон или заметку…">${escapeHtml(saved)}</textarea><button class="modal-action" id="saveDiary">Сохранить запись</button>`);
    $('#saveDiary').addEventListener('click',()=>{storage.setItem(noteKey,$('#diaryText').value);closeModal();toast('Запись сохранена на этом устройстве');});
    return;
  }
  if(kind==='duel'){
    openModal('Вход в дуэль','<p>Вы готовы принять учебный вызов?</p><p><b>Тема:</b> отношения в раскладе Таро.</p><button class="modal-action" id="confirmDuel">Принять вызов</button>');
    $('#confirmDuel').addEventListener('click',()=>{closeModal();toast('Дуэль принята. Ожидаем второго участника.');});return;
  }
  if(kind==='modal'){
    const copy=modalCopy[value]||`Демонстрационный раздел «${value}». Здесь появится соответствующий инструмент и временные учебные данные.`;
    openModal(value,`<p>${copy}</p>`);return;
  }
}
function pageTitle(id){return ({home:'Главная',map:'Карта исследований',tarot:'Таро',astrology:'Астрология',psychology:'Психология',dreams:'Сновидения',arena:'Арена Знаний',themes:'Темы оформления'})[id]||id;}
function themeTitle(id){return ({magic:'Магическая Академия',cyber:'Кибер-Лаборатория',cabinet:'Кабинет Исследователя',garden:'Восточный Сад',ocean:'Океан Глубин',minimal:'Минимализм'})[id]||id;}
function escapeHtml(value){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}

document.addEventListener('click',event=>{
  const hotspot=event.target.closest('.hotspot');
  if(hotspot){actionClick(hotspot.dataset.action);return;}
  const pageButton=event.target.closest('[data-page]');
  if(pageButton){render(pageButton.dataset.page);return;}
});
$('#closeDrawer').addEventListener('click',closeDrawer);
$('#drawerScrim').addEventListener('click',closeDrawer);
$('#modalClose').addEventListener('click',closeModal);
$('#modalBackdrop').addEventListener('click',event=>{if(event.target===$('#modalBackdrop'))closeModal();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){closeDrawer();closeModal();}});
window.addEventListener('popstate',event=>{const id=event.state?.page||location.hash.slice(1)||'home';if(pages[id]){const idx=state.routeStack.lastIndexOf(id);state.routeStack=idx>=0?state.routeStack.slice(0,idx+1):[...state.routeStack,id];render(id,false);}});
document.body.dataset.theme=state.theme;
boot();
