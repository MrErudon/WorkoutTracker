const {chromium}=require('playwright');
const AxeBuilder=require('@axe-core/playwright').default;
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{const f=path.join(root,req.url==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/html');res.end(fs.readFileSync(f));}catch{res.statusCode=404;res.end();}}).listen(0);
(async()=>{const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true});try{const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});const page=await context.newPage();await page.goto(`http://localhost:${server.address().port}`);for(const width of [320,390,430,1280]){await page.setViewportSize({width,height:844});for(const tab of ['train','free','speed','run','log']){await page.locator(`[data-tab=${tab}]`).click();const r=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();require('node:assert/strict').deepEqual(r.violations.map(v=>v.id),[],tab+' accessibility');}}console.log('PASS: five views at four widths, WCAG A/AA scan');}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1});

