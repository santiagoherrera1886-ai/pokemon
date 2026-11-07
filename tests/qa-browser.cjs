/**
 * Browser regression test (Playwright, optional local dependency).
 * npm install --no-save playwright && npx playwright install chromium
 * node tests/qa-browser.cjs
 */
const fs=require("node:fs"),path=require("node:path"),http=require("node:http");
const assert=require("node:assert/strict");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"..");
const base=fs.readFileSync(path.join(root,"hd2d.js"),"utf8");
const instrumentation=[
 'window.__qa={',
 ' go:(name,x,y)=>{scene=name;state.scene=name;state.x=x;state.y=y;cam.x=x;cam.y=y-1.5;dialog=null;modal="";battle=null;',
 ' for(const id of ["dialog","starterModal","battle","shopModal"])hide(id);},',
 ' read:()=>({scene,quest:state.quest,x:state.x,y:state.y})',
 '};'
].join("\n");
const files={
 "/":{data:fs.readFileSync(path.join(root,"index.html")),type:"text/html"},
 "/index.html":{data:fs.readFileSync(path.join(root,"index.html")),type:"text/html"},
 "/hd2d.html":{data:fs.readFileSync(path.join(root,"hd2d.html")),type:"text/html"},
 "/hd2d.js":{data:Buffer.from(base+"\n"+instrumentation),type:"text/javascript"},
 "/hd2d.css":{data:fs.readFileSync(path.join(root,"hd2d.css")),type:"text/css"}
};
const server=http.createServer((req,res)=>{
 const p=new URL(req.url,"http://localhost").pathname,file=files[p];
 res.writeHead(file?200:404,{"Content-Type":file?file.type:"text/plain"});
 res.end(file?file.data:"Not found");
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function run(){
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const address="http://127.0.0.1:"+server.address().port+"/";
 const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:820}});
  const errors=[];page.on("pageerror",e=>errors.push(e.message));
  await page.goto(address,{waitUntil:"domcontentloaded"});
  await page.click("#newGame");
  const advance=async()=>{for(let i=0;i<7;i++){if(await page.locator("#dialog").isHidden())break;await page.keyboard.press("Enter");await sleep(35)}};
  const go=async(scene,x,y)=>{await page.evaluate(([name,x,y])=>window.__qa.go(name,x,y),[scene,x,y]);await sleep(65)};
  const get=async()=>page.evaluate(()=>window.__qa.read());
  await advance();assert.equal((await get()).scene,"bedroom");
  assert.equal(await page.locator("#quest").isHidden(),true);
  await page.click("#missionToggle");assert.equal(await page.locator("#quest").isVisible(),true);
  await page.click("#missionToggle");
  await go("bedroom",8,11.1);await page.keyboard.press("e");assert.equal((await get()).quest,1);
  await go("home",11.8,8);await page.keyboard.press("e");await advance();assert.equal((await get()).quest,2);
  await go("barry",6.8,6.8);await page.keyboard.press("e");await advance();assert.equal((await get()).quest,3);
  await go("outside",18.1,36.9);await page.keyboard.press("e");await advance();
  assert.equal(await page.locator("#starterModal").isVisible(),true);
  await page.locator('[data-starter="Piplup"]').click();await advance();
  assert.equal(await page.locator("#battle").isVisible(),true);
  for(let i=0;i<7&&await page.locator("#battle").isVisible();i++){
   await page.locator("#specialBtn").click();await sleep(1250);
  }
  assert.equal((await get()).quest,5,"scripted battle advances the story");
  await go("home",11.8,8);await page.keyboard.press("e");await advance();assert.equal((await get()).quest,6);
  await go("lab",8,6.8);await page.keyboard.press("e");await advance();assert.equal((await get()).quest,7);
  await go("outside",50,37.3);
  await page.keyboard.down("ArrowUp");await sleep(270);await page.keyboard.up("ArrowUp");
  assert.equal((await get()).scene,"mart","mart entry");
  await page.keyboard.down("ArrowUp");await sleep(850);await page.keyboard.up("ArrowUp");
  await page.keyboard.press("e");assert.equal(await page.locator("#shopModal").isVisible(),true);
  const money0=await page.locator("#shopMoney").textContent();
  await page.locator('[data-buy="ball"]').click();
  const money1=await page.locator("#shopMoney").textContent();
  assert.match(money0,/3000/);assert.match(money1,/2800/);
  await page.locator("#shopClose").click();
  await page.keyboard.down("ArrowDown");await sleep(1300);await page.keyboard.up("ArrowDown");
  assert.equal((await get()).scene,"outside","automatic exit");
  await go("outside",66,37.35);
  await page.keyboard.down("ArrowUp");await sleep(270);await page.keyboard.up("ArrowUp");
  assert.equal((await get()).scene,"center","center entry");
  await page.keyboard.down("ArrowUp");await sleep(850);await page.keyboard.up("ArrowUp");
  await page.keyboard.press("e");assert.equal(await page.locator("#dialog").isVisible(),true);
  await advance();
  const cnv=await page.locator("#screen").evaluate(el=>({w:el.width,cssW:el.getBoundingClientRect().width}));
  assert.ok(cnv.w<cnv.cssW,"pixel art canvas is displayed with nearest-neighbor scaling");
  assert.equal(errors.length,0,"desktop JS errors");
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const mp=await mobile.newPage();const mobileErrors=[];
  mp.on("pageerror",e=>mobileErrors.push(e.message));
  await mp.goto(address,{waitUntil:"domcontentloaded"});await mp.click("#newGame");
  assert.equal(await mp.locator("#touchpad").isVisible(),true);
  for(let i=0;i<3;i++)await mp.locator("#dialog").tap();
  await mp.evaluate(()=>window.__qa.go("outside",22,70));await sleep(100);
  const p0=await mp.evaluate(()=>window.__qa.read());
  const bbox=await mp.locator('[data-game-key="arrowdown"]').boundingBox();
  const cdp=await mobile.newCDPSession(mp);
  await cdp.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x:bbox.x+bbox.width/2,y:bbox.y+bbox.height/2}]});
  await sleep(300);await cdp.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});
  const p1=await mp.evaluate(()=>window.__qa.read());
  assert.ok(p1.y>p0.y,"touch movement works");
  assert.equal(mobileErrors.length,0,"mobile JS errors");
  console.log(JSON.stringify({status:"PASS",quest:7,mart:true,center:true,mobile:true,jsErrors:0}));
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
}
run().catch(e=>{console.error(e.stack);server.close();process.exitCode=1});
