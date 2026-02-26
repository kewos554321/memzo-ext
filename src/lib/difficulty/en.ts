import type { CEFRLevel } from "../types";
import type { LangDifficulty } from "./index";

// ── English CEFR word sets ───────────────────────────────────────────────────
// Based on Oxford 3000, NGSL, and Cambridge CEFR vocabulary lists.
// Coverage goal: 600+ A1, 700+ A2, 800+ B1, 600+ B2 to minimise false C1 fallback.
// Words not found in any set default to C1.

const A1 = new Set([
  // VERBS — core actions
  "act","add","answer","arrive","ask","be","begin","break","bring","build",
  "buy","call","carry","catch","change","clean","close","come","cook","count",
  "cover","cross","cut","dance","decide","do","draw","dream","drink","drive",
  "drop","eat","end","enjoy","enter","fall","feel","fight","fill","find",
  "finish","fly","follow","forget","get","give","go","grow","hang","happen",
  "have","hear","help","hold","hope","hurt","jump","keep","kill","know",
  "laugh","learn","leave","let","like","listen","live","look","love","make",
  "mean","meet","miss","move","need","open","pay","pick","plan","play",
  "point","pull","push","put","reach","read","remember","ride","run","save",
  "say","see","sell","send","show","sing","sit","sleep","smell","speak",
  "spend","stand","start","stay","stop","study","swim","take","talk","teach",
  "tell","think","touch","try","turn","understand","use","visit","wait",
  "walk","want","wash","watch","wear","win","work","worry","write",
  "check","click","connect","copy","create","download","draw","fix","hit",
  "lift","mix","open","pick","press","print","repeat","return","share",
  "sign","skip","smile","text","type","upload",

  // NOUNS — people & family
  "adult","aunt","baby","boy","brother","child","dad","daughter","doctor",
  "family","father","friend","girl","grandma","grandpa","husband","kid","man",
  "mom","mother","nurse","parent","person","sister","son","teacher","uncle",
  "wife","woman","couple","guest","neighbor","player","student","visitor","worker",

  // NOUNS — body
  "arm","back","blood","body","bone","brain","ear","eye","face","finger",
  "foot","hair","hand","head","heart","knee","leg","lip","mouth","neck",
  "nose","shoulder","skin","stomach","throat","thumb","toe","tooth","tongue",

  // NOUNS — home & daily objects
  "bag","bath","bathroom","bed","bedroom","belt","bike","boat","book","boot",
  "bottle","box","bread","bus","cake","camera","card","chair","clock","coat",
  "cup","desk","door","dress","egg","fork","glass","hat","home","house",
  "key","kitchen","knife","lamp","laptop","letter","map","mirror","paper",
  "pen","phone","photo","picture","plate","room","shoe","shirt","sock",
  "sofa","spoon","table","ticket","toy","umbrella","watch","window",

  // NOUNS — food & drink
  "apple","banana","butter","cheese","chicken","coffee","cookie","dinner",
  "drink","fish","food","fruit","juice","lunch","meal","meat","milk",
  "potato","rice","salad","sandwich","soup","sugar","tea","water",

  // NOUNS — nature & animals
  "animal","beach","bird","cat","cloud","dog","earth","farm","fire",
  "flower","forest","garden","hill","horse","ice","island","lake","leaf",
  "lion","moon","mountain","ocean","park","pig","plant","rain","river",
  "road","rock","sand","sea","sheep","sky","snow","star","stone","storm",
  "street","sun","tree","valley","wind","wood","zoo",

  // NOUNS — places & buildings
  "airport","bank","bar","bridge","cafe","church","club","corner","hotel",
  "library","market","museum","office","post","restaurant","school","shop",
  "station","store","town","train","village",

  // NOUNS — time
  "afternoon","age","day","evening","hour","minute","moment","month",
  "morning","night","noon","season","second","time","today","tomorrow",
  "tonight","week","weekend","year","yesterday",

  // NOUNS — technology & media (very common in YouTube)
  "app","channel","computer","email","game","internet","link","message",
  "movie","music","news","online","page","photo","program","site","text",
  "video","website","wifi",

  // NOUNS — other common
  "address","answer","area","art","ball","camp","color","dance","dream",
  "group","job","language","life","line","list","love","luck","match",
  "money","name","number","part","path","place","plan","point","price",
  "problem","question","reason","result","rule","sign","song","sport",
  "story","subject","test","thing","trip","visit","voice","wall","way",
  "word","world",

  // ADJECTIVES
  "afraid","alone","angry","awful","bad","beautiful","big","black","blue",
  "boring","brave","bright","broken","brown","busy","cheap","clean","cold",
  "comfortable","cool","correct","cute","dark","dead","different","dirty",
  "dry","early","easy","empty","enough","exciting","expensive","famous",
  "far","fast","fat","fine","flat","free","fresh","friendly","full","funny",
  "good","great","green","happy","hard","healthy","heavy","helpful","high",
  "horrible","hot","huge","hungry","important","interesting","kind","large",
  "late","lazy","light","little","long","loud","lovely","lucky","modern",
  "narrow","neat","new","nice","normal","old","open","orange","perfect",
  "pink","poor","pretty","purple","quick","quiet","ready","real","red",
  "rich","right","rough","round","sad","safe","same","serious","short",
  "sick","simple","slow","small","smart","soft","sorry","special","strange",
  "strong","sure","sweet","tall","terrible","thin","tired","ugly","unhappy",
  "usual","warm","weak","wet","wide","wild","wonderful","wrong","young",

  // ADVERBS & FUNCTION WORDS (content-bearing)
  "again","almost","already","also","always","away","back","before","close",
  "down","else","enough","even","ever","fast","finally","hard","here",
  "home","inside","just","late","maybe","much","never","now","often",
  "once","only","out","outside","quite","really","right","slowly","so",
  "soon","still","there","together","too","up","usually","very","well",
  "yet",
]);

