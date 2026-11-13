/* Per-tab drafts protect concurrent edits; the latest copy is only a new-tab starting point. */
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=factory(node?require('./encounter-scene.js'):root.WOT_ENCOUNTER,node?require('./github-store.js'):root.WOT_GITHUB_STORE);
  if(node)module.exports=api;else root.WOT_ENCOUNTER_DRAFT=api;
})(typeof window==='object'?window:globalThis,function(E,{clone,StoreError}){
  const LATEST='wot.encounterScene.draft.v1',TAB='wot.encounterScene.tab.v1';
  function validate(value){
    if(!value||value.version!==1)throw new StoreError('DRAFT_INVALID','Неизвестная версия черновика.');
    const scene=E.validateScene(value.scene),meta=value.cloudMeta;
    if(meta!==null&&meta!==undefined){if(typeof meta.key!=='string'||meta.key.length>512||typeof meta.sceneId!=='string'||meta.sceneId!==scene.sceneId||typeof meta.revision!=='string'||meta.revision.length>200)throw new StoreError('DRAFT_INVALID','Повреждена привязка черновика к GitHub.');}
    return{version:1,scene,cloudMeta:meta?clone(meta):null};
  }
  class DraftStore{
    constructor({local,session,uuid=()=>crypto.randomUUID()}={}){
      try{this.local=local||globalThis.localStorage;if(!this.local)throw Error();}catch{this.local={getItem:()=>null,setItem:()=>{throw new StoreError('STORAGE','Хранилище браузера недоступно.');}};}let tabId;try{session=session||globalThis.sessionStorage;tabId=session.getItem(TAB);if(!/^[-a-zA-Z0-9_]{1,100}$/.test(tabId||'')){tabId=uuid();session.setItem(TAB,tabId);}}catch{tabId=uuid();}
      this.key=LATEST+'.tab.'+tabId;this.backupKey=this.key+'.backup';this.blocked=false;this.unreadable=null;
    }
    load(){const raw=this.local.getItem(this.key)||this.local.getItem(LATEST);if(!raw)return null;try{return validate(JSON.parse(raw));}catch{this.blocked=true;this.unreadable=raw;throw new StoreError('DRAFT_INVALID','Черновик не читается. Исходная запись сохранена без изменений.');}}
    save(value){if(this.blocked)return false;const data=JSON.stringify(validate(value));this.local.setItem(this.key,data);this.local.setItem(LATEST,data);return true;}
    backup(value){const raw=this.blocked?this.unreadable:JSON.stringify(validate(value));if(raw!==null)this.local.setItem(this.backupKey,raw);}
    loadBackup(){const raw=this.local.getItem(this.backupKey)||this.local.getItem(LATEST+'.backup');if(!raw)throw new StoreError('DRAFT_MISSING','Резервная копия пока не создана.');return validate(JSON.parse(raw));}
    unblock(){this.blocked=false;this.unreadable=null;}
  }
  return{DraftStore,validate,LATEST,TAB};
});
