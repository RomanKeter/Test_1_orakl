(() => {
'use strict';
const names=['home','map','tarot','astrology','psychology','dreams','arena','themes'];
const labels={home:'Главная',map:'Карта исследований',tarot:'Таро',astrology:'Астрология',psychology:'Психология',dreams:'Сновидения',arena:'Арена Знаний',themes:'Темы оформления',profiling:'Профайлинг',nlp:'NLP',numerology:'Нумерология',lab:'Лаборатория'};
const descriptions={home:'Личное пространство для исследования символов, знаний и взаимосвязей.',map:'Схема направлений Атласа и взаимосвязей между областями знаний.',tarot:'Архетипы, символы, значения карт и практика чтения раскладов.',astrology:'Натальная карта, дома, аспекты, транзиты и астрологические циклы.',psychology:'Самопознание, эмоции, мышление и поведенческие практики.',dreams:'Дневник сновидений, повторяющиеся образы и личные ассоциации.',arena:'Дуэли, турниры и интеллектуальные состязания исследователей.',themes:'Выбор визуальной атмосферы рабочего пространства.'};
const pages={home:{w:290,h:617},map:{w:291,h:617},tarot:{w:291,h:617},astrology:{w:315,h:617},psychology:{w:290,h:689},dreams:{w:291,h:689},arena:{w:291,h:689},themes:{w:315,h:689}};
const trims={psychology:{left:0,top:16},dreams:{left:0,top:16},arena:{left:14,top:16},themes:{left:18,top:16}};
const screens=document.getElementById('screens'),loading=document.getElementById('loading'),error=document.getElementById('error'),urls={};let current='home';const navigationStack=['home'];
const pct=(page,x,y,w,h)=>{const p=pages[page],c=trims[page]||{left:0,top:0},x1=Math.max(x,c.left),y1=Math.max(y,c.top),x2=Math.min(x+w,p.w),y2=Math.min(y+h,p.h),cw=p.w-c.left,ch=p.h-c.top;return{left:(x1-c.left)/cw*100,top:(y1-c.top)/ch*100,width:Math.max(0,x2-x1)/cw*100,height:Math.max(0,y2-y1)/ch*100};};
const hotspot=(page,label,x,y,w,h,action)=>({page,label,...pct(page,x,y,w,h),action});
const map={
home:[hotspot('home','Открыть меню',5,26,36,48,'menu'),hotspot('home','Уведомления',237,22,48,48,'notifications'),...['tarot','astrology','psychology','info:Профайлинг','info:NLP','info:Нумерология','dreams','info:Лаборатория'].map((id,i)=>hotspot('home',labels[id]||id.replace('info:',''),12,[178,222,263,303,344,385,426,467][i],264,39,id.startsWith('info:')?id:'go:'+id)),...['Главная','Обучение','Арена','Сообщество','Профиль'].map((label,i)=>hotspot('home',label,i*58,527,58,88,['go:home','go:map','go:arena','info:Сообщество','info:Профиль'][i]))],
map:[hotspot('map','Назад',0,0,54,64,'back'),hotspot('map','Таро',102,74,94,112,'go:tarot'),hotspot('map','Астрология',8,160,113,125,'go:astrology'),hotspot('map','Психология',175,158,108,125,'go:psychology'),hotspot('map','Профайлинг',6,277,113,130,'info:Профайлинг'),hotspot('map','NLP',178,274,105,132,'info:NLP'),hotspot('map','Нумерология',30,394,112,119,'info:Нумерология'),hotspot('map','Сновидения',165,390,113,121,'go:dreams'),hotspot('map','Лаборатория',20,511,253,99,'info:Лаборатория')],
tarot:[hotspot('tarot','Назад',0,0,53,65,'back'),...['Обучение','Практика','Колоды'].map((t,i)=>hotspot('tarot',t,25+i*88,79,88,42,'tab:'+t)),hotspot('tarot','Карта Звезда',10,136,170,247,'card:star'),...['Значение','Символика','Сочетания','Практика','Заметки'].map((t,i)=>hotspot('tarot',t,180,157+i*39,108,37,'info:'+t)),...['Расклады','Экзамен','Дуэли','Конструктор','Библиотека','Дневник'].map((t,i)=>hotspot('tarot',t,5+(i%3)*96,400+Math.floor(i/3)*100,92,92,'info:'+t))],
astrology:[hotspot('astrology','Назад',0,0,54,64,'back'),...['Натал','Транзиты','Прогноз','Синастрия'].map((t,i)=>hotspot('astrology',t,31+i*68,82,66,40,'tab:'+t)),hotspot('astrology','Натальная карта',28,129,258,264,'info:Натальная карта'),...['Анализ карты','Дома','Аспекты','Релокация','Календарь','Обучение'].map((t,i)=>hotspot('astrology',t,18+(i%3)*100,402+Math.floor(i/3)*101,92,95,'info:'+t))],
psychology:[hotspot('psychology','Назад',0,0,52,61,'back'),...['Самопознание','Отношения','Практики'].map((t,i)=>hotspot('psychology',t,10+i*95,108,95,42,'tab:'+t)),...['Эмоции','Мышление','Поведение','Убеждения','Привязанность'].map((t,i)=>hotspot('psychology',t,185,172+i*31,100,27,'toggle:'+t)),...['Тесты','Упражнения','Дневник эмоций','Когнитивные искажения','Техники (КБТ)','Проекты развития'].map((t,i)=>hotspot('psychology',t,4+(i%3)*96,396+Math.floor(i/3)*85,92,82,'info:'+t))],
dreams:[hotspot('dreams','Назад',0,0,50,62,'back'),hotspot('dreams','Дневник снов',5,270,280,160,'info:Дневник снов'),...['Записать сон','Толкование','Повторы','Символы','Анализ психики','Карта снов'].map((t,i)=>hotspot('dreams',t,4+(i%3)*96,430+Math.floor(i/3)*82,92,82,'info:'+t))],
arena:[hotspot('arena','Назад',0,0,50,60,'back'),...['Дуэль','Турнир','Лига','Гильдии'].map((t,i)=>hotspot('arena',t,25+i*70,85,66,38,'tab:'+t)),hotspot('arena','Войти в дуэль',22,500,247,55,'duel'),...['Рейтинг','История','Правила'].map((t,i)=>hotspot('arena',t,[26,122,224][i],556,[90,98,67][i],82,'info:'+t))],
themes:[hotspot('themes','Назад',32,48,38,38,'back'),...['Магическая Академия','Кибер-Лаборатория','Кабинет Исследователя','Восточный Сад','Океан Глубин','Минимализм'].map((t,i)=>hotspot('themes',t,34,96+i*80,270,72,'theme:'+t))]
};
const details={'card:star':['XVII — Звезда','Надежда, восстановление, вдохновение и доверие к будущему. В учебной трактовке карта предлагает заметить ресурс, который помогает восстановиться после непростого периода.'],'Расклады':['Расклады Таро','Демо-библиотека раскладов: «Три карты», «Кельтский крест», «Выбор пути».'],'Экзамен':['Экзамен','Временный учебный режим: вопросы по старшим арканам, символике и сочетаниям.'],'Дуэли':['Дуэли','Соревнование двух исследователей: трактовка ситуации, аргументация и оценка ответа.'],'Конструктор':['Конструктор раскладов','Создание собственных схем, позиций и авторских раскладов.'],'Библиотека':['Библиотека','Колоды, справочники, заметки и учебные материалы.'],'Дневник':['Дневник исследователя','Личные наблюдения, вопросы, результаты раскладов и выводы.'],'Профайлинг':['Профайлинг','Учебные кейсы по наблюдению за поведением, стилями коммуникации и проверке гипотез.'],'NLP':['NLP','Демонстрационные упражнения по языковым моделям, метафорам и коммуникации.'],'Нумерология':['Нумерология','Временный раздел для символических числовых систем, расчётов и заметок.'],'Лаборатория':['Междисциплинарная лаборатория','Пространство для объединения Таро, астрологии, психологии и других областей в одном исследовании.']};
function syncDesktop(page){document.querySelectorAll('[data-nav]').forEach(b=>{const active=b.dataset.nav===page;b.classList.toggle('active',active);const text=b.querySelector('b')?.textContent.trim()||b.textContent.trim();b.setAttribute('aria-label',text);b.title=text;if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});document.getElementById('devicePageName').textContent=labels[page]||page;document.getElementById('contextTitle').textContent=labels[page]||page;document.getElementById('contextDescription').textContent=descriptions[page]||'Демонстрационный раздел Атласа Познания.';document.getElementById('contextStatus').textContent='Открыто · '+new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(new Date());}
function showModal(title,body){document.getElementById('modalTitle').textContent=title;document.getElementById('modalBody').innerHTML=body;document.getElementById('modal').hidden=false;document.getElementById('modalOk').focus();}
function closeModal(){document.getElementById('modal').hidden=true;}
function renderPage(id,pushHistory=false){current=id;document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.dataset.page===id));syncDesktop(id);if(pushHistory)history.pushState({page:id},'','#'+id);else history.replaceState({page:id},'','#'+id);document.getElementById('screens').scrollTop=0;window.scrollTo({top:0,behavior:'smooth'});}
function navigate(id){if(!pages[id])return;if(id!==current){navigationStack.push(id);renderPage(id,true);}}
function goBack(){if(navigationStack.length>1)navigationStack.pop();renderPage(navigationStack[navigationStack.length-1]||'home');}