const A2 = new Set([
  // VERBS
  "accept","achieve","add","adjust","advertise","afford","agree","allow",
  "apologize","appear","apply","arrange","avoid","bake","behave","belong",
  "borrow","cancel","celebrate","choose","collect","communicate","compare",
  "complete","contain","continue","damage","deal","depend","describe",
  "develop","disappear","discover","discuss","earn","encourage","exist",
  "expect","explain","express","fail","fill","fit","focus","follow",
  "guess","handle","identify","improve","include","increase","inform",
  "introduce","invite","join","manage","notice","offer","organize","pass",
  "perform","plan","prefer","prepare","present","prevent","produce","promise",
  "provide","realize","receive","recognize","recommend","refuse","relax",
  "replace","report","request","require","respond","review","search","seem",
  "solve","suggest","support","suppose","trust","update","warn",

  // NOUNS — everyday life
  "accident","action","activity","advantage","advice","age","air",
  "answer","appointment","area","article","atmosphere","attitude",
  "author","background","balance","band","bedroom","behaviour","belief",
  "bill","boss","brand","break","building","business","calendar",
  "campaign","capital","care","career","cause","celebration","center",
  "chance","class","clothing","coach","collection","college","competition",
  "condition","connection","content","context","contract","control",
  "conversation","cost","course","credit","culture","customer","danger",
  "death","decision","degree","design","detail","diet","difference",
  "direction","distance","dream","driver","duty","east","economy","effect",
  "effort","election","energy","engine","environment","event","example",
  "exercise","experience","experiment","fact","feature","feeling","floor",
  "follow","form","freedom","future","government","guide","gym","habit",
  "height","history","holiday","hospital","idea","information","interest",
  "interview","issue","item","journey","knowledge","leader","lesson","level",
  "location","loss","magazine","main","material","meaning","media","meeting",
  "member","memory","mind","mistake","model","noise","north","object",
  "opinion","opportunity","owner","pain","paragraph","party","passport",
  "past","patient","payment","percent","performance","planet","police",
  "politics","position","power","practice","process","product","progress",
  "project","promise","quality","radio","reaction","reading","record",
  "relationship","religion","responsibility","review","risk","role",
  "routine","scene","schedule","science","section","sentence","service",
  "situation","society","south","space","speed","statement","student",
  "style","subject","summer","surprise","system","task","temperature",
  "test","text","theme","topic","tradition","travel","treatment","type",
  "university","vacation","value","view","weight","west","winner","wish",
  "youth",

  // TECHNOLOGY & SOCIAL MEDIA (very A2 in modern usage)
  "account","application","article","battery","button","chat","comment",
  "contact","data","device","digital","follow","format","keyboard",
  "like","log","media","network","notification","password","photo",
  "platform","post","profile","screen","search","send","setting",
  "software","speaker","stream","subscribe","tag","upload","user",

  // ADJECTIVES
  "able","active","amazing","available","basic","careful","certain",
  "clear","common","complete","correct","creative","curious","dangerous",
  "dark","difficult","direct","equal","excellent","exciting","extra",
  "familiar","foreign","formal","friendly","general","global","healthy",
  "helpful","independent","informal","limited","main","national","natural",
  "necessary","negative","next","obvious","official","opposite","original",
  "personal","physical","popular","positive","possible","powerful","practical",
  "private","public","recent","regular","responsible","right","social",
  "specific","successful","sudden","traditional","typical","useful","various",
  "whole","wonderful",

  // ADVERBS
  "absolutely","actually","almost","already","although","anyway","around",
  "basically","certainly","clearly","currently","definitely","directly",
  "easily","especially","exactly","extremely","finally","generally","hopefully",
  "however","immediately","instead","mainly","mostly","normally","obviously",
  "personally","perhaps","probably","quickly","recently","simply","slowly",
  "suddenly","together","totally","unfortunately","usually","usually",
]);

