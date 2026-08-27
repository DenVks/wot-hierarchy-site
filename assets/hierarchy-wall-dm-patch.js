// Anomalous Wall hierarchy matcher for DM Toolkit.
// Loaded after dm-npc.js and only extends hierarchy relevance detection.
(function(){
  if (typeof window.hierarchyIsRelevantToNpc !== 'function') return;
  const original = window.hierarchyIsRelevantToNpc;
  window.hierarchyIsRelevantToNpc = function(h, c){
    if (h && String(h.id || '') === 'anomalous-wall') {
      const raw = [
        c && c.hi && c.hi.nm,
        c && c.hi && c.hi.ty,
        c && c.hiIcon,
        ...((c && c.tags) || [])
      ].filter(Boolean).join(' ').toLowerCase().replace(/ё/g,'е');
      return /аномальн[^ ]*\s+стен|иерарх[^ ]*\s+стен|страж[^ ]*\s+проход|помеченн[^ ]*\s+шв|голос\s+гребня|архистраж\s+проход|\bпроводник\b/.test(raw);
    }
    return original(h, c);
  };
})();
