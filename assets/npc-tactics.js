(function(){
  'use strict';

  // Indices point to the existing five full tactic records on each NPC.
  // The profile only describes deterministic sequencing and context overrides.
  window.WOT_NPC_TACTIC_PROFILES = {
    43:{sequence:[0,1,3,2,4],contexts:{adjacent:1,group:3,channeler:4,hold:0},lowHp:2},
    44:{sequence:[0,1,2,3,4],contexts:{adjacent:4,group:3,channeler:3,hold:4},lowHp:4},
    45:{sequence:[0,1,2,3,4],contexts:{adjacent:1,group:4,channeler:4,hold:4},lowHp:4},
    46:{sequence:[0,1,2,3,4],contexts:{adjacent:3,group:0,channeler:2,hold:3},lowHp:3},
    47:{sequence:[0,1,2,3,4],contexts:{adjacent:4,group:2,channeler:0,hold:4},lowHp:4},
    48:{sequence:[0,1,2,3,4],contexts:{adjacent:2,group:1,channeler:4,hold:4},lowHp:4},
    49:{sequence:[0,1,2,3,4],contexts:{adjacent:1,group:2,channeler:2,hold:3},lowHp:3},
    50:{sequence:[0,1,2,3,4],contexts:{adjacent:4,group:1,channeler:3,hold:3},lowHp:4}
  };
})();