const B1 = new Set([
  // VERBS
  "absorb","accomplish","acknowledge","acquire","adapt","address","affect",
  "allocate","analyse","announce","anticipate","assess","assign","assist",
  "associate","assume","attempt","attribute","benefit","calculate","capture",
  "categorize","challenge","characterize","collaborate","communicate","compete",
  "concentrate","conduct","confirm","connect","consider","consult","contribute",
  "convert","coordinate","debate","define","deliver","demonstrate","derive",
  "designate","detect","determine","develop","differentiate","direct","distribute",
  "eliminate","emphasize","enable","ensure","establish","evaluate","examine",
  "expand","facilitate","focus","formulate","generate","highlight","identify",
  "illustrate","implement","indicate","influence","inform","integrate",
  "interpret","investigate","maintain","manage","measure","modify","motivate",
  "negotiate","obtain","operate","organise","participate","perceive","perform",
  "predict","process","promote","propose","qualify","record","reduce","reflect",
  "regulate","reinforce","relate","resolve","retain","select","separate",
  "simplify","specify","stimulate","strengthen","submit","summarise","support",
  "test","transfer","translate","treat","update","utilize","validate","verify",

  // NOUNS — abstract & academic
  "ability","accommodation","achievement","advantage","agenda","alternative",
  "ambition","analysis","approach","aspect","assessment","assistance",
  "atmosphere","authority","awareness","balance","behaviour","benefit","budget",
  "capability","capacity","category","challenge","characteristic","circumstance",
  "combination","commitment","communication","competition","concept","concern",
  "conclusion","confidence","connection","consequence","consideration",
  "contribution","conviction","criteria","criticism","curriculum","deadline",
  "decade","definition","demand","description","destination","determination",
  "discipline","distinction","diversity","document","efficiency","element",
  "emergency","emphasis","employment","encounter","evidence","evolution",
  "expression","extension","factor","feature","fiction","figure","flexibility",
  "foundation","framework","function","funding","generation","guidance",
  "impact","income","independence","initiative","inspection","intention",
  "investigation","investment","involvement","issue","leadership","legislation",
  "limitation","majority","mechanism","minority","mission","motivation",
  "network","obligation","opportunity","outcome","pattern","perspective",
  "phenomenon","pollution","priority","production","profession","proportion",
  "protection","publication","purpose","qualification","quantity","recognition",
  "recovery","reduction","reputation","requirement","research","resolution",
  "resource","revolution","satisfaction","sector","security","selection",
  "significance","situation","stability","status","strategy","structure",
  "submission","tension","theory","transformation","trend","variation","vision",

  // NOUNS — professional & social
  "account","achievement","administration","agreement","audience","author",
  "candidate","charity","citizen","claim","client","colleague","community",
  "complaint","conclusion","cooperation","corporation","council","coverage",
  "debate","declaration","demand","department","discovery","economy","editor",
  "election","employee","employer","environment","equipment","estimate",
  "evaluation","exhibition","expert","facility","finance","fund","income",
  "institution","investment","journal","justice","labour","leader","management",
  "manufacturer","media","method","minister","opportunity","organisation",
  "partnership","patient","perception","policy","politician","pollution",
  "population","profit","promotion","proposal","provider","reaction",
  "recommendation","reform","regulation","representation","research",
  "resource","revision","schedule","scheme","settlement","shortage","solution",
  "source","speech","sponsor","survey","technique","technology","transition",
  "treatment","union","variation","welfare",

  // ADJECTIVES
  "accurate","adequate","appropriate","aware","capable","complex",
  "comprehensive","consistent","constructive","critical","crucial","cultural",
  "current","detailed","distinct","diverse","dominant","dynamic","economic",
  "effective","efficient","emotional","ethical","evident","existing",
  "extensive","external","flexible","formal","fundamental","genuine",
  "global","gradual","historical","ideal","intellectual","internal","legal",
  "logical","major","mental","multiple","mutual","objective","overall",
  "physical","potential","practical","precise","primary","professional",
  "protective","relevant","reliable","required","scientific","secondary",
  "significant","stable","standard","substantial","technical","theoretical",
  "unique","valid","virtual","visible","widespread",

  // ADVERBS
  "accordingly","additionally","consequently","considerably","continuously",
  "currently","effectively","equally","essentially","eventually","frequently",
  "furthermore","gradually","hardly","increasingly","initially","instantly",
  "likewise","meanwhile","moreover","namely","nearly","nevertheless","notably",
  "occasionally","partially","primarily","previously","properly","rapidly",
  "regardless","relatively","respectively","significantly","slightly",
  "specifically","subsequently","therefore","thoroughly","typically","widely",
]);