const ATLAS_DATA = window.ATLAS_DATA || {};
const STORAGE_KEY = 'atlas-knowledge-v1';
const baseState = { theme:'cabinet', tarotNotes:[], spreads:[], customSpreads:[], dreams:[], emotions:[], thoughts:[], projects:[], duelHistory:[], astroProfile:null, synastry:null, relocation:[], profilingNotes:[], researchNotes:[], psychChecks:{'Эмоции':true,'Мышление':true,'Поведение':true,'Убеждения':true,'Привязанность':true}, deck:'Классика Уэйта' };
function loadUserState(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    return {...baseState,...saved,psychChecks:{...baseState.psychChecks,...(saved.psychChecks||{})}};
  }catch(error){console.warn('Не удалось прочитать локальные данные Атласа:',error);return {...baseState};}
}
const userState=loadUserState();
let activeQuiz=null;let lastQuizKind='tarot';
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(userState));return true;}catch(error){console.error('Ошибка сохранения локальных данных:',error);showModal('Не удалось сохранить','<p>Браузер не разрешил сохранить данные. Проверь настройки хранилища или режим приватного просмотра.</p>');return false;}}
function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function modalContent(title,html){activeQuiz=null;showModal(title,html);}
function dateLabel(value){if(!value)return 'Без даты';const d=new Date(value);return Number.isNaN(d.valueOf())?esc(value):new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(d);}
function field(label,name,placeholder='',value='',type='text',required=true){return '<label class="atlas-field"><span>'+esc(label)+'</span><input name="'+esc(name)+'" type="'+type+'" placeholder="'+esc(placeholder)+'" value="'+esc(value)+'" '+(required?'required':'')+'></label>';}
function areaField(label,name,placeholder='',value='',required=true){return '<label class="atlas-field"><span>'+esc(label)+'</span><textarea name="'+esc(name)+'" rows="3" placeholder="'+esc(placeholder)+'" '+(required?'required':'')+'>'+esc(value)+'</textarea></label>';}
function selectField(label,name,options,selected=''){return '<label class="atlas-field"><span>'+esc(label)+'</span><select name="'+esc(name)+'">'+options.map(o=>'<option value="'+esc(o.value)+'" '+(o.value===selected?'selected':'')+'>'+esc(o.label)+'</option>').join('')+'</select></label>';}
function actionButton(label,action,extra=''){return '<button type="button" class="atlas-button" data-modal-action="'+esc(action)+'" '+extra+'>'+esc(label)+'</button>';}
function itemList(items){return '<ul class="atlas-list">'+items.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul>';}
function renderSavedEntries(entries,empty,kind){if(!entries.length)return '<p class="atlas-empty">'+esc(empty)+'</p>';return '<div class="atlas-saved-list">'+entries.slice().reverse().map(entry=>'<article class="atlas-saved-item"><div><b>'+esc(entry.title||entry.name||entry.mood||entry.date||'Запись')+'</b><small>'+esc(dateLabel(entry.createdAt||entry.date))+'</small><p>'+esc(entry.text||entry.note||entry.summary||'')+'</p></div>'+(kind?'<button type="button" class="atlas-mini-button" data-modal-action="delete-entry" data-kind="'+esc(kind)+'" data-id="'+esc(entry.id)+'" aria-label="Удалить запись">×</button>':'')+'</article>').join('')+'</div>';}
function findCard(name){return (ATLAS_DATA.tarotCards||[]).find(card=>card.name===name)||(ATLAS_DATA.tarotCards||[])[0];}
function renderTarotTab(tab){
  if(tab==='Практика'){
    const options=(ATLAS_DATA.spreads||[]).map(s=>({value:s.id,label:s.name+' — '+s.description}));
    modalContent('Таро · Практика','<p>Выберите схему. Карты вытягиваются случайно из временной учебной колоды; это демонстрация механики, а не предсказание.</p><form data-form="draw-spread">'+selectField('Схема расклада','spread',options,'three')+'<button class="atlas-button primary" type="submit">Вытянуть карты</button></form><div id="spreadResult"></div><h3 class="atlas-subheading">Последние расклады</h3>'+renderSavedEntries(userState.spreads,'Сохранённых раскладов пока нет.','spread'));
    return;
  }
  if(tab==='Колоды'){
    const decks=['Классика Уэйта','Тёмная академия','Ботаническая колода','Мифы и легенды'];
    modalContent('Таро · Колоды','<p>Выберите учебную колоду. Сейчас различается название и сохранённый выбор; отдельные изображения и значения колод можно добавить позднее.</p><div class="atlas-choice-list">'+decks.map(deck=>'<button type="button" class="atlas-choice '+(userState.deck===deck?'chosen':'')+'" data-modal-action="choose-deck" data-deck="'+esc(deck)+'"><span>♧</span><b>'+esc(deck)+'</b><i>'+(userState.deck===deck?'✓':'○')+'</i></button>').join('')+'</div>');
    return;
  }
  const card=findCard('Звезда');
  modalContent('Таро · Обучение','<p>Изучайте арканы по отдельности и сравнивайте ключевые значения с символами и контекстом вопроса.</p><article class="atlas-feature-card"><b>'+esc(card.number+' — '+card.name)+'</b><small>'+esc(card.keywords)+'</small><p>'+esc(card.meaning)+'</p>'+actionButton('Открыть подробный разбор','open-card','data-card="Звезда"')+'</article><h3 class="atlas-subheading">Учебная библиотека</h3><div class="atlas-card-grid">'+(ATLAS_DATA.tarotCards||[]).map(c=>'<button type="button" class="atlas-card-option" data-modal-action="open-card" data-card="'+esc(c.name)+'"><b>'+esc(c.number)+'</b><span>'+esc(c.name)+'</span></button>').join('')+'</div>');
}
function renderTarotCard(name){
  const card=findCard(name);
  if(!card)return showModal('Карта не найдена','<p>Этой карты пока нет в демонстрационной библиотеке.</p>');
  modalContent(card.number+' — '+card.name,'<p class="atlas-kicker">'+esc(card.keywords)+'</p><h3 class="atlas-subheading">Основное значение</h3><p>'+esc(card.meaning)+'</p><h3 class="atlas-subheading">Символика</h3><p>'+esc(card.symbols)+'</p><div class="atlas-two-columns"><div><b>Прямое положение</b><p>'+esc(card.upright)+'</p></div><div><b>Перевёрнутое положение</b><p>'+esc(card.reversed)+'</p></div></div>'+actionButton('Добавить личную заметку','note-card','data-card="'+esc(card.name)+'"'));
}
function openTarotNote(cardName='Звезда'){
  const previous=userState.tarotNotes.find(n=>n.card===cardName);
  modalContent('Заметки · '+cardName,'<form data-form="tarot-note"><input type="hidden" name="card" value="'+esc(cardName)+'">'+areaField('Ваша трактовка или наблюдение','text','Что важно запомнить?',previous?.text||'')+'<button class="atlas-button primary" type="submit">Сохранить заметку</button></form><h3 class="atlas-subheading">Сохранённые заметки</h3>'+renderSavedEntries(userState.tarotNotes,'Пока нет заметок.','tarot-note'));
}
function openSpreadBuilder(){
  modalContent('Конструктор расклада','<p>Создайте простую схему и задайте названия позиций. Конструктор сохраняет структуру локально.</p><form data-form="custom-spread">'+field('Название расклада','title','Например, «Путь решения»')+areaField('Позиции — по одной в строке','positions','Ситуация\\nРесурсы\\nСледующий шаг')+'<button class="atlas-button primary" type="submit">Сохранить схему</button></form><h3 class="atlas-subheading">Мои схемы</h3>'+itemList(userState.customSpreads.map(s=>s.title+' · '+s.positions.join(' / '))));
}
function startQuiz(kind){
  lastQuizKind=kind;
  const questions=kind==='tarot'?(ATLAS_DATA.tarotExam||[]):(ATLAS_DATA.psychology?.test||[]);
  activeQuiz={kind,questions,index:0,score:0,answer:null};
  renderQuizStep();
}
function renderQuizStep(){
  const quiz=activeQuiz;if(!quiz)return;
  if(quiz.index>=quiz.questions.length){const total=quiz.questions.length;modalContent(quiz.kind==='tarot'?'Результат экзамена по Таро':'Результат упражнения','<div class="atlas-result-score">'+quiz.score+' / '+total+'</div><p>Верных ответов: '+quiz.score+' из '+total+'. Результат сохранён только в текущем сеансе и служит учебной обратной связью.</p>'+actionButton('Пройти ещё раз','restart-quiz')+actionButton('Закрыть','close-modal'));return;}
  const q=quiz.questions[quiz.index];
  showModal(quiz.kind==='tarot'?'Экзамен по Таро':'Тест для самонаблюдения','<div class="atlas-progress"><span style="width:'+((quiz.index+1)/quiz.questions.length*100)+'%"></span></div><small class="atlas-muted">Вопрос '+(quiz.index+1)+' из '+quiz.questions.length+'</small><h3 class="atlas-question">'+esc(q.q)+'</h3><div class="atlas-quiz-options">'+q.a.map((a,i)=>'<button type="button" class="atlas-quiz-option" data-quiz-option="'+i+'" '+(quiz.answer!==null?'disabled':'')+'>'+esc(a)+'</button>').join('')+'</div>'+(quiz.answer===null?'':'<div class="atlas-feedback '+(quiz.answer===q.correct?'correct':'incorrect')+'"><b>'+(quiz.answer===q.correct?'Верно':'Не совсем')+'</b><p>'+esc(q.why||q.a[q.correct])+'</p></div><button type="button" class="atlas-button primary" data-modal-action="quiz-next">'+(quiz.index===quiz.questions.length-1?'Завершить':'Следующий вопрос')+'</button>'));
}
function renderAstrologyTab(tab){
  const info=ATLAS_DATA.astrology?.tabs?.[tab];
  if(!info)return;
  if(tab==='Натал'){openBirthProfile();return;}
  if(tab==='Синастрия'){openSynastry();return;}
  modalContent(info.title,'<p>'+esc(info.text)+'</p>'+itemList(info.items)+'<p class="atlas-disclaimer">Демонстрационные сведения. Реальные эфемериды и расчёт карты не подключены.</p>');
}
function openBirthProfile(){
  const p=userState.astroProfile||{};
  modalContent('Астрология · Натальные данные','<p>Заполните исходные сведения. Пока они сохраняются как профиль; астрономический расчёт координат планет на этом этапе не выполняется.</p><form data-form="astro-profile">'+field('Дата рождения','date','',p.date||'','date')+field('Время рождения','time','',p.time||'','time')+field('Место рождения','place','Город, страна',p.place||'')+'<button class="atlas-button primary" type="submit">Сохранить данные</button></form>'+(p.date?'<p class="atlas-saved-hint">Сохранено: '+esc(dateLabel(p.date))+' · '+esc(p.time||'время не указано')+' · '+esc(p.place||'место не указано')+'</p>':''));
}
function openSynastry(){
  const p=userState.synastry||{};
  modalContent('Астрология · Синастрия','<p>Сохраните два профиля, чтобы подготовить основу для сравнения. Расчёт совместимости пока не производится.</p><form data-form="synastry">'+field('Имя первого человека','personA','Имя',p.personA||'')+field('Дата рождения первого человека','dateA','',p.dateA||'','date')+field('Имя второго человека','personB','Имя',p.personB||'')+field('Дата рождения второго человека','dateB','',p.dateB||'','date')+'<button class="atlas-button primary" type="submit">Сохранить профили</button></form>');
}
function openAstrologyTool(name){
  const aliases={'Дома':'Астрологические дома','Календарь':'Астрологический календарь','Обучение':'Обучение астрологии'};name=aliases[name]||name;
  if(name==='Натальная карта')return openBirthProfile();
  if(name==='Анализ карты'){
    if(!userState.astroProfile)return openBirthProfile();
    return modalContent('Анализ натальной карты','<p>Профиль: '+esc(dateLabel(userState.astroProfile.date))+' · '+esc(userState.astroProfile.time||'время не указано')+' · '+esc(userState.astroProfile.place||'место не указано')+'</p><p>Это демонстрационная структура анализа. Знаки, дома и аспекты не вычислялись по реальным эфемеридам.</p>'+itemList(['Положение Солнца — будет рассчитано при подключении астрономического движка','Луна и эмоциональные темы — пример раздела','Асцендент и дома — требуется точное время и место']));
  }
  const content={
    'Астрологические дома':['Двенадцать домов','I — личность и способ проявления','II — ресурсы и ценности','III — обучение и коммуникация','IV — дом и корни','V — творчество и самовыражение','VI — повседневность и служение','VII — партнёрство','VIII — общие ресурсы и перемены','IX — мировоззрение и путешествия','X — карьера и роль в обществе','XI — группы и планы','XII — уединение и внутренний мир'],
    'Аспекты':['Основные аспекты','Соединение — объединение факторов','Секстиль — возможность сотрудничества','Квадрат — напряжение и необходимость действия','Трин — гармоничный поток','Оппозиция — полярность и поиск баланса'],
    'Астрологический календарь':['Календарь наблюдений','Отмечайте лунные фазы и важные даты','Добавляйте личные заметки к событиям','Проверяйте часовой пояс для реальных расчётов'],
    'Обучение астрологии':['Маршрут обучения','1. Знаки зодиака','2. Планеты и их символика','3. Дома гороскопа','4. Аспекты','5. Сборка и интерпретация натальной карты']
  };
  if(name==='Релокация'){
    modalContent('Релокация','<p>Сравнение мест проживания. Реальный пересчёт карты по координатам здесь не подключён.</p><form data-form="relocation">'+field('Место для сравнения','place','Город, страна')+'<button class="atlas-button primary" type="submit">Добавить место</button></form>'+itemList(userState.relocation));
    return;
  }
  const d=content[name]||[name,'Учебный раздел находится в разработке.'];
  modalContent(d[0],itemList(d.slice(1))+'<p class="atlas-disclaimer">Символическая учебная информация, не результат астрономического вычисления.</p>');
}
function renderPsychologyTab(tab){
  const info=ATLAS_DATA.psychology?.tabs?.[tab];if(!info)return;
  const checkItems=info.items.map(item=>'<label class="atlas-check"><input type="checkbox" data-psych-check="'+esc(item)+'" '+(userState.psychChecks[item]?'checked':'')+'><span>'+esc(item)+'</span></label>').join('');
  modalContent(info.title,'<p>'+esc(info.text)+'</p><div class="atlas-check-list">'+checkItems+'</div><p class="atlas-saved-hint">Отмеченные пункты сохраняются только в этом браузере.</p>');
}
function openEmotionDiary(){
  modalContent('Дневник эмоций','<form data-form="emotion">'+selectField('Настроение','mood',['Спокойствие','Радость','Интерес','Тревога','Грусть','Раздражение','Усталость'].map(v=>({value:v,label:v})),'Спокойствие')+areaField('Что повлияло на состояние?','text','Короткая заметка…')+'<button class="atlas-button primary" type="submit">Сохранить запись</button></form><h3 class="atlas-subheading">История наблюдений</h3>'+renderSavedEntries(userState.emotions,'Записей пока нет.','emotion'));
}
function openCBT(){
  modalContent('Техники КПТ · Запись мысли','<p>Учебный шаблон самонаблюдения. Он не заменяет помощь специалиста и не ставит диагнозов.</p><form data-form="thought">'+areaField('Ситуация','situation','Что произошло?')+areaField('Автоматическая мысль','thought','Что вы подумали?')+areaField('Факты за и против','evidence','Какие факты подтверждают или опровергают мысль?')+areaField('Более сбалансированный взгляд','alternative','Какая ещё интерпретация возможна?')+'<button class="atlas-button primary" type="submit">Сохранить запись</button></form><h3 class="atlas-subheading">Сохранённые записи</h3>'+renderSavedEntries(userState.thoughts,'Записей пока нет.','thought'));
}
function openCognitiveDistortions(){
  const list=ATLAS_DATA.psychology?.distortions||[];
  modalContent('Когнитивные искажения','<p>Выберите пример, чтобы увидеть вопрос для проверки автоматической мысли.</p><div class="atlas-choice-list">'+list.map((d,i)=>'<button class="atlas-choice" type="button" data-modal-action="distortion" data-index="'+i+'"><span>◇</span><b>'+esc(d.name)+'</b><i>→</i></button>').join('')+'</div>');
}
function openExercises(){
  const list=ATLAS_DATA.psychology?.exercises||[];
  modalContent('Практики самонаблюдения','<p>Выберите короткое упражнение. Шаги можно отмечать по мере выполнения.</p><div class="atlas-choice-list">'+list.map((e,i)=>'<button class="atlas-choice" type="button" data-modal-action="exercise" data-index="'+i+'"><span>✧</span><b>'+esc(e.title)+'</b><i>→</i></button>').join('')+'</div>');
}
function openProjects(){
  modalContent('Проекты развития','<form data-form="project">'+field('Название проекта или небольшой цели','title','Например, 10 минут чтения в день')+'<button class="atlas-button primary" type="submit">Добавить цель</button></form><h3 class="atlas-subheading">Мои цели</h3>'+(userState.projects.length?'<div class="atlas-project-list">'+userState.projects.map(p=>'<label class="atlas-project"><input type="checkbox" data-project-id="'+esc(p.id)+'" '+(p.done?'checked':'')+'><span class="'+(p.done?'done':'')+'">'+esc(p.title)+'</span><button type="button" data-modal-action="delete-entry" data-kind="project" data-id="'+esc(p.id)+'">×</button></label>').join('')+'</div>':'<p class="atlas-empty">Пока целей нет.</p>'));
}
function openDreamForm(id=''){
  const entry=userState.dreams.find(d=>d.id===id)||{};
  modalContent(id?'Редактировать запись сна':'Новая запись сна','<form data-form="dream"><input type="hidden" name="id" value="'+esc(id)+'">'+field('Название сна','title','Например, город над облаками',entry.title||'')+areaField('Что происходило?','text','Запишите сюжет и детали…',entry.text||'')+field('Эмоции','emotions','Например, удивление, спокойствие',entry.emotions||'', 'text',false)+field('Повторяющиеся символы','symbols','Например, вода, город, полёт',entry.symbols||'','text',false)+'<button class="atlas-button primary" type="submit">Сохранить сон</button></form><h3 class="atlas-subheading">Мои записи</h3>'+renderDreamList());
}
function renderDreamList(){
  if(!userState.dreams.length)return '<p class="atlas-empty">Дневник пока пуст. Добавьте первую запись.</p>';
  return '<div class="atlas-saved-list">'+userState.dreams.slice().reverse().map(d=>'<article class="atlas-saved-item"><div><b>'+esc(d.title)+'</b><small>'+esc(dateLabel(d.createdAt))+'</small><p>'+esc((d.text||'').slice(0,130))+'</p><small>Символы: '+esc(d.symbols||'не указаны')+'</small></div><div class="atlas-row-actions"><button type="button" class="atlas-mini-button" data-modal-action="edit-dream" data-id="'+esc(d.id)+'">✎</button><button type="button" class="atlas-mini-button" data-modal-action="delete-entry" data-kind="dream" data-id="'+esc(d.id)+'">×</button></div></article>').join('')+'</div>';
}
function openDreamTool(name){
  if(name==='Дневник снов'||name==='Новая запись сна')return openDreamForm();
  if(name==='Толкование сна'||name==='Анализ сновидения'||name==='Ночной образ'){
    modalContent(name,'<p>Не существует универсального словаря, который достоверно определяет значение каждого сна. Сначала зафиксируйте сюжет и личные ассоциации.</p><form data-form="dream-analysis">'+areaField('Кратко опишите сон','text','Что запомнилось больше всего?')+'<button class="atlas-button primary" type="submit">Получить вопросы для размышления</button></form><p class="atlas-disclaimer">Ответ будет основан на вопросах для саморефлексии, а не на диагностике или предсказании.</p>');
    return;
  }
  if(name==='Словарь символов'){
    modalContent(name,'<label class="atlas-field"><span>Поиск символа</span><input id="dreamSymbolSearch" type="search" placeholder="Например, вода"></label><div id="dreamSymbolList">'+renderDreamSymbols('')+'</div>');
    return;
  }
  if(name==='Повторяющиеся сны'){
    const counts={};userState.dreams.forEach(d=>(d.symbols||'').split(/[,;]/).map(s=>s.trim()).filter(Boolean).forEach(s=>counts[s]=(counts[s]||0)+1));
    const repeated=Object.entries(counts).filter(([,n])=>n>1).sort((a,b)=>b[1]-a[1]);
    modalContent(name,repeated.length?'<p>Символы, которые повторяются в сохранённых записях:</p>'+itemList(repeated.map(([s,n])=>s+' — '+n+' раза')):'<p class="atlas-empty">Пока не найдено повторяющихся символов. Записывайте символы в дневнике через запятую, чтобы искать повторы.</p>');
    return;
  }
  if(name==='Карта снов'){
    modalContent(name,'<p>Сводка локального дневника.</p>'+itemList(['Всего записей: '+userState.dreams.length,'Символов отмечено: '+userState.dreams.reduce((n,d)=>n+(d.symbols||'').split(/[,;]/).filter(Boolean).length,0),'Последняя запись: '+(userState.dreams.length?dateLabel(userState.dreams[userState.dreams.length-1].createdAt):'пока нет')]));
  }
}
function renderDreamSymbols(query){
  const list=(ATLAS_DATA.dreamSymbols||[]).filter(x=>(x.symbol+' '+x.meanings).toLowerCase().includes(query.toLowerCase()));
  return list.length?'<div class="atlas-symbol-list">'+list.map(x=>'<article><b>'+esc(x.symbol)+'</b><p>'+esc(x.meanings)+'</p></article>').join('')+'</div>':'<p class="atlas-empty">Ничего не найдено.</p>';
}
function renderArenaTab(tab){
  if(tab==='Дуэль'){openDuel();return;}
  if(tab==='Турнир'){modalContent('Арена · Турнир','<p>Локальный демонстрационный календарь. Реальные игроки и сетевые матчи не подключены.</p>'+itemList(['Открытый турнир по Таро — регистрация открыта (демо)','Символический разбор сновидений — скоро','Астрологический блиц — учебный формат']));return;}
  if(tab==='Лига'){const scores=[['Алексей',1280],['Лиана',1210],['Мира',1135],['Роман',980]];modalContent('Арена · Лига','<p>Временный рейтинг для демонстрации интерфейса.</p><ol class="atlas-list">'+scores.map(s=>'<li>'+esc(s[0])+' — '+s[1]+' очков</li>').join('')+'</ol>');return;}
  modalContent('Арена · Гильдии','<p>Гильдии — будущие тематические сообщества исследователей.</p>'+itemList(['Архив Таро','Круг астрологов','Лаборатория символов']));
}
function openDuel(){
  modalContent('Дуэль · Отношения в раскладе Таро','<p>Демонстрационный поединок. Напишите свою интерпретацию ситуации. Локальная проверка оценит только заполненность ответа, а не его качество; второй участник не подключён.</p><form data-form="duel">'+areaField('Ваша трактовка','answer','Опишите ситуацию, аргументируйте значение карты и свяжите вывод с вопросом…')+'<button class="atlas-button primary" type="submit">Отправить ответ</button></form><h3 class="atlas-subheading">История ваших ответов</h3>'+renderSavedEntries(userState.duelHistory,'Вы ещё не участвовали в демонстрационной дуэли.','duel'));
}
function applyTheme(id,notify=true){
  const selected=(ATLAS_DATA.themes||[]).find(t=>t.id===id||t.name===id);
  const allowed=selected?.id||'cabinet';
  userState.theme=allowed;document.querySelector('.device').dataset.theme=allowed;document.body.dataset.theme=allowed;persist();
  if(notify)showModal('Тема оформления', '<p>Применена тема «'+esc((selected||{}).name||allowed)+'». Выбор сохранён в этом браузере. Исходные изображения экранов остаются неизменными; меняется только оттенок оформления.</p>');
}
function openThemeList(){
  modalContent('Темы оформления','<p>Выберите цветовую атмосферу. Настройка сохраняется локально.</p><div class="atlas-choice-list">'+(ATLAS_DATA.themes||[]).map(t=>'<button type="button" class="atlas-choice '+(userState.theme===t.id?'chosen':'')+'" data-modal-action="choose-theme" data-theme="'+esc(t.id)+'"><span>✧</span><b>'+esc(t.name)+'<small>'+esc(t.description)+'</small></b><i>'+(userState.theme===t.id?'✓':'○')+'</i></button>').join('')+'</div>');
}
function openFeature(name){
  if(name==='Профайлинг'){
    const c=(ATLAS_DATA.profilingCases||[])[0];
    modalContent('Профайлинг · Учебный кейс','<p><b>'+esc(c.title)+'</b></p><p>'+esc(c.scene)+'</p><p class="atlas-kicker">'+esc(c.question)+'</p>'+itemList(c.clues)+'<form data-form="profiling">'+areaField('Ваши наблюдения','text','Запишите только факты, не приписывая человеку мотивы…')+'<button class="atlas-button primary" type="submit">Сохранить разбор</button></form>');
    return;
  }
  if(name==='NLP'){
    modalContent('NLP · Переформулирование','<p>Выберите пример языкового паттерна и сравните исходную и более конкретную формулировку.</p><div class="atlas-choice-list">'+(ATLAS_DATA.nlpPatterns||[]).map((p,i)=>'<button type="button" class="atlas-choice" data-modal-action="nlp-example" data-index="'+i+'"><span>☷</span><b>'+esc(p.name)+'</b><i>→</i></button>').join('')+'</div><form data-form="nlp">'+areaField('Собственная фраза','text','Введите фразу, которую хотите переформулировать…')+'<button class="atlas-button primary" type="submit">Предложить нейтральную формулировку</button></form>');
    return;
  }
  if(name==='Нумерология'){
    modalContent('Нумерология · Демонстрационный расчёт','<p>Введите дату рождения. Сумма цифр будет сведена к однозначному числу; мастер-числа 11, 22 и 33 сохраняются. Это символическая традиция, не научный тест личности.</p><form data-form="numerology">'+field('Дата рождения','date','','','date')+'<button class="atlas-button primary" type="submit">Рассчитать число</button></form><div id="numerologyResult"></div>');
    return;
  }
  if(name==='Лаборатория'){
    modalContent('Междисциплинарная лаборатория','<p>Фиксируйте исследовательские вопросы и связывайте разные направления Атласа.</p><form data-form="research">'+field('Название исследования','title','Например, образ дороги в Таро и сновидениях')+selectField('Основное направление','domain',['Таро','Астрология','Психология','Сновидения','Профайлинг','NLP'].map(x=>({value:x,label:x})))+areaField('Вопрос и гипотеза','text','Что хотите проверить или сопоставить?')+'<button class="atlas-button primary" type="submit">Сохранить исследование</button></form><h3 class="atlas-subheading">Мои исследования</h3>'+renderSavedEntries(userState.researchNotes,'Сохранённых исследований пока нет.','research'));
    return;
  }
  if(name==='Профиль'){
    modalContent('Профиль исследователя','<p>Данные хранятся локально в этом браузере.</p>'+itemList(['Заметки Таро: '+userState.tarotNotes.length,'Расклады: '+userState.spreads.length,'Записи снов: '+userState.dreams.length,'Записи эмоций: '+userState.emotions.length,'Проекты: '+userState.projects.length,'Тема: '+userState.theme])+'<p class="atlas-disclaimer">Профиль не синхронизируется между устройствами.</p>');
  }
}
function handleInfo(name){
  const aliases={'Расклады':'Расклады Таро','Экзамен':'Экзамен по Таро','Конструктор':'Конструктор раскладов','Библиотека':'Библиотека Таро','Дневник':'Дневник Таро','Тесты':'Психологические тесты','Техники':'Техники КПТ','Техники (КБТ)':'Техники КПТ','Толкование':'Толкование сна','Повторы':'Повторяющиеся сны','Символы':'Словарь символов','Анализ психики':'Анализ сновидения','Записать сон':'Новая запись сна','Рейтинг':'Рейтинг Арены','История':'История дуэлей','Правила':'Правила Арены'};name=aliases[name]||name;
  if(current==='tarot'){
    if(name==='Значение карты')return renderTarotCard('Звезда');
    if(name==='Символика Звезды')return modalContent(name,'<p>'+esc(findCard('Звезда').symbols)+'</p>');
    if(name==='Сочетания')return modalContent(name,'<p>Учебный пример:</p><ul class="atlas-list"><li>Звезда + Отшельник — надежда через тишину и самостоятельное осмысление.</li><li>Звезда + Сила — восстановление через выдержку.</li><li>Звезда + Башня — поиск ориентира после резкой перемены.</li></ul><p>Смысл сочетания зависит от вопроса и позиций карт.</p>');
    if(name==='Практика')return renderTarotTab('Практика');
    if(name==='Заметки'||name==='Дневник Таро')return openTarotNote('Звезда');
    if(name==='Дуэли')return navigate('arena');
    if(name==='Расклады Таро')return renderTarotTab('Практика');
    if(name==='Экзамен по Таро')return startQuiz('tarot');
    if(name==='Конструктор раскладов')return openSpreadBuilder();
    if(name==='Библиотека Таро')return renderTarotTab('Обучение');
  }
  if(current==='astrology')return openAstrologyTool(name);
  if(current==='psychology'){
    if(name==='Психологические тесты')return startQuiz('psychology');
    if(name==='Упражнения')return openExercises();
    if(name==='Дневник эмоций')return openEmotionDiary();
    if(name==='Когнитивные искажения')return openCognitiveDistortions();
    if(name==='Техники КПТ')return openCBT();
    if(name==='Проекты развития')return openProjects();
  }
  if(current==='dreams')return openDreamTool(name);
  if(current==='arena'){
    if(name==='Рейтинг Арены')return renderArenaTab('Лига');
    if(name==='История дуэлей')return modalContent(name,renderSavedEntries(userState.duelHistory,'История пока пуста.','duel'));
    if(name==='Правила Арены')return modalContent(name,'<p>Участники получают одинаковую ситуацию и отвечают независимо. В этой локальной версии ответ не оценивается искусственным интеллектом: сохраняется только текст и простая проверка заполненности.</p>');
    if(name==='Участник Алексей')return modalContent(name,'<p>Таролог · уровень Мастер · демонстрационный участник.</p>');
    if(name==='Участник Лиана')return modalContent(name,'<p>Астролог · уровень Эксперт · демонстрационный участник.</p>');
    if(name==='Тема дуэли')return modalContent(name,'<p>Тема: «Отношения в раскладе Таро». Вопрос: как прочитать сочетание карты Звезда с картой Отшельник в контексте восстановления доверия?</p>');
    if(name==='Таймер дуэли')return openDuel();
  }
  if(current==='dreams')return openDreamTool(name);
  if(current==='home'||current==='map')return openFeature(name);
  if(name==='Профайлинг'||name==='NLP'||name==='Нумерология'||name==='Лаборатория'||name==='Профиль')return openFeature(name);
  const text=ATLAS_DATA.pages?.[current]?.alt||'';
  const copy={
    'Сообщество':'Раздел сообщества пока работает как демонстрационный экран. Сетевые профили и общение требуют серверной части.',
    'Дневник снов':'Создавайте записи сна, отмечайте символы и возвращайтесь к ним позднее.',
    'Толкование':'Сопоставляйте сюжет сна с личными ассоциациями. Не существует универсального достоверного словаря символов.'
  };
  modalContent(name,'<p>'+esc(copy[name]||text||'Это демонстрационный инструмент Атласа Познания. Его специализированные функции будут расширяться.')+'</p>');
}
function submitForm(event){
  const form=event.target.closest('form[data-form]');if(!form)return;
  event.preventDefault();const data=Object.fromEntries(new FormData(form));const now=new Date().toISOString();const id=()=>Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
  switch(form.dataset.form){
    case 'tarot-note':{const previous=userState.tarotNotes.find(n=>n.card===data.card);if(previous){previous.text=data.text;previous.createdAt=now;}else userState.tarotNotes.push({id:id(),card:data.card,title:'Карта: '+data.card,text:data.text,createdAt:now});persist();openTarotNote(data.card);return;}
    case 'draw-spread':{const spread=(ATLAS_DATA.spreads||[]).find(s=>s.id===data.spread)||(ATLAS_DATA.spreads||[])[0];const deck=[...(ATLAS_DATA.tarotCards||[])];const chosen=[];while(chosen.length<spread.positions.length&&deck.length){const n=Math.floor(Math.random()*deck.length);chosen.push(deck.splice(n,1)[0]);}const entry={id:id(),title:spread.name,createdAt:now,text:chosen.map((c,i)=>spread.positions[i]+': '+c.name).join(' · '),cards:chosen.map(c=>({name:c.name,number:c.number,meaning:c.meaning})),positions:spread.positions};userState.spreads.push(entry);persist();const output='<div class="atlas-drawn-grid">'+entry.cards.map((c,i)=>'<article><small>'+esc(entry.positions[i])+'</small><b>'+esc(c.number)+'</b><strong>'+esc(c.name)+'</strong><p>'+esc(c.meaning)+'</p></article>').join('')+'</div><p class="atlas-saved-hint">Демо-расклад сохранён в этом браузере.</p>';document.getElementById('spreadResult').innerHTML=output;return;}
    case 'custom-spread':{const positions=data.positions.split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean);if(!positions.length){showModal('Не удалось сохранить','<p>Добавьте хотя бы одну позицию.</p>');return;}userState.customSpreads.push({id:id(),title:data.title,positions});persist();openSpreadBuilder();return;}
    case 'astro-profile':userState.astroProfile={date:data.date,time:data.time,place:data.place,createdAt:now};persist();openBirthProfile();return;
    case 'synastry':userState.synastry={personA:data.personA,dateA:data.dateA,personB:data.personB,dateB:data.dateB,createdAt:now};persist();openSynastry();return;
    case 'relocation':userState.relocation.push(data.place);persist();openAstrologyTool('Релокация');return;
    case 'emotion':userState.emotions.push({id:id(),mood:data.mood,title:data.mood,text:data.text,createdAt:now});persist();openEmotionDiary();return;
    case 'thought':userState.thoughts.push({id:id(),title:'Мысль: '+data.situation,text:'Ситуация: '+data.situation+'\\nМысль: '+data.thought+'\\nФакты: '+data.evidence+'\\nАльтернатива: '+data.alternative,createdAt:now});persist();openCBT();return;
    case 'project':userState.projects.push({id:id(),title:data.title,done:false});persist();openProjects();return;
    case 'dream':{const entry={id:data.id||id(),title:data.title,text:data.text,emotions:data.emotions,symbols:data.symbols,createdAt:now};const index=userState.dreams.findIndex(d=>d.id===data.id);if(index>=0)userState.dreams[index]=entry;else userState.dreams.push(entry);persist();openDreamForm();return;}
    case 'dream-analysis':{const words=data.text.trim().split(/\\s+/).filter(Boolean).length;modalContent('Вопросы для осмысления','<p>Вы описали '+words+' слов. Попробуйте ответить на вопросы:</p>'+itemList(['Какое чувство было самым заметным?','Что в сюжете напоминает реальные события или переживания?','Какие личные ассоциации вызывает главный образ?','Какой вопрос остаётся для вас открытым?'])+'<p class="atlas-disclaimer">Это упражнение для размышления, а не объективная расшифровка сна.</p>');return;}
    case 'duel':{const answer=data.answer.trim();const words=answer.split(/\\s+/).filter(Boolean).length;const entry={id:id(),title:'Дуэль · '+dateLabel(now),text:answer,createdAt:now,summary:'Длина ответа: '+words+' слов'};userState.duelHistory.push(entry);persist();modalContent('Ответ принят','<div class="atlas-result-score">'+words+' слов</div><p>Ответ сохранён в локальной истории.</p><p>Демо-проверка оценивает только заполненность текста, не глубину трактовки и не правильность ответа. Соперник и сетевое соревнование не подключены.</p>'+actionButton('Посмотреть историю','arena-history'));return;}
    case 'profiling':userState.profilingNotes.push({id:id(),title:'Разбор кейса',text:data.text,createdAt:now});persist();modalContent('Наблюдение сохранено','<p>Запись добавлена. В дальнейшем можно будет сравнить факты и гипотезы.</p>'+renderSavedEntries(userState.profilingNotes,'Пока нет записей.'));return;
    case 'nlp':{const match=(ATLAS_DATA.nlpPatterns||[]).find(p=>p.before.toLowerCase()===data.text.trim().toLowerCase());const suggestion=match?.after||'Попробуйте описать конкретное наблюдение от первого лица, назвать собственную реакцию и сформулировать ясную просьбу без обобщений.';modalContent('Вариант переформулирования','<p><b>Исходная фраза:</b> '+esc(data.text)+'</p><p><b>Возможный вариант:</b> '+esc(suggestion)+'</p><p class="atlas-disclaimer">Это редакторская подсказка, а не психологическая оценка.</p>');return;}
    case 'numerology':{let n=data.date.replaceAll('-','').split('').reduce((sum,d)=>sum+Number(d),0);while(n>9&&![11,22,33].includes(n))n=String(n).split('').reduce((sum,d)=>sum+Number(d),0);modalContent('Демонстрационный расчёт','<div class="atlas-result-score">'+n+'</div><p>Сумма цифр даты сведена к числу '+n+'. В нумерологических традициях это число получает символическую интерпретацию; расчёт не является научной характеристикой личности.</p>');return;}
    case 'research':userState.researchNotes.push({id:id(),title:data.title,text:'Направление: '+data.domain+'. '+data.text,createdAt:now});persist();openFeature('Лаборатория');return;
  }
}
function handleModalClick(event){
  const option=event.target.closest('[data-quiz-option]');
  if(option&&activeQuiz&&activeQuiz.answer===null){const q=activeQuiz.questions[activeQuiz.index];activeQuiz.answer=Number(option.dataset.quizOption);if(activeQuiz.answer===q.correct)activeQuiz.score++;renderQuizStep();return;}
  const control=event.target.closest('[data-modal-action]');if(!control)return;
  const action=control.dataset.modalAction;
  if(action==='close-modal'){closeModal();return;}
  if(action==='open-card')return renderTarotCard(control.dataset.card);
  if(action==='note-card')return openTarotNote(control.dataset.card);
  if(action==='choose-deck'){userState.deck=control.dataset.deck;persist();renderTarotTab('Колоды');return;}
  if(action==='quiz-next'){if(activeQuiz){activeQuiz.index++;activeQuiz.answer=null;renderQuizStep();}return;}
  if(action==='restart-quiz'){startQuiz(lastQuizKind);return;}
  if(action==='choose-theme'){applyTheme(control.dataset.theme);openThemeList();return;}
  if(action==='distortion'){const d=ATLAS_DATA.psychology.distortions[Number(control.dataset.index)];return modalContent(d.name,'<p>'+esc(d.desc)+'</p><p class="atlas-kicker">Вопрос для проверки</p><p>'+esc(d.prompt)+'</p>'+actionButton('Назад к списку','back-distortions'));}
  if(action==='back-distortions')return openCognitiveDistortions();
  if(action==='exercise'){const ex=ATLAS_DATA.psychology.exercises[Number(control.dataset.index)];return modalContent(ex.title,'<p>Отмечайте шаги по мере выполнения.</p><div class="atlas-check-list">'+ex.steps.map((s,i)=>'<label class="atlas-check"><input type="checkbox"><span>'+esc(s)+'</span></label>').join('')+'</div>');}
  if(action==='nlp-example'){const p=ATLAS_DATA.nlpPatterns[Number(control.dataset.index)];return modalContent(p.name,'<p><b>Исходная фраза:</b> '+esc(p.before)+'</p><p><b>Возможная переформулировка:</b> '+esc(p.after)+'</p>');}
  if(action==='edit-dream')return openDreamForm(control.dataset.id);
  if(action==='delete-entry'){
    const kind=control.dataset.kind,id=control.dataset.id;
    const collection={dream:userState.dreams,emotion:userState.emotions,thought:userState.thoughts,project:userState.projects,'tarot-note':userState.tarotNotes,spread:userState.spreads,duel:userState.duelHistory,research:userState.researchNotes}[kind];
    if(collection){const index=collection.findIndex(item=>item.id===id);if(index>=0)collection.splice(index,1);persist();}
    if(kind==='dream')return openDreamForm();if(kind==='emotion')return openEmotionDiary();if(kind==='thought')return openCBT();if(kind==='project')return openProjects();if(kind==='tarot-note')return openTarotNote('Звезда');if(kind==='duel')return openDuel();return showModal('Запись удалена','<p>Запись удалена из локального хранилища.</p>');
  }
  if(action==='arena-history')return modalContent('История дуэлей',renderSavedEntries(userState.duelHistory,'История пока пуста.','duel'));
}
function handleModalChange(event){
  if(event.target.matches('[data-psych-check]')){const name=event.target.dataset.psychCheck;userState.psychChecks[name]=event.target.checked;persist();return;}
  if(event.target.matches('[data-project-id]')){const project=userState.projects.find(item=>item.id===event.target.dataset.projectId);if(project){project.done=event.target.checked;persist();const label=event.target.parentElement.querySelector('span');if(label)label.classList.toggle('done',project.done);}return;}
}
function handleModalInput(event){
  if(event.target.id==='dreamSymbolSearch'){document.getElementById('dreamSymbolList').innerHTML=renderDreamSymbols(event.target.value);}
}

