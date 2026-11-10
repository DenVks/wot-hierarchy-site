const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=process.cwd();const context={window:{},location:{pathname:'/index.html'},document:{querySelector:()=>null,getElementById:()=>null}};vm.createContext(context);vm.runInContext(fs.readFileSync('assets/site-navigation.js','utf8'),context);
const config=context.window.WOT_SITE_NAV;const all=[...config.groups.flatMap(g=>g.items),...config.toolGroups.flatMap(g=>g.items)];const routes=new Map();
for(const item of all){assert(fs.existsSync(path.join(root,item.href)),item.href);if(routes.has(item.href))assert.equal(routes.get(item.href),item.label,'Different labels for '+item.href);routes.set(item.href,item.label);}
const pages=fs.readdirSync('.').filter(f=>f.endsWith('.html'));let active=0,nav=0,compact=0;
for(const page of pages){const text=fs.readFileSync(page,'utf8');if(/http-equiv=["']refresh/i.test(text)){assert.equal(text,cp.execFileSync('git',['show','4177f636212140ff7b3af34561b6136955673951:'+page],{encoding:'utf8'}),'Redirect changed');continue;}active++;assert.equal((text.match(/src="assets\/site-navigation\.js/g)||[]).length,1,page+' navigation dependency');assert.equal((text.match(/href="assets\/site-navigation\.css/g)||[]).length,1,page+' navigation style');if(text.includes('class="sitenav"')){nav++;assert(text.includes('assets/shared.js?v=183'),page+' access handler');}else compact++;}
const toolkit=fs.readFileSync('dm-toolkit.html','utf8');assert(toolkit.includes('assets/auth.js'));for(const g of config.toolGroups){assert(toolkit.includes('href="#'+g.id+'"'));}
const original=cp.execFileSync('git',['show','4177f636212140ff7b3af34561b6136955673951:assets/shared.js'],{encoding:'utf8'}),current=fs.readFileSync('assets/shared.js','utf8');
const section=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
assert.equal(section(current,'  const PASSWORD','  function isUnlocked'),section(original,'  const PASSWORD','  const path ='));
assert.equal(section(current,'  function isUnlocked','  document.addEventListener'),section(original,'  function isUnlocked','  Array.from(navLinks'));
assert.equal(current.slice(current.indexOf('  function showDmToolkitPrompt'),current.lastIndexOf('})();')),original.slice(original.indexOf('  function showDmToolkitPrompt'),original.lastIndexOf('})();')));
for(const g of config.toolGroups)assert.equal(new Set(g.items.map(i=>i.href)).size,g.items.length);
for(const target of ['hierarchy-wall.html#p1','loot-generator.html#temporal']){const[file,id]=target.split('#'),text=fs.readFileSync(file,'utf8');assert(new RegExp('id=["\u0027]'+id+'["\u0027]').test(text),target);}
console.log('PASS:',routes.size,'navigation targets and consistent labels;',active,'active pages:',nav,'full navigation,',compact,'compact return paths; redirects/anchors/access functions retained.');
