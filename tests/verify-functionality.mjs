import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const server=spawn('python3',['-m','http.server','4174','--bind','127.0.0.1'],{stdio:'ignore',cwd:process.cwd()});
let browser;
const pageErrors=[];
try{
  await new Promise(resolve=>setTimeout(resolve,700));
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844}});
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:4174/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('.screens.ready',{timeout:30000});
  await page.waitForFunction(()=>document.querySelectorAll('.screen-art').length===8&&[...document.querySelectorAll('.screen-art')].every(img=>img.complete&&img.naturalWidth>0),null,{timeout:30000});

  const clickHotspot=async(pageName,label)=>{
    await page.locator('.screen[data-page="'+pageName+'"] .hit[aria-label="'+label+'"]').first().click();
  };
  const closeModal=async()=>{if(await page.locator('#modal').isVisible())await page.locator('#modalOk').click();};
  const saved=async()=>page.evaluate(()=>window.__ATLAS_TEST_API.getState());

  // Tarot: practice spread generation and local persistence.
  await clickHotspot('home','Таро');
  await page.waitForFunction(()=>document.querySelector('.screen.active')?.dataset.page==='tarot');
  await clickHotspot('tarot','Практика');
  assert.equal(await page.locator('#modalTitle').textContent(),'Таро · Практика');
  await page.locator('#modalBody select[name="spread"]').selectOption('three');
  await page.locator('#modalBody form[data-form="draw-spread"] button[type="submit"]').click();
  assert.equal(await page.locator('#spreadResult .atlas-drawn-grid article').count(),3,'Three-card spread should render three positions');
  assert.equal((await saved()).spreads.length,1,'Spread should be stored locally');
  await closeModal();

  // Tarot: card detail and note creation.
  await clickHotspot('tarot','Карта Звезда');
  assert.match(await page.locator('#modalTitle').textContent(),/Звезда/);
  await page.locator('#modalBody [data-modal-action="note-card"]').click();
  await page.locator('#modalBody textarea[name="text"]').fill('Наблюдение: надежда проявляется постепенно.');
  await page.locator('#modalBody button[type="submit"]').click();
  assert.equal((await saved()).tarotNotes.length,1,'Tarot note should be stored locally');
  await closeModal();

  // Tarot: exam answers and quiz progression.
  await clickHotspot('tarot','Экзамен');
  assert.equal(await page.locator('#modalTitle').textContent(),'Экзамен по Таро');
  await page.locator('[data-quiz-option="1"]').click();
  assert.equal(await page.locator('.atlas-feedback').count(),1,'Quiz should show answer feedback');
  await page.locator('[data-modal-action="quiz-next"]').click();
  assert.match(await page.locator('.atlas-question').textContent(),/Звезду/);
  await closeModal();

  // Astrology: save a demonstration birth profile.
  await page.locator('.screen[data-page="tarot"] .hit[aria-label="Назад"]').click();
  await clickHotspot('home','Астрология');
  await clickHotspot('astrology','Натал');
  await page.locator('#modalBody input[name="date"]').fill('1984-07-16');
  await page.locator('#modalBody input[name="time"]').fill('15:30');
  await page.locator('#modalBody input[name="place"]').fill('Помошная, Украина');
  await page.locator('#modalBody button[type="submit"]').click();
  assert.equal((await saved()).astroProfile.place,'Помошная, Украина','Astrology profile should persist');
  await closeModal();

  // Psychology: checklist persistence and emotion diary.
  await page.locator('.screen[data-page="astrology"] .hit[aria-label="Назад"]').click();
  await clickHotspot('home','Психология');
  await clickHotspot('psychology','Эмоции');
  assert.equal((await saved()).psychChecks['Эмоции'],false,'Psychology checklist should toggle and save');
  await closeModal();
  await clickHotspot('psychology','Дневник эмоций');
  await page.locator('#modalBody select[name="mood"]').selectOption('Интерес');
  await page.locator('#modalBody textarea[name="text"]').fill('Запись для автоматической проверки.');
  await page.locator('#modalBody button[type="submit"]').click();
  assert.equal((await saved()).emotions.length,1,'Emotion note should be stored locally');
  await closeModal();

  // Dreams: create a journal entry and verify it appears in the saved list.
  await page.locator('.screen[data-page="psychology"] .hit[aria-label="Назад"]').click();
  await clickHotspot('home','Сновидения');
  await clickHotspot('dreams','Записать сон');
  await page.locator('#modalBody input[name="title"]').fill('Город над облаками');
  await page.locator('#modalBody textarea[name="text"]').fill('Я видел город и яркие огни над рекой.');
  await page.locator('#modalBody input[name="emotions"]').fill('удивление');
  await page.locator('#modalBody input[name="symbols"]').fill('город, вода, огни');
  await page.locator('#modalBody button[type="submit"]').click();
  assert.equal((await saved()).dreams.length,1,'Dream entry should be stored locally');
  assert.match(await page.locator('#modalBody').textContent(),/Город над облаками/);
  await closeModal();

  // Themes: selection changes the active theme and survives a reload.
  await page.locator('.screen[data-page="dreams"] .hit[aria-label="Назад"]').click();
  await clickHotspot('home','Главная');
  await page.locator('[data-nav="themes"]').first().click();
  await clickHotspot('themes','Магическая Академия');
  assert.equal(await page.locator('.device').getAttribute('data-theme'),'magic','Theme should be applied to the device');
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('.screens.ready',{timeout:30000});
  assert.equal(await page.locator('.device').getAttribute('data-theme'),'magic','Theme should persist after reload');

  // Arena: save a demonstration duel response.
  await page.locator('[data-nav="arena"]').first().click();
  await clickHotspot('arena','Войти в дуэль');
  await page.locator('#modalBody textarea[name="answer"]').fill('Я читаю Звезду как спокойное восстановление доверия. Эта карта показывает надежду, а Отшельник добавляет время для размышления.');
  await page.locator('#modalBody button[type="submit"]').click();
  assert.equal((await saved()).duelHistory.length,1,'Duel answer should be recorded');
  assert.match(await page.locator('#modalTitle').textContent(),/Ответ принят/);
  await closeModal();

  // Browser runtime should remain free of uncaught errors.
  assert.deepEqual(pageErrors,[],'No uncaught browser errors');
  console.log('PASS: tarot spreads, card notes, exam flow, astrology profile, psychology checklist and emotion log, dream journal, persistent themes, arena answer and browser runtime.');
}catch(error){
  console.error(error);
  process.exitCode=1;
}finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
}