function handleAction(action,el){
  if(action.startsWith('go:'))return navigate(action.slice(3));
  if(action.startsWith('page:'))return navigate(action.slice(5));
  if(action==='back')return goBack();
  if(action==='menu')return showModal('Кабинет исследователя','<p>Выберите направление:</p><ul>'+names.map(n=>'<li><a href="#'+n+'" data-modal-go="'+n+'">'+labels[n]+'</a></li>').join('')+'</ul>');
  if(action==='notifications'||action==='notify')return showModal('Уведомления','<p>Новых уведомлений пока нет. Здесь появятся напоминания, приглашения и события сообщества.</p>');
  if(action==='duel')return openDuel();
  if(action.startsWith('tab:')){
    const tab=action.slice(4);
    if(current==='tarot')return renderTarotTab(tab);
    if(current==='astrology')return renderAstrologyTab(tab);
    if(current==='psychology')return renderPsychologyTab(tab);
    if(current==='arena')return renderArenaTab(tab);
    el.parentElement.querySelectorAll('.hit').forEach(h=>{if(h.dataset.action.startsWith('tab:'))h.classList.remove('selected-hotspot');});
    el.classList.add('selected-hotspot');
    return showModal(tab,'<p>Вкладка выбрана.</p>');
  }
  if(action.startsWith('theme:')){applyTheme(action.slice(6));return;}
  if(action.startsWith('toggle:')){
    const name=action.slice(7);userState.psychChecks[name]=!userState.psychChecks[name];persist();el.classList.toggle('selected-hotspot',userState.psychChecks[name]);el.setAttribute('aria-pressed',String(userState.psychChecks[name]));return showModal('Самонаблюдение: '+name,'<p>Пункт '+(userState.psychChecks[name]?'добавлен в':'убран из')+' вашего списка наблюдений. Настройка сохранена в этом браузере.</p>');
  }
  if(action.startsWith('card:'))return renderTarotCard(action.slice(5).replace('star','Звезда'));
  if(action.startsWith('modal:'))return handleInfo(action.slice(6));
  if(action.startsWith('diary:')){
    const name=action.slice(6);
    if(name.includes('сна')||name.includes('запись сна'))return openDreamForm();
    if(name.includes('эмоций'))return openEmotionDiary();
    if(name.includes('Таро')||name.includes('карте'))return openTarotNote('Звезда');
    return openDreamForm();
  }
  if(action.startsWith('info:'))return handleInfo(action.slice(5));
  if(action.startsWith('feature:'))return openFeature(action.slice(8));
  return showModal('Инструмент','<p>Для этой области пока нет отдельного действия.</p>');
}