const B2 = new Set([
  // VERBS
  "accelerate","accommodate","acknowledge","advocate","alleviate","allocate",
  "alter","articulate","attribute","challenge","clarify","collaborate",
  "compensate","compile","comply","conceive","consolidate","contradict",
  "coordinate","correlate","cultivate","deduce","depict","derive","diagnose",
  "differentiate","diminish","disclose","discriminate","diversify","dominate",
  "endorse","enhance","enumerate","evolve","exceed","exhibit","exploit",
  "fluctuate","hypothesize","incorporate","inhibit","innovate","justify",
  "mitigate","minimize","mobilize","monitor","neutralize","offset","omit",
  "oppose","optimise","override","persist","portray","prioritize","project",
  "rationalize","reinforce","restore","revise","scrutinize","signal",
  "specialize","stimulate","suppress","sustain","synthesize","trigger",
  "undermine","validate","verify","visualize","yield",

  // NOUNS — academic & professional
  "accountability","acquisition","adaptation","advocacy","agenda","alignment",
  "allocation","ambiguity","analogy","arbitration","assertion","assumption",
  "autonomy","bias","bureaucracy","catalyst","coherence","collaboration",
  "complexity","compliance","component","conception","consolidation",
  "contradiction","correlation","coverage","criterion","critique","currency",
  "delegation","dimensions","discourse","discrepancy","distinction","divergence",
  "domain","dynamics","empiricism","equilibrium","ethics","evaluation",
  "expertise","fluctuation","governance","hierarchy","implication","incentive",
  "incorporation","inference","infrastructure","insight","integration",
  "interaction","interpretation","mandate","methodology","migration","model",
  "nuance","paradigm","paradox","parameter","perception","polarization",
  "portfolio","pragmatism","precedent","procurement","protocol","ratio",
  "rationale","reconciliation","redundancy","regulation","reinforcement",
  "resilience","rhetoric","scope","specification","stakeholder","sustainability",
  "synthesis","threshold","trajectory","transparency","validity","vulnerability",

  // ADJECTIVES
  "abstract","ambiguous","analogous","arbitrary","authentic","bilateral",
  "coherent","comprehensive","conceptual","contradictory","controversial",
  "cumulative","discerning","empirical","explicit","feasible","fundamental",
  "implicit","inherent","instrumental","integral","interdependent","intrinsic",
  "legitimate","meticulous","novel","optimal","paramount","persistent",
  "plausible","preliminary","profound","proportional","rational","redundant",
  "rigorous","robust","sequential","sophisticated","straightforward",
  "subjective","systematic","unconventional","unprecedented","viable",
  "widespread",

  // ADVERBS
  "approximately","comprehensively","considerably","consistently","deliberately",
  "dramatically","essentially","explicitly","extensively","fundamentally",
  "inherently","intensely","legitimately","predominantly","prospectively",
  "proportionally","rigourously","substantially","systematically","theoretically",
  "ultimately","uniformly",
]);

function getLevel(word: string): CEFRLevel {
  const lower = word.toLowerCase().replace(/[^a-z'-]/g, "");
  if (A1.has(lower)) return "A1";
  if (A2.has(lower)) return "A2";
  if (B1.has(lower)) return "B1";
  if (B2.has(lower)) return "B2";
  return "C1";
}

function levelLabel(level: CEFRLevel): string {
  return level; // CEFR labels are self-describing
}

const placementWords: Record<CEFRLevel, string[]> = {
  A1: ["house", "eat", "big", "friend", "happy", "walk", "water", "day"],
  A2: ["explain", "weather", "important", "travel", "describe", "culture", "manage", "environment"],
  B1: ["accomplish", "perspective", "demonstrate", "significant", "consequence", "investigate", "approximately", "sufficient"],
  B2: ["scrutinize", "meticulous", "unprecedented", "ambiguous", "eloquent", "coherent", "autonomous", "reconcile"],
  C1: ["ephemeral", "perspicacious", "equivocate", "ameliorate", "recalcitrant", "obfuscate", "perfidious", "sycophant"],
  C2: ["solecism", "apophasis", "hendiadys", "tmesis", "antinomy", "synecdoche", "catachresis", "hapax"],
};

export const EN_DIFFICULTY: LangDifficulty = {
  getLevel,
  placementWords,
  levelLabel,
  systemName: "CEFR",
};
