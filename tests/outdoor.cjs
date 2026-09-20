// NODE_PATH=/path/to/playwright/node_modules node tests/outdoor.cjs
const {chromium}=require('playwright');const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.join(root,req.url==='/'?'index.html':req.url);res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.svg')?'image/svg+xml':f.endsWith('.png')?'image/png':'text/html');try{res.end(fs.readFileSync(f));}catch{res.statusCode=404;res.end();}}).listen(8766);
(async()=>{const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
await page.addInitScript(()=>{navigator.geolocation.watchPosition=(success,error)=>{window.gpsSuccess=success;window.gpsError=error;return 1;};navigator.geolocation.clearWatch=()=>{};});
await page.goto('http://localhost:8766');
await page.locator('.hybrid-legacy summary').click();await page.locator('[data-day=upper-a]').click();
assert.equal(await page.locator('#equip-upper-a').inputValue(),'default');await page.locator('#equip-upper-a').selectOption('Commercial Gym');assert.equal(await page.locator('#exname-upper-a-Press-0').textContent(),'Incline Machine Chest Press');await page.reload();await page.locator('.hybrid-legacy summary').click();await page.locator('[data-day=upper-a]').click();assert.equal(await page.locator('#equip-upper-a').inputValue(),'Commercial Gym');assert.equal(await page.locator('#exname-upper-a-Press-0').textContent(),'Incline Machine Chest Press');
await page.locator('#equip-upper-a').selectOption('default');assert.equal(await page.locator('#exname-upper-a-Press-0').textContent(),'Incline DB Press');
await page.locator('[data-tab=run]').click();await page.locator('#gpsDetails summary').first().click();await page.locator('#gpsStart').click();
await page.evaluate(()=>{const now=Date.now();gpsSuccess({timestamp:now-10000,coords:{latitude:40,longitude:-74,accuracy:5}});gpsSuccess({timestamp:now,coords:{latitude:40.0005,longitude:-74,accuracy:5}});});
assert.ok(await page.evaluate(()=>outdoor.meters>50&&outdoor.meters<60));
await page.evaluate(()=>{gpsSuccess({timestamp:Date.now()+1000,coords:{latitude:41,longitude:-74,accuracy:5}});});assert.equal(await page.evaluate(()=>outdoor.points.length),2,'Reject GPS jump');
await page.locator('#gpsStart').click();const meters=await page.evaluate(()=>outdoor.meters);await page.reload();await page.locator('[data-tab=run]').click();assert.equal(await page.evaluate(()=>outdoor.running),false);assert.equal(await page.evaluate(()=>outdoor.meters),meters);
await page.locator('#gpsStart').click();await page.evaluate(()=>gpsSuccess({timestamp:Date.now(),coords:{latitude:40.01,longitude:-74,accuracy:5}}));assert.equal(await page.evaluate(()=>outdoor.meters),meters,'Resume never bridges paused route');
await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.evaluate(()=>outdoor.running),false);
await page.evaluate(()=>Object.defineProperty(document,'hidden',{value:false,configurable:true}));
await page.evaluate(()=>{outdoor.seconds=60;drawOutdoor();});await page.locator('#gpsSave').click();assert.equal(await page.evaluate(()=>log.length),1);assert.equal(await page.evaluate(()=>log[0].label),'GPS Ruck');await page.evaluate(()=>saveOutdoor());assert.equal(await page.evaluate(()=>log.length),1);
await page.locator('#gpsStart').click();await page.evaluate(()=>gpsError({code:1}));assert.equal(await page.evaluate(()=>outdoor.running),false);assert.ok((await page.locator('#gpsStatus').textContent()).includes('denied'));
for(const width of [320,390,430]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);}
await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/outdoor-preview.png',fullPage:true});assert.deepEqual(errors,[]);await browser.close();server.close();console.log('PASS: gym switch/restore, GPS distance/jump rejection, pause gaps, reload, hidden pause, save/deduplication, permission error, mobile widths.');})().catch(e=>{console.error(e);process.exit(1);});
