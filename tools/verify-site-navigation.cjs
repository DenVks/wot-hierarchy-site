const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const baseline='4177f636212140ff7b3af34561b6136955673951';
const normalize=value=>value.replace(/\r\n/g,'\n');
const baseFile=file=>normalize(cp.execFileSync('git',['show',baseline+':'+file],{encoding:'utf8'}));
const root=process.cwd();
const context={window:{},location:{pathname:'/index.html'},document:{querySelector:()=>null,getElementById:()=>null}};
vm.createContext(context);vm.runInContext(fs.readFileSync('assets/site-navigation.js','utf8'),context);
const config=context.window.WOT_SITE_NAV;
const all=[...config.groups.flatMap(g=>g.items),...config.toolGroups.flatMap(g=>g.items)],routes=new Map();
for(const item of all){assert(fs.existsSync(path.join(root,item.href)),item.href);if(routes.has(item.href))assert.equal(routes.get(item.href),item.label,'Different labels for '+item.href);routes.set(item.href,item.label);}
const pages=fs.readdirSync('.').filter(f=>f.endsWith('.html'));let active=0,nav=0,compact=0;
for(const page of pages){
 const text=normalize(fs.readFileSync(page,'utf8'));
 if(/http-equiv=["']refresh/i.test(text)){assert(text===baseFile(page),'Redirect changed: '+page);continue;}
 active++;
 assert.equal((text.match(/src="assets\/site-navigation\.js/g)||[]).length,1,page+' navigation dependency');
 assert.equal((text.match(/href="assets\/site-navigation\.css/g)||[]).length,1,page+' navigation style');
 if(text.includes('class="sitenav"')){nav++;assert(text.includes('assets/shared.js?v=183'),page+' access handler');}else compact++;
}
const toolkit=fs.readFileSync('dm-toolkit.html','utf8');assert(toolkit.includes('assets/auth.js'));
for(const group of config.toolGroups)assert(toolkit.includes('href="#'+group.id+'"'));
const original=baseFile('assets/shared.js'),current=normalize(fs.readFileSync('assets/shared.js','utf8'));
function section(text,start,end){const a=text.indexOf(start),b=text.indexOf(end,a);assert(a>=0&&b>=a,'Missing access-code boundary');return text.slice(a,b);}
assert(section(current,'  const PASSWORD','  function isUnlocked')===section(original,'  const PASSWORD','  const path ='),'Access constants or storage keys changed');
assert(section(current,'  function isUnlocked','  document.addEventListener')===section(original,'  function isUnlocked','  Array.from(navLinks'),'Access functions changed');
assert(current.slice(current.indexOf('  function showDmToolkitPrompt'),current.lastIndexOf('})();'))===original.slice(original.indexOf('  function showDmToolkitPrompt'),original.lastIndexOf('})();')),'Access prompt changed');
for(const group of config.toolGroups)assert.equal(new Set(group.items.map(item=>item.href)).size,group.items.length);
for(const target of ['hierarchy-wall.html#p1','loot-generator.html#temporal']){const[file,id]=target.split('#'),text=fs.readFileSync(file,'utf8');assert(new RegExp('id=["\u0027]'+id+'["\u0027]').test(text),target);}
console.log('PASS:',routes.size,'navigation targets and consistent labels;',active,'active pages:',nav,'full navigation,',compact,'compact return paths; redirects/anchors/access functions retained across LF/CRLF.');
