// Run by CI in real Chromium. This is a render/regression harness, not production code.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(__dirname,'screenshots','graphics');fs.mkdirSync(out,{recursive:true});
const types={'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png'};
const server=http.createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname,f=path.join(root,p==='/'?'index.html':p);if(!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);});
const report={checks:[],scenes:[],errors:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function run(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:950}});page.on('pageerror',e=>report.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/font|net::|favicon/.test(m.text()))report.errors.push(m.text());});
  await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.click('[data-act="new"]');await page.click('[data-act="ok"]');
  await page.waitForFunction(()=>window.__game?.graphics.status==='ready',{},{timeout:30000});
  await page.waitForFunction(()=>__ui.dialog && __game.ow.scripts>0);
  await page.evaluate(()=>{while(__ui.dialog)__ui.advance();__game.state.options.forceHour=12;});
  await page.waitForFunction(()=>__game.ow.scripts===0 && !__game.fading);
  await sleep(700);
  report.checks.push('WebGL2 renderer created');
  const maps=await page.evaluate(()=>Object.keys(__game.world.maps));
  for(const id of maps){
    await page.evaluate(id=>{const g=__game;g.state.story=12;g.state.flags={};const m=g.world.get(id);const pos=id==='brisal'?[10,10]:id==='lago'?[10,12]:id==='sendero1'?[19,8]:id==='arenal'?[12,10]:[Math.floor(m.w/2),Math.min(m.h-2,5)];g.ow.load(id,...pos,0,false);g.ow.scripts=1;},id);
    const snapshot=await page.evaluate(()=>{const s=structuredClone(__game.state);delete s.playTime;return s;});
    for(const mode of ['classic','premium']){
      await page.evaluate(mode=>__game.graphics.setMode(mode),mode);await sleep(550);
      await page.locator('#ds').screenshot({path:path.join(out,`${id}-${mode}.png`)});
      const after=await page.evaluate(()=>{const s=structuredClone(__game.state);delete s.playTime;return s;});assert.deepEqual(after,snapshot,`mode preserves state in ${id}`);
    }
    report.scenes.push({id,...await page.evaluate(()=>{const e=__game.graphics.engine;return {calls:e.webgl.info.render.calls,triangles:e.webgl.info.render.triangles,geometries:e.webgl.info.memory.geometries,textures:e.webgl.info.memory.textures,maps:e.maps.size};})});
    console.log('Rendered both modes:',id);
  }
  assert.equal(maps.length,report.scenes.length);report.checks.push('37 maps captured in both modes; state equality verified');
  // The screen swaps while a movement is in progress; simulation remains continuous.
  await page.evaluate(()=>{const g=__game;g.ow.load('cuarto',2,4,3,false);g.ow.scripts=0;g.menus.home(false);g.ow.player.startMove(3,16);});
  await page.evaluate(()=>__game.graphics.setMode('classic'));await sleep(350);await page.evaluate(()=>__game.graphics.setMode('premium'));
  assert.deepEqual(await page.evaluate(()=>[__game.state.x,__game.state.y]),[3,4]);report.checks.push('mid-step mode switch preserves movement');
  // Resource release after repeated transitions must remain bounded.
  async function cycle(){for(const id of ['lab','tienda','brisal','cuarto']){await page.evaluate(id=>{__game.ow.scripts=1;__game.ow.load(id,3,4,0,false);},id);await sleep(100);}}
  await cycle();const mem1=await page.evaluate(()=>({...__game.graphics.engine.webgl.info.memory}));
  for(let i=0;i<3;i++)await cycle();const mem2=await page.evaluate(()=>({...__game.graphics.engine.webgl.info.memory}));
  assert.ok(mem2.geometries<=mem1.geometries+3,JSON.stringify({mem1,mem2}));assert.ok(mem2.textures<=mem1.textures+2,JSON.stringify({mem1,mem2}));report.checks.push('GPU resources remain bounded after 16 map transitions');
  const save=await page.evaluate(async()=>{const {saveState}=await import('/src/core/state.js');saveState(__game.state);return localStorage.getItem('alborada-save-v1');});
  await page.evaluate(()=>__game.graphics.engine.webgl.forceContextLoss());await sleep(300);
  assert.equal(await page.evaluate(()=>__game.graphics.engine.lost),true);
  assert.equal(await page.locator('#premium').isVisible(),false);
  await page.evaluate(()=>__game.graphics.engine.webgl.forceContextRestore());await sleep(1500);
  assert.equal(await page.evaluate(()=>__game.graphics.engine.lost),false);
  assert.equal(await page.evaluate(()=>localStorage.getItem('alborada-save-v1')),save);report.checks.push('WebGL loss/restoration preserves save');
  // All creature models use the existing battle presentation state.
  for(const sp of await page.evaluate(async()=>Object.keys((await import('/src/data/creatures.js')).SPECIES))){
    await page.evaluate(async sp=>{const {makeCreature}=await import('/src/data/creatures.js');const {Battle}=await import('/src/battle/battle.js');const g=__game;g.state.party=[makeCreature(sp,5)];g.battleObj=new Battle(g,{foe:makeCreature('pipiu',3),wild:true});Object.assign(g.battleObj.fx,{foeX:0,allyX:0});g.scene='battle';g.battleObj.showHud(true,true);g.battleObj.hud();__ui.show('Escena de combate · '+g.state.party[0].name);},sp);
    await sleep(250);await page.locator('#ds').screenshot({path:path.join(out,`battle-${sp}.png`)});
  }
  report.checks.push('28 creature models and battle HUD rendered');
  // Exercise the original capture menu/turn with a guaranteed catch fixture in both renderers.
  for(const mode of ['classic','premium']){
    await page.evaluate(async mode=>{
      const {makeCreature}=await import('/src/data/creatures.js');const {Battle}=await import('/src/battle/battle.js');
      const g=__game;g.battleObj.cleanup();await g.graphics.setMode(mode);
      g.state.party=[makeCreature('charquin',5)];g.state.bag.supercapsula=1;
      const foe=makeCreature('pipiu',3);foe.hp=1;
      const b=new Battle(g,{foe,wild:true,canCatch:true});g.battleObj=b;g.scene='battle';
      Object.assign(b.fx,{foeX:0,allyX:0});b.showHud(true,true);b.hud();b.seen(foe);
      window.__captureResult=null;
      b.choose().then(action=>b.turn(action)).then(result=>window.__captureResult=result);
    },mode);
    await page.click('#panel .bt-bag');await page.click('#panel [data-act="supercapsula"]');
    await page.waitForFunction(()=>__game.battleObj.fx.ball!==null,null,{timeout:30000});
    await page.locator('#ds').screenshot({path:path.join(out,`capture-${mode}.png`)});
    await page.waitForFunction(()=>window.__captureResult!==null,null,{timeout:45000});
    assert.deepEqual(await page.evaluate(()=>[__captureResult,__game.state.party.length,__game.state.bag.supercapsula,__game.state.dex.pipiu]),['caught',2,0,2]);
  }
  report.checks.push('capture menu, capsule animation, inventory and dex verified in both modes');
  await page.evaluate(()=>{const g=__game;g.battleObj.cleanup();g.scene='overworld';g.ow.load('cuarto',2,4,0,false);g.menus.home(false);g.ow.scripts=0;});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>document.body.classList.add('force-pad'));await page.setViewportSize({width:391,height:844});await sleep(400);
  await page.locator('[data-btn="right"]').dispatchEvent('pointerdown');await sleep(450);await page.locator('[data-btn="right"]').dispatchEvent('pointerup');await sleep(350);
  assert.ok(await page.evaluate(()=>__game.state.x>2),'touch movement');await page.screenshot({path:path.join(out,'mobile-premium.png')});report.checks.push('mobile layout and touch movement');
  await page.setViewportSize({width:1100,height:950});
  for(const quality of ['low','medium','high']){
    await page.evaluate(q=>__game.graphics.setQuality(q),quality);await sleep(300);
    const actual=await page.evaluate(()=>{const e=__game.graphics.engine;return {quality:e.quality,shadow:e.webgl.shadowMap.enabled,width:e.canvas.width};});
    assert.equal(actual.quality,quality);assert.equal(actual.shadow,quality!=='low');assert.ok(actual.width>0);
    await page.locator('#ds').screenshot({path:path.join(out,`quality-${quality}.png`)});
  }
  report.checks.push('low, medium and high quality render successfully');
  await page.evaluate(()=>{__game.ow.scripts=1;__game.ow.load('brisal',10,10,0,false);__game.state.options.forceHour=22;});await sleep(350);await page.locator('#ds').screenshot({path:path.join(out,'brisal-night.png')});
  // Expected messages emitted by deliberately losing the context are not shader errors.
  report.errors=report.errors.filter(e=>!/CONTEXT_LOST_WEBGL/.test(e));assert.deepEqual(report.errors,[]);
  report.passed=true;
 }finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();server.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