function build(){names.forEach(name=>{const section=document.createElement('section');section.className='screen'+(name==='home'?' active':'');section.dataset.page=name;const img=document.createElement('img');img.className='screen-art';img.alt=labels[name]+' — экран Атласа Познания';img.draggable=false;img.src=urls[name];const layers=document.createElement('div');layers.className='hotspots';(map[name]||[]).forEach(def=>{const b=document.createElement('button');b.type='button';b.className='hit';b.style.left=def.left+'%';b.style.top=def.top+'%';b.style.width=def.width+'%';b.style.height=def.height+'%';b.dataset.action=def.action;b.setAttribute('aria-label',def.label);b.title=def.label;layers.appendChild(b);});section.append(img,layers);screens.appendChild(section);});screens.classList.add('ready');loading.hidden=true;const hash=location.hash.slice(1);if(pages[hash]){navigationStack.push(hash);renderPage(hash);}else syncDesktop('home');applyTheme(userState.theme,false);}
async function inflateRaw(bytes){if(typeof DecompressionStream==='undefined')throw new Error('Браузер не поддерживает распаковку ZIP.');const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return await new Response(stream).arrayBuffer();}
async function extractZip(buffer){const v=new DataView(buffer);let eocd=-1;for(let p=buffer.byteLength-22;p>=Math.max(0,buffer.byteLength-65557);p--){if(v.getUint32(p,true)===0x06054b50){eocd=p;break;}}if(eocd<0)throw new Error('В архиве не найдена центральная ZIP-директория.');const count=v.getUint16(eocd+10,true);let p=v.getUint32(eocd+16,true);const out={};for(let i=0;i<count;i++){if(v.getUint32(p,true)!==0x02014b50)throw new Error('Повреждена запись ZIP-архива.');const method=v.getUint16(p+10,true),packed=v.getUint32(p+20,true),nameLen=v.getUint16(p+28,true),extraLen=v.getUint16(p+30,true),commentLen=v.getUint16(p+32,true),local=v.getUint32(p+42,true),name=new TextDecoder().decode(new Uint8Array(buffer,p+46,nameLen));if(name.startsWith('assets/')&&name.endsWith('.webp')){const localName=v.getUint16(local+26,true),localExtra=v.getUint16(local+28,true),start=local+30+localName+localExtra,raw=buffer.slice(start,start+packed),data=method===0?raw:method===8?await inflateRaw(raw):null;if(!data)throw new Error('Неизвестный метод сжатия в ZIP.');out[name.split('/').pop().replace('.webp','')]=URL.createObjectURL(new Blob([data],{type:'image/webp'}));}p+=46+nameLen+extraLen+commentLen;}if(names.some(n=>!out[n]))throw new Error('В архиве отсутствует одно или несколько изображений экранов.');return out;}
async function trimReferenceScreens(){for(const [name,crop] of Object.entries(trims)){const img=new Image();img.src=urls[name];await img.decode();const sx=Math.round(crop.left*img.naturalWidth/pages[name].w),sy=Math.round(crop.top*img.naturalHeight/pages[name].h),cw=img.naturalWidth-sx,ch=img.naturalHeight-sy,canvas=document.createElement('canvas');canvas.width=cw;canvas.height=ch;canvas.getContext('2d').drawImage(img,sx,sy,cw,ch,0,0,cw,ch);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',.96));if(blob){const old=urls[name];urls[name]=URL.createObjectURL(blob);if(old.startsWith('blob:'))URL.revokeObjectURL(old);}}}
screens.addEventListener('click',e=>{const target=e.target.closest('.hit');if(target)handleAction(target.dataset.action,target);});
const modalBody=document.getElementById('modalBody');modalBody.addEventListener('submit',submitForm);modalBody.addEventListener('click',handleModalClick);modalBody.addEventListener('input',handleModalInput);modalBody.addEventListener('change',handleModalChange);
document.addEventListener('click',e=>{const nav=e.target.closest('[data-nav]');if(nav){navigate(nav.dataset.nav);return;}const link=e.target.closest('[data-modal-go]');if(link){e.preventDefault();closeModal();navigate(link.dataset.modalGo);}});
document.getElementById('modalClose').addEventListener('click',closeModal);document.getElementById('modalOk').addEventListener('click',closeModal);document.getElementById('modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();});window.addEventListener('popstate',event=>{const id=event.state?.page||location.hash.slice(1);if(!pages[id])return;const index=navigationStack.lastIndexOf(id);if(index>=0)navigationStack.splice(index+1);else navigationStack.push(id);renderPage(id,false);});
window.__ATLAS_TEST_API={navigate,goBack,getCurrent:()=>current,hotspotCount:()=>document.querySelectorAll('.hit').length,getState:()=>JSON.parse(JSON.stringify(userState)),trigger:handleAction};
async function load(){try{if(window.__ATLAS_IMAGE_DATA)Object.assign(urls,window.__ATLAS_IMAGE_DATA);else if(window.__ATLAS_ZIP_DATA){const binary=atob(window.__ATLAS_ZIP_DATA),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);Object.assign(urls,await extractZip(bytes.buffer));}else{const response=await fetch('./atlas-reference-assets.zip',{cache:'no-store'});if(!response.ok)throw new Error('Архив изображений не найден (HTTP '+response.status+').');Object.assign(urls,await extractZip(await response.arrayBuffer()));}await trimReferenceScreens();build();}catch(e){loading.hidden=true;error.hidden=false;document.getElementById('errorText').textContent=e.message;console.error(e);}}
load();
})